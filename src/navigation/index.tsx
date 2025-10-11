// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useAuth } from '../contexts/AuthContext';
// import { View, Text, ActivityIndicator } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // Screens
// import LoginScreen from '../../app/(auth)/login';
// import StudentDashboard from '../../app/(student)/student';
// import TeacherDashboard from '../../app/(student)/teacher';

// const Stack = createNativeStackNavigator();
// const Tab = createBottomTabNavigator();

// function TabsNavigator() {
//   const { user } = useAuth();

//   if (user?.role === 'student') {
//     return (
//       <Tab.Navigator
//         screenOptions={{
//           tabBarActiveTintColor: '#3b82f6',
//           tabBarInactiveTintColor: '#6b7280',
//           tabBarStyle: {
//             backgroundColor: '#ffffff',
//             borderTopColor: '#e5e7eb',
//           },
//           headerStyle: {
//             backgroundColor: '#3b82f6',
//           },
//           headerTintColor: '#ffffff',
//           headerTitleStyle: {
//             fontWeight: 'bold',
//           },
//         }}
//       >
//         <Tab.Screen
//           name="StudentDashboard"
//           component={StudentDashboard}
//           options={{
//             title: 'Student Dashboard',
//             tabBarIcon: ({ color, size }) => (
//               <Ionicons name="school" size={size} color={color} />
//             ),
//           }}
//         />
//       </Tab.Navigator>
//     );
//   }

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarActiveTintColor: '#3b82f6',
//         tabBarInactiveTintColor: '#6b7280',
//         tabBarStyle: {
//           backgroundColor: '#ffffff',
//           borderTopColor: '#e5e7eb',
//         },
//         headerStyle: {
//           backgroundColor: '#3b82f6',
//         },
//         headerTintColor: '#ffffff',
//         headerTitleStyle: {
//           fontWeight: 'bold',
//         },
//       }}
//     >
//       <Tab.Screen
//         name="TeacherDashboard"
//         component={TeacherDashboard}
//         options={{
//           title: 'Teacher Dashboard',
//           tabBarIcon: ({ color, size }) => (
//             <Ionicons name="person" size={size} color={color} />
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// function LoadingScreen() {
//   return (
//     <View className="flex-1 justify-center items-center bg-gray-50">
//       <ActivityIndicator size="large" color="#3b82f6" />
//       <Text className="text-gray-600 mt-4 text-base">Loading...</Text>
//     </View>
//   );
// }

// export default function Navigation() {
//   const { isAuthenticated, loading } = useAuth();

//   if (loading) {
//     return <LoadingScreen />;
//   }

//   return (
//     <NavigationContainer>
//       <Stack.Navigator screenOptions={{ headerShown: false }}>
//         {!isAuthenticated ? (
//           <Stack.Screen name="Login" component={LoginScreen} />
//         ) : (
//           <Stack.Screen name="Tabs" component={TabsNavigator} />
//         )}
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }