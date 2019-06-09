import { initiateOpenCTI } from './initiateOpenCTI';

export class SFDCIntegration {
  constructor(flex, manager, isLightning) {
    this.flex = flex;
    this.manager = manager;
    this.isLightning = isLightning;
    this.sfdcBaseUrl = window.location.ancestorOrigins[0];
    this.sfApi = isLightning ? window.sforce.opencti : window.sforce.interaction;
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

    if (!payload.task) {
      return;
    }

    const { attributes } = payload.task;
    const { direction } = attributes;
    let callType = this.CALL_TYPE.INBOUND;
    let searchParameter = payload.task.attributes.name;
    this.currentObjectId = null;
    this.currentObjectType = null;

    if (payload.task.taskChannelUniqueName === 'voice' && direction === 'outbound') {
      callType = this.CALL_TYPE.OUTBOUND;
      searchParameter = attributes.to;
    }

    if (attributes.sfdcSearchString && attributes.sfdcSearchString.trim()) {
      searchParameter = attributes.sfdcSearchString;
    }

    this.sfApi.getPageInfo(response => {
      const responseResult = response && response.result && JSON.parse(response.result);
      const objectId = responseResult && responseResult.objectId;
      const objectType = responseResult && responseResult.object;

      if (typeof(payload.task.attributes.SFDCUrl) !== 'undefined') {
        console.log('Calling screenPop function');
        console.log(payload.task.attributes.SFDCUrl);
        this.sfApi.screenPop(`/${taskPayload.task.attributes.SFDCUrl}`, true, result => {
        })
      } else {
        this.sfApi.searchAndScreenPop(searchParameter, 'popReason=Flex', callType, result => {
          const searchResult = result && result.result && JSON.parse(result.result);
          const searchedRecordId = searchResult && Object.keys(searchResult).length === 1 && Object.keys(searchResult)[0];

          if ((searchedRecordId && objectId === searchedRecordId) || (direction === 'outbound' && objectId && objectType)) {
            const taskObj = { result: `{"${objectId}":{"object":"${objectType}"}}` };

            return;
          }
        });
      }
    });
  }

  lightningLogActivity(payload) {
    console.log('Running Lightning activity logger');

    if (typeof(payload.task) !== 'undefined') {
      this.sfdcActivityId = this.props.task.attributes.sfdcActivityId;

      this.sfApi.saveLog({
        value: {
          Id: this.sfdcActivityId,
          param: value
        },
        (success, returnValue, errors) => {
          if success {
            console.log('Successfully saved activity');
            console.log(returnValue);
          }
        }
      });
    }
  }

  classicScreenPop(payload) {
    console.log('Running Classic screenPop function');

    this.sfApi.saveLog('Task', `WhatID=${this.state.selectedCaseId}&Subject=Call&Description=4154561515`, result => {
      console.log('Log successfully saved');
      console.log(result);
    })
  }

  lightningScreenPop(payload) {
    console.log('Running Lightning screenPop function');

    if (!payload.task) {
      return;
    }

    const { direction } = payload.task.attributes;
    let taskType = this.CALL_TYPE.INBOUND;
    let searchParameter = payload.task.attributes.name;

    if (taskPayload.task.attributes.sfdcSearchString && taskPayload.task.attributes.sfdcSearchString.trim()) {
      searchParameter = taskPayload.task.attributes.sfdcSearchString;
    }

    if (taskPayload.task.taskChannelUniqueName === 'voice' && direction === 'outbound') {
      taskType = this.CALL_TYPE.OUTBOUND;
      searchParameter = payload.task.attributes.to;
    }

    return this.sfApi.getAppViewInfo({
      callback: response => {
        const responseReturnedValue = response && response.returnValue;
        const currentRecordId = responseReturnedValue && responseReturnedValue.recordId;

        if (typeof(payload.task.attributes.sfdcUrl) !== 'undefined') {
          console.log('Calling screenPop action');
          console.log('type: sforce.opencti.SCREENPOP_TYPE.URL');
          console.log(`params: { url: ${taskPayload.task.attributes.sfdcUrl} }`);

          let screenPopUrl = payload.task.attributes.sfdcUrl;
          const taskSid = payload.task.taskSid;
          const channelSid = payload.task.attributes.channelSid;
          screenPopUrl = screenPopUrl.includes('?') ? `${screenPopUrl}&taskSid=${taskSid}&channelSid=${channelSid}` : `${screenPopUrl}?taskSid=${taskSid}&channelSid=${channelSid}`

          this.sfApi.screenPop({
            type: window.sforce.opencti.SCREENPOP_TYPE.URL,
            params : { url: screenPopUrl }
          })

        } else if (typeof(taskPayload.task.attributes.sfdcObjectId) !== 'undefined') {
          console.log('Calling screenPop action');
          console.log('type: sforce.opencti.SCREENPOP_TYPE.SOBJECT');
          console.log(`params : { recordId: ${taskPayload.task.attributes.sfdcObjectId} }`);

          this.sfApi.screenPop({
            type: window.sforce.opencti.SCREENPOP_TYPE.SOBJECT,
            params : { recordId: taskPayload.task.attributes.sfdcObjectId }
          })

        } else {
          console.log('Calling searchAndScreenPop action');
          console.log(`searchParams: ${searchParameter}`);

          this.sfApi.searchAndScreenPop({
            searchParams: searchParameter,
            callType: taskType,
            defaultFieldValues: {
              Phone: searchParameter,
            },
            deferred: true,
            callback: result => {
              const screenPopData = result && result.returnValue && result.returnValue.SCREEN_POP_DATA;
              const searchedRecordId = screenPopData && screenPopData.params && screenPopData.params.recordId;

              if (
                (searchedRecordId && searchedRecordId === currentRecordId) ||
                (direction === 'outbound' && currentRecordId && responseReturnedValue.objectType)
              ) {
                const { recordId, objectType } = responseReturnedValue;
                const returnValue = {
                  returnValue: {
                    [recordId]: {
                      Id: recordId,
                      RecordType: objectType,
                    },
                    SCREEN_POP_DATA: {
                      params: {
                        recordId,
                      },
                    },
                  },
                };
                return;
              }
            },
          });
        }
      },
    });
  }

}
