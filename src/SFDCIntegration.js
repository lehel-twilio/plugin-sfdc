import { initiateOpenCTI } from './initiateOpenCTI';

export class SFDCIntegration {
  constructor(flex, manager, isLightning) {
    this.flex = flex;
    this.manager = manager;
    this.isLightning = isLightning;
    this.sfdcBaseUrl = window.location.ancestorOrigins[0];
  }

  async init() {
    const sfdcUrl = this.isLightning ? `${this.sfdcBaseUrl}/support/api/45.0/lightning/opencti_min.js` : `${this.sfdcBaseUrl}/support/api/46.0/interaction.js`;
    await initiateOpenCTI(sfdcUrl);
  }

  classicClickToCall() {
    console.log('Running Classic Click to Call function');
  }

  lightningClickToCall() {
    console.log('Running Lightning Click to Call function');
  }

  classicLogActivity(payload) {
    console.log('Running Classic activity logger');
  }

  lightningLogActivity(payload) {
    console.log('Running Lightning activity logger');
  }

  classicScreenPop(payload) {
    console.log('Running Classic screenPop function');
  }

  lightningScreenPop(payload) {
    console.log('Running Lightning screenPop function');
  }

}
