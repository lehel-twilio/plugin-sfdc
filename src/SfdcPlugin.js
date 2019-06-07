import { FlexPlugin } from 'flex-plugin';
import React from 'react';
import { SFDCIntegration } from './SFDCIntegration';

export default class SfdcPlugin extends FlexPlugin {
  name = 'SfdcPlugin';

  init(flex, manager) {

    //Initialize Salesforce openCTI
    const isLightning = window.location.ancestorOrigins[0].includes('.lightning.force.com');
    const sfdc = new SFDCIntegration(flex, manager, isLightning);
    sfdc.init();

    //Add Listener for ScreenPops
    flex.Actions.addListener('afterAcceptTask', (payload) => {
      isLightning ? sfdc.lightningScreenPop(payload) : sfdc.classicScreenPop(payload);
    });

    //Add Listener for Activity Logger
    flex.Actions.addListener('afterWrapupTask', (payload) => {
      isLightning ? sfdc.lightningLogActivity(payload) : sfdc.classicLogActivity(payload);
    })

    //Initialize Click to Call
    isLightning ? sfdc.lightningClickToCall() : sfdc.classicClickToCall();

    //hide the 3rd panel from Flex UI
    manager.updateConfig({
      componentProps: {
        AgentDesktopView: {
          showPanel2: false,
        },
      },
    });

  }
}
