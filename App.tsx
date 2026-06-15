import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {HomeScreen} from './src/screens/HomeScreen';
import {UnauthorizedAppsScreen} from './src/screens/UnauthorizedAppsScreen';
import {AllAppsScreen} from './src/screens/AllAppsScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {
  initNotifications,
  setupNotificationHandlers,
} from './src/services/NotificationService';
import {COLORS} from './src/utils/constants';
import type {RootStackParamList} from './src/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    return setupNotificationHandlers(() => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('UnauthorizedApps');
      }
    });
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {backgroundColor: COLORS.card},
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: {fontWeight: '700'},
            cardStyle: {backgroundColor: COLORS.background},
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="UnauthorizedApps"
            component={UnauthorizedAppsScreen}
            options={{title: 'Unauthorized Apps'}}
          />
          <Stack.Screen
            name="AllApps"
            component={AllAppsScreen}
            options={{title: 'All Apps'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

export default App;
