This plugin is aimed at customers who have requirements which cannot be fulfilled by the out of the box Twilio Flex Salesforce Integration. Most of these requirements are centered around Screen Pops and Activity Logging. This is not a production ready plugin. This plugin is meant as a starting point for customizing the Twilio Flex Salesforce Integration. It is meant to make certain aspects of the Integration easy for the developer, such as initializing the openCTI API.

Set your accountSid and serviceBaseURL in /public/appConfig.js

To build, run npm run build.

To deploy, copy /build/plugin-ringback.js to your assets directory


This plugin is meant to be used in conjunction with the Dialpad Plugin found here: https://github.com/lehel-twilio/plugin-dialpad
The Salesforce ClickToDial functionality invokes the Twilio functions created by the dialpad plugin.

In order to load multiple plugins while developing this plugin, modify /public/plugins.json to include both plugins, like this:

[
  {
    "name": "SfdcPlugin",
    "version": "0.0.0",
    "class": "SfdcPlugin",
    "requires": [
      {
        "@twilio/flex-ui": "^1.0.0"
      }
    ],
    "src": "http://localhost:8080/plugin-sfdc.js"
  },
  {
    "name": "DialpadPlugin",
    "version": "3.2.0",
    "class": "DialpadPlugin",
    "requires": [
      {
        "@twilio/flex-ui": "^1.5.0"
      }
    ],
    "src": "https://your-twilio-domain/assets/plugin-dialpad.js"
  }
]
