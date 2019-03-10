/*jslint node: true */
'use strict';

const glob = require('glob');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
require('dotenv').load({ silent: true });

handlebars.registerHelper('date', function(timestamp) 
{
  return new Date(timestamp).toString();
});


/*
 * Load all templates into a nice object like.
 *
 * {
 *   body: {
 *     outage: $template
 *   },
 * }
 */
function get_templates(base_directory) 
{
  const files     = glob.sync(path.join(base_directory, '**/*.hbs'));
  let templates = {};

  files.forEach(function(template_path) 
  {
    let parts      = path.parse(template_path);
    let contents   = fs.readFileSync(template_path);
    let parent_dir = parts.dir.split(path.sep).pop();

    if (!(parent_dir in templates)) {
      templates[parent_dir] = {};
    }
    templates[parent_dir][parts.name] = handlebars.compile(contents.toString());
    console.log('Found ' + parent_dir + ' template for ' + parts.name);
  });

  return templates;
}

/**
 * Get object with credentials for SendGrid
 * 
 * @returns Object
 */
function getSendGridCredentials()
{
  let options = null;

  if(process.env.WATCHMEN_SENDGRID_KEY)
  {
    options = {
      auth: {
          api_key: process.env.WATCHMEN_SENDGRID_KEY
      }
    }
  }else{
    options = {
      auth: {
          api_user: process.env.WATCHMEN_SENDGRID_USER,
          api_key: process.env.WATCHMEN_SENDGRID_PASSWORD
      }
    }
  }

  return options;
}

/*
 * Check if using default template location or one defined in environment
 */
let p = path.join(__dirname, 'templates');
if ('WATCHMEN_SENDGRID_TEMPLATE_DIRECTORY' in process.env) {
  p = process.env.WATCHMEN_SENDGRID_TEMPLATE_DIRECTORY;
  console.log('Loading templates from ' + p + ' instead of default templates.');
}
const templates = get_templates(p);

/*
 * Handle errors during email transport
 */
function emailError(err, info) {
  if (err) {
    return console.log(err);
  }
}

/*
 * Handle events from watchmen! The fun stuff!
 */
function handleEvent(eventName) 
{
  return function(service, data) 
  {

    // Don't bother if there's no template
    if (!(eventName in templates.body)) {
      return;
    }

    // If there is no Sendgrid infomration defined, don't do anything
    if( !process.env.WATCHMEN_SENDGRID_KEY 
      && (!process.env.WATCHMEN_SENDGRID_USER || process.env.WATCHMEN_SENDGRID_PASSWORD )) 
    {
      return;
    }

    let oOptions = getSendGridCredentials();
    let transporter = nodemailer.createTransport(sgTransport(oOptions));

    // Pass this stuff into the templates
    let context = { service: service, data: data };
     
    // Give us a template subject or default
    let subject = '[' + eventName + ']' + ' on ' + service.name;
    if (eventName in templates.subject) {
      subject = templates.subject[eventName](context);
    }

    let body = templates.body[eventName](context);

    transporter.sendMail({
      from: process.env.WATCHMEN_SENDGRID_EMAIL_FROM,
      to: service.alertTo,
      subject: subject,
      html: body
    }, emailError);
  };
}

/*
 * Any event from watchmen can have a template associated with it. If there's
 * one in templates/body/, a message will be sent to notify support teams!
 */
function ChatBotPlugin(watchmen) {
  watchmen.on('latency-warning', handleEvent('latency-warning'));
  watchmen.on('new-outage',      handleEvent('new-outage'));
  watchmen.on('current-outage',  handleEvent('current-outage'));
  watchmen.on('service-back',    handleEvent('service-back'));
  watchmen.on('service-error',   handleEvent('service-error'));
  watchmen.on('service-ok',      handleEvent('service-ok'));
}

exports = module.exports = ChatBotPlugin;
