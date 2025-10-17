import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useThemeContext } from '../contexts/ThemeContext';

// Import your screens
import DashboardScreen from '../../app/(student)/index';
import ExamsScreen from '../../app/(student)/exams';
import HomeworkScreen from '../../app/(student)/homework';
import ResultsScreen from '../../app/(student)/results';
import JoinSubjectScreen from '../../app/(student)/join-subject';
import ProfileScreen from '../../app/(student)/profile';

const Stack = createStackNavigator();

export default function SmoothNavigator() {
  const { fontFamily, colors } = useThemeContext();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          transitionSpec: {
            open: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
            close: {
              animation: 'timing',
              config: {
                duration: 300,
              },
            },
          },
          cardStyleInterpolator: ({ current, layouts }) => {
            return {
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            };
          },
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Exams" component={ExamsScreen} />
        <Stack.Screen name="Homework" component={HomeworkScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        <Stack.Screen name="JoinSubject" component={JoinSubjectScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
