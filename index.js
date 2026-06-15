/**
 * @format
 */

import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import App from './App';
import {name as appName} from './app.json';
import {runBackgroundComplianceCheck} from './src/services/BackgroundMonitorService';

AppRegistry.registerComponent(appName, () => App);

const backgroundFetchHeadlessTask = async event => {
  if (event.taskId) {
    await runBackgroundComplianceCheck();
    BackgroundFetch.finish(event.taskId);
  }
};

BackgroundFetch.registerHeadlessTask(backgroundFetchHeadlessTask);
