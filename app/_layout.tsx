// app/_layout.tsx
import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import FooterBar, { TabKey } from '@/app/FooterBar';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // Simple sync from route to activeTab
  useEffect(() => {
    const root = segments[0] as string | undefined;

    if (root === 'Dashboard') {
      setActiveTab('dashboard');
    } else if (root === 'settings') {
      setActiveTab('settings');
    } else if (root === undefined || root === '' || root === 'ClockInOut') {
      // home/clock-in-out route
      setActiveTab('clock');
    }
  }, [segments]);

  const handleTabPress = (key: TabKey) => {
    setActiveTab(key);
    if (key === 'clock') {
      router.push('/ClockInOut');
    } else if (key === 'dashboard') {
      router.push('/Dashboard');
    } else if (key === 'user') {
      router.push('/Team&Member');
    } else if (key === 'settings') {
      router.push('/settings');
    }
  };

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
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
                <View className="ml-3 mr-2.5 h-7 w-7 rounded-sm border border-black">
                  <Entypo
                    onPress={() => router.push('/')}
                    name="chevron-with-circle-left"
                    size={24}
                    color="black"
                  />
                </View>
              ),
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
              headerLeft: () => (
                <View className="ml-3 mr-2.5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
              headerRight: () => (
                <View className="mb-5 mr-3 mt-5 flex-row">
                  <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                    <AntDesign
                      onPress={() => router.push('/Dashboard/index_2')}
                      name="plus"
                      className="p-1"
                      size={20}
                      color="black"
                    />
                  </View>
                  <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                    <AntDesign
                      onPress={() => router.push('/Dashboard/History')}
                      name="clock-circle"
                      className="p-1"
                      size={20}
                      color="black"
                    />
                  </View>
                </View>
              ),
            }}
          />

          <Stack.Screen
            name="Dashboard/editPage"
            options={{
              headerShown: true,
              headerTitle: '',
              headerBackVisible: false,
              headerStyle: {
                backgroundColor: '#292D32',
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerRight: () => (
                <View
                  style={{
                    marginBottom: 20,
                    marginRight: 12,
                    marginTop: 20,
                    flexDirection: 'row',
                    backgroundColor: 'transparent',
                  }}>
                  <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                    <MaterialCommunityIcons
                      onPress={() => router.push('/Dashboard/index_2')}
                      name="plus"
                      size={27}
                      color="black"
                    />
                  </View>

                  <View className="h-7 w-7 rounded-sm bg-white">
                    <AntDesign
                      onPress={() => router.push('/Dashboard/History')}
                      name="clock-circle"
                      size={23}
                      color="black"
                    />
                  </View>
                </View>
              ),
              headerLeft: () => (
                <View className="ml-3 mr-2.5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
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
                  <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                    <AntDesign
                      onPress={() => router.push('/Dashboard/History')}
                      name="clock-circle"
                      className="p-1"
                      size={20}
                      color="black"
                    />
                  </View>
                </View>
              ),
              headerLeft: () => (
                <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
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
                      size={27}
                      color="black"
                    />
                  </View>
                </View>
              ),
              headerLeft: () => (
                <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
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
              headerLeft: () => (
                <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
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
              headerLeft: () => (
                <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/Dashboard')}
                    name="arrow-u-left-top"
                    size={18}
                    color="white"
                  />
                </View>
              ),
            }}
          />

          <Stack.Screen
            name="Team&Member/index"
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
              headerLeft: () => (
                <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                  <MaterialCommunityIcons
                    onPress={() => router.push('/')}
                    name="arrow-u-left-top"
                    size={25}
                    color="white"
                  />
                </View>
              ),
            }}
          />
        </Stack>

        {/* <Stack.Screen
          name="ClockInOut/index"
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
            headerLeft: () => (
              <View className="bg-#292D32 mb-5 ml-3 mr-2.5 mt-5 h-7 w-7 rounded-sm border border-white">
                <MaterialCommunityIcons
                  onPress={() => router.push('/')}
                  name="arrow-u-left-top"
                  size={25}
                  color="white"
                />
              </View>
            ),
            headerRight: () => (
              <View className="mr-3 flex-row">
                <View className="mr-2 h-7 w-7 rounded-sm bg-white">
                  <AntDesign
                    onPress={() => router.push('/Dashboard/History')}
                    name="clock-circle"
                    className="p-1"
                    size={20}
                    color="black"
                  />
                </View>
              </View>
            ),
          }}
        /> */}

        {/* Global animated footer */}
        <FooterBar activeTab={activeTab} onTabPress={handleTabPress} />
      </View>

      <PortalHost />
    </ThemeProvider>
  );
}
