import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { TabActions, ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { Image } from 'react-native-svg';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { StackScreen } from 'react-native-screens';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { View } from 'react-native';
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Button } from '@/components/ui/button';
import ScreenFooter, {
  FooterComponent,
} from 'react-native-screens/lib/typescript/components/ScreenFooter';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const Tab = createBottomTabNavigator();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: true,
            headerTitle: 'This is a setting page',
            headerBackVisible: false,
            headerRight: () => <Feather name="settings" size={24} color="black" />,
            headerLeft: () => (
              <Entypo
                onPress={() => router.push('/')}
                name="chevron-with-circle-left"
                size={24}
                color="black"
              />
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />
        <Stack.Screen
          name="Dashboard/index"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            headerRight: () => (
              <View className="mb-5 mr-3 mt-5 flex-row">
                <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard/index_2')}
                    name="plus"
                    size={20}
                    color="black"
                    className="m-1 flex items-center justify-center"
                  />
                </View>

                <View className="h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    onPress={() => router.push('/Dashboard/History')}
                    name="clock-circle"
                    size={16}
                    color="black"
                    className="m-1.5 flex items-center justify-center"
                  />
                </View>
              </View>
            ),

            headerLeft: () => (
              <View className="bg-#292D32 ml-3 mr-2.5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/index_2"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            headerRight: () => (
              <View className="mr-3 flex-row">
                {/* <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                  <MaterialCommunityIcons

                    name="plus"
                    size={20}
                    color="black"
                    className="m-1 flex items-center justify-center"
                  />
                </View> */}

                <View className="h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    onPress={() => router.push('/Dashboard/History')}
                    name="clock-circle"
                    size={16}
                    color="black"
                    className="m-1.5 flex items-center justify-center"
                  />
                </View>
              </View>
            ),

            headerLeft: () => (
              <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/index_3"
          options={{
            headerShown: true,

            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            headerRight: () => (
              <View className="mr-3 flex-row">
                {/* <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                  <MaterialCommunityIcons

                    name="plus"
                    size={20}
                    color="black"
                    className="m-1 flex items-center justify-center"
                  />
                </View> */}

                <View className="mb-5 mt-5 h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    onPress={() => router.push('/Dashboard/History')}
                    name="clock-circle"
                    size={16}
                    color="black"
                    className="m-1.5 flex items-center justify-center"
                  />
                </View>
              </View>
            ),

            headerLeft: () => (
              <View className="bg-#292D32 ml-3 mr-2.5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/index_4"
          options={{
            headerShown: true,

            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            headerRight: () => (
              <View className="mr-3 flex-row">
                {/* <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                  <MaterialCommunityIcons

                    name="plus"
                    size={20}
                    color="black"
                    className="m-1 flex items-center justify-center"
                  />
                </View> */}

                <View className="mb-5 mt-5 h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    onPress={() => router.push('/Dashboard/History')}
                    name="clock-circle"
                    size={16}
                    color="black"
                    className="m-1.5 flex items-center justify-center"
                  />
                </View>
              </View>
            ),

            headerLeft: () => (
              <View className="bg-#292D32 ml-3 mr-2.5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/History"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            headerRight: () => (
              <View className="mr-3 flex-row">
                <View className="mr-1 h-7 w-7 rounded-sm bg-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard/index_2')}
                    name="plus"
                    size={20}
                    color="black"
                    className="m-1 flex items-center justify-center"
                  />
                </View>

                {/* <View className="h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    name="clock-circle"
                    size={16}
                    color="black"
                    className="m-1.5 flex items-center justify-center"
                  />
                </View> */}
              </View>
            ),

            headerLeft: () => (
              <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/ProgressDetail"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            // headerRight: () => (
            //   <View className="mr-3 flex-row">
            //     <View className="mr-1 h-7 w-7 rounded-sm bg-white">
            //       <MaterialCommunityIcons
            //         onPress={() => router.push('/Dashboard/index_2')}
            //         name="plus"
            //         size={20}
            //         color="black"
            //         className="m-1 flex items-center justify-center"
            //       />
            //     </View>

            //     {/* <View className="h-7 w-7 rounded-sm bg-white">
            //       <AntDesign
            //         name="clock-circle"
            //         size={16}
            //         color="black"
            //         className="m-1.5 flex items-center justify-center"
            //       />
            //     </View> */}
            //   </View>
            // ),

            headerLeft: () => (
              <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />

        <Stack.Screen
          name="Dashboard/ProgressFinalDetail"
          options={{
            headerShown: true,
            headerTitle: '',
            headerBackVisible: false,
            headerStyle: {
              backgroundColor: '#292D32',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },

            // headerRight: () => (
            //   <View className="mr-3 flex-row">
            //     <View className="mr-1 h-7 w-7 rounded-sm bg-white">
            //       <MaterialCommunityIcons
            //         onPress={() => router.push('/Dashboard/index_2')}
            //         name="plus"
            //         size={20}
            //         color="black"
            //         className="m-1 flex items-center justify-center"
            //       />
            //     </View>

            //     {/* <View className="h-7 w-7 rounded-sm bg-white">
            //       <AntDesign
            //         name="clock-circle"
            //         size={16}
            //         color="black"
            //         className="m-1.5 flex items-center justify-center"
            //       />
            //     </View> */}
            //   </View>
            // ),

            headerLeft: () => (
              <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/Dashboard/ProgressDetail')}
                  name="arrow-u-left-top"
                  size={18}
                  color="white"
                  className="m-1"
                />
              </View>
            ),
            // headerBackImageSource: () => (<Image></Image>)
          }}
        />
      </Stack>

      <PortalHost />
    </ThemeProvider>
  );
}
