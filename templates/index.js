/*jslint node: true */
'use strict';

const glob       = require('glob');
const handlebars = require('handlebars');
const axios      = require('axios');
const path       = require('path');
const fs         = require('fs');
require('dotenv').load({ silent: true });

handlebars.registerHelper('date', function(timestamp) 
{
  return new Date(timestamp).toString();
});


/*
 * Load all templates into a nice object like…
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

/*
 * Check if using default template location or one defined in environment
 */
let p = path.join(__dirname, 'templates');
if ('WATCHMEN_BOT_TEMPLATE_DIRECTORY' in process.env) {
  p = process.env.WATCHMEN_BOT_TEMPLATE_DIRECTORY;
  console.log('Loading templates from ' + p + ' instead of default templates.');
}
const templates = get_templates(p);

/*
 * Handle errors during email transport
 */
function messageError(err, info) {
  if (err) {
    return console.log(err);
  }

  console.log(info);
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

    // If there is no BOT URI defined, don't do anything
    if( !process.env.WATCHMEN_BOT_URI ) {
      return;
    }

    // Pass this stuff into the templates
    let context = { service: service, data: data };

    let sMessage = templates.body[eventName](context);

    axios.post(process.env.WATCHMEN_BOT_URI, {
      message: sMessage,
    })
    .then(function (response) {
      console.log("Message sent: ", sMessage);
    })
    .catch(function (error) {
      messageError();
    });
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
