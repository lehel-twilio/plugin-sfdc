import { initiateOpenCTI } from './initiateOpenCTI';

export class SFDCIntegration {
  constructor(flex, manager, isLightning) {
    this.flex = flex;
    this.manager = manager;
    this.isLightning = isLightning;
    this.sfdcBaseUrl = window.location.ancestorOrigins[0];
  }

  async init() {
    const sfdcUrl = this.isLightning ? `${this.sfdcBaseUrl}/support/api/45.0/lightning/opencti_min.js` : `${this.sfdcBaseUrl}/support/api/45.0/interaction.js`;
    await initiateOpenCTI(sfdcUrl);

    this.sfApi = this.isLightning ? window.sforce.opencti : window.sforce.interaction;

    //Initialize Click to Call
    this.isLightning ? this.lightningClickToCall() : this.classicClickToCall();
  }

  classicClickToCall() {
    console.log('Running Classic Click to Call function');

    this.sfApi.cti.enableClickToDial((response) => {
      if (response.result) {
        console.log('enableClickToDial method call executed successfully! returnValue:', response.result);
      } else {
        console.error('Something went wrong calling enableClickToDial! Errors:', response);
      }
    });

    this.sfApi.cti.onClickToDial((response) => {
      const jsonResponse = JSON.parse(response.result);
      console.log(`Calling ${jsonResponse.number}`);

      fetch(`https://${this.manager.serviceConfiguration.runtime_domain}/create-new-task`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: `From=${this.manager.store.getState().flex.worker.attributes.phone}&To=${jsonResponse.number}&Worker=${this.manager.store.getState().flex.worker.attributes.contact_uri}&Internal=false&Token=${this.manager.store.getState().flex.session.ssoTokenPayload.token}`
      })
      .then(response => response.json())
      .then(json => {
        console.log('Outbound call dialed successfully');
        console.log(json);
      })
    });
  }

  lightningClickToCall() {
    console.log('Running Lightning Click to Call function');

    this.sfApi.enableClickToDial({callback: (response) => {
      if (response.success) {
        console.log('enableClickToDial method call executed successfully! returnValue:', response.returnValue);
      } else {
        console.error('Something went wrong calling enableClickToDial! Errors:', response.errors);
      }
    }});

    this.sfApi.onClickToDial({listener: (payload) => {
      console.log(`Calling ${payload.number}`);

      fetch(`https://${this.manager.serviceConfiguration.runtime_domain}/create-new-task`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: `From=${this.manager.store.getState().flex.worker.attributes.phone}&To=${payload.number}&Worker=${this.manager.store.getState().flex.worker.attributes.contact_uri}&Internal=false&Token=${this.manager.store.getState().flex.session.ssoTokenPayload.token}`
      })
      .then(response => response.json())
      .then(json => {
        console.log('Outbound call dialed successfully');
        console.log(json);
      })
    }});
  }

  classicLogActivity(payload) {
    console.log('Running Classic activity logger');

    if (typeof(payload.task) !== 'undefined') {

      const today = new Date();
      const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      const time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
      const dateTime = date + ' ' + time;

      this.sfApi.saveLog('Task', `Subject=Sample Task created at ${dateTime}&Description=4154561515`, result => {
        console.log('Log successfully saved');
        console.log(result);
      })
    }
  }

  lightningLogActivity(payload) {
    console.log('Running Lightning activity logger');

    if (typeof(payload.task) !== 'undefined') {

      const today = new Date();
      const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
      const time = today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();
      const dateTime = date + ' ' + time;

      this.sfApi.saveLog({
        value: {
          entityApiName: 'Task',
          Subject: `Sample Task created at ${dateTime}`,
          Description: '4154561515'
        },
        callback: (success, returnValue, errors) => {
          if (success) {
            console.log('Successfully saved activity');
            console.log(returnValue);
          }
        }
      });
    }
  }

  classicScreenPop(payload) {
    console.log('Running Classic screenPop function');

    if (!payload.task) {
      return;
    }

    const { attributes } = payload.task;
    const { direction } = attributes;
    let callType = 'inbound';
    let searchParameter = attributes.name;
    this.currentObjectId = null;
    this.currentObjectType = null;

    if (payload.task.taskChannelUniqueName === 'custom1' && direction === 'outbound') {
      callType = 'outbound';
      searchParameter = attributes.to;
    }

    if (attributes.sfdcSearchString && attributes.sfdcSearchString.trim()) {
      searchParameter = attributes.sfdcSearchString;
    }

    this.sfApi.getPageInfo(response => {

      if (typeof(attributes.SFDCUrl) !== 'undefined') {
        console.log('Calling screenPop function');
        console.log(attributes.SFDCUrl);
        this.sfApi.screenPop(`/${attributes.SFDCUrl}`, true, result => {
        })
      } else {
        this.sfApi.searchAndScreenPop(searchParameter, 'popReason=Flex', callType, result => {
          console.log('Hitting the callback function');
          console.log(result);
        });
      }
    });
  }

  lightningScreenPop(payload) {
    console.log('Running Lightning screenPop function');

    if (!payload.task) {
      return;
    }

    const { attributes } = payload.task;
    const { direction } = attributes;
    let taskType = this.sfApi.CALL_TYPE.INBOUND;
    let searchParameter = attributes.name;

    if (attributes.sfdcSearchString && attributes.sfdcSearchString.trim()) {
      searchParameter = attributes.sfdcSearchString;
    }

    if (payload.task.taskChannelUniqueName === 'custom1' && direction === 'outbound') {
      taskType = this.sfApi.CALL_TYPE.OUTBOUND;
      searchParameter = attributes.to;
    }

    return this.sfApi.getAppViewInfo({
      callback: response => {

        if (typeof(attributes.sfdcUrl) !== 'undefined') {
          console.log('Calling screenPop action');
          console.log('type: sforce.opencti.SCREENPOP_TYPE.URL');
          console.log(`params: { url: ${attributes.sfdcUrl} }`);

          let screenPopUrl = attributes.sfdcUrl;
          const taskSid = payload.task.taskSid;
          const channelSid = payload.task.attributes.channelSid;
          screenPopUrl = screenPopUrl.includes('?') ? `${screenPopUrl}&taskSid=${taskSid}&channelSid=${channelSid}` : `${screenPopUrl}?taskSid=${taskSid}&channelSid=${channelSid}`

          this.sfApi.screenPop({
            type: this.sfApi.SCREENPOP_TYPE.URL,
            params : { url: screenPopUrl }
          })

        } else if (typeof(attributes.sfdcObjectId) !== 'undefined') {
          console.log('Calling screenPop action');
          console.log('type: sforce.opencti.SCREENPOP_TYPE.SOBJECT');
          console.log(`params : { recordId: ${attributes.sfdcObjectId} }`);

          this.sfApi.screenPop({
            type: this.sfApi.SCREENPOP_TYPE.SOBJECT,
            params : { recordId: attributes.sfdcObjectId }
          })

        } else {
          console.log('Calling searchAndScreenPop action');
          console.log(`searchParams: ${searchParameter}`);
          console.log(taskType);

          this.sfApi.searchAndScreenPop({
            searchParams: searchParameter,
            callType: taskType,
            defaultFieldValues: {
              Phone: searchParameter,
            },
            deferred: false,
            callback: result => {

              console.log('Hitting the callback function');
              console.log(result);

            }
          });
        }
      }
    });
  }

}
