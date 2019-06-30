# watchmen-plugin-sendgird

A plugin for [watchmen](https://github.com/iloire/watchmen) to send
email notifications making use of SendGrid.

## Templates

This plugin comes with default templates written in
[Handlebars](http://handlebarsjs.com/)
for new outages and service back events. Each event has a body and subject
template.

You can override templates by copying the included template folder into a new
location and specifying this in your environment variables (see below).

Body templates must go in `templates/body` and subject templates in
`templates/subject`

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
[here: Creating Your Own Plugin](https://github.com/iloire/watchmen/blob/master/README.md#creating-your-own-plugin)

## Environment variables

The following sample configures the Sendgrid information and specifies a custom template
directory—overriding the default included templates as explained above.

```
WATCHMEN_SENDGRID_KEY='SENDGRID_API_KEY'
WATCHMEN_SENDGRID_EMAIL_FROM=lorranpego@gmail.com
WATCHMEN_SENDGRID_TEMPLATE_DIRECTORY=/home/watchmen/templates
```

or

```
WATCHMEN_SENDGRID_USER='SENDGRID_USERNAME'
WATCHMEN_SENDGRID_PASSWORD='SENDGRID_PASSWORD'
WATCHMEN_SENDGRID_EMAIL_FROM=lorranpego@gmail.com
WATCHMEN_SENDGRID_TEMPLATE_DIRECTORY=/home/watchmen/templates
```