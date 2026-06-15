import type {StackNavigationProp} from '@react-navigation/stack';
import type {RouteProp} from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  UnauthorizedApps: undefined;
  AllApps: undefined;
  Settings: undefined;
};

export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Home'
>;

export type UnauthorizedAppsNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UnauthorizedApps'
>;

export type AllAppsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AllApps'
>;

export type SettingsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Settings'
>;

export type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;
