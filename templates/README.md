# watchmen-plugin-googlechatbot

A plugin for [watchmen](https://github.com/iloire/watchmen) to send message
notifications on service events via ChatBot (preferably Google).

Inspired by [watchmen-plugin-nodemailer](https://github.com/wiseNhammer/watchmen-plugin-nodemailer).

## Templates

This plugin comes with default templates written in
[Handlebars](http://handlebarsjs.com/)
for new outages and service back events. Each event has a body template.

You can override templates by copying the included template folder into a new
location and specifying this in your environment variables (see below).

Message templates must go in `templates/body`.

Their filenames should correspond to the watchmen event they're for. For
example, `templates/body/new-outage.hbs`. The plugin will compile all templates
when loaded and send email for any body template it loads. This means if you
want to send an email for the `latency-warning` event, simply create a template
at `templates/body/latency-warning.hbs` and restart watchmen.

```
{{service.name}} ({{service.url}}) is back online after the outage on {{date data.timestamp}}
```

Templates are passed a `service` object and a `data` object. The `data` object
contains the second argument of the event, usually data on the current or last
outage. See what the events get passed
[here: https://github.com/iloire/watchmen/blob/master/README.md#creating-your-own-plugin](https://github.com/iloire/watchmen/blob/master/README.md#creating-your-own-plugin)

## Environment variables

The following sample configures the chabot end-point and specifies a custom template
directory—overriding the default included templates as explained above.

```
WATCHMEN_BOT_URI=https://chatbot.example.com/ext/message
WATCHMEN_BOT_TEMPLATE_DIRECTORY=/home/watchmen/templates
```

##  Sending Message

This plugin will sent a message with Axios always using `POST` method to the End-point provided and include the parameter `message` on the request's body.

Example:
```js
axios.post(process.env.WATCHMEN_BOT_URI, {
    message: sMessage,
})
.then(function (response) {
    console.log("Message sent: ", sMessage);
})
.catch(function (error) {
    messageError();
});
```