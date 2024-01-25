import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: '75bc6614-e228-47d7-beaa-4f3aabd4cfeb',
  clientToken: 'pubacc9fb48f8ed4c8e23c93f230cf99e36',
  site: 'datadoghq.com',
  service: 'ts_viewer',
  env: 'prod',
  // Specify a version number to identify the deployed version of your application in Datadog
  // version: '1.0.0',
  sessionSampleRate: 5,
  sessionReplaySampleRate: 0,
  trackUserInteractions: true,
  trackResources: true,
  trackLongTasks: true,
  defaultPrivacyLevel: 'mask-user-input',
});
