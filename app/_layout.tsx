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
import { Platform, View } from 'react-native';
import FooterBar, { TabKey } from '@/app/FooterBar';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

  // current top‑level route segment: '' or undefined means index
  const root = (segments[0] as string | undefined) ?? '';

  // sync activeTab from route
  useEffect(() => {
    if (root === 'Dashboard') {
      setActiveTab('dashboard');
    } else if (root === 'settings') {
      setActiveTab('settings');
    } else if (root === 'Team&Member') {
      setActiveTab('user');
    } else if (root === '' || root === undefined) {
      // home/clock‑in‑out route
      setActiveTab('clock');
    }
  }, [root]);

  const handleTabPress = (key: TabKey) => {
    setActiveTab(key);
    if (key === 'clock') {
      router.push('/');
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

          {/* Settings root (custom header inside screen) */}
          <Stack.Screen
            name="settings/index"
            options={{
              headerShown: false,
              headerTitle: '',
              headerBackVisible: Platform.OS === 'ios',
              headerStyle: {
                backgroundColor: '#292D32',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />

          {/* Dashboard screens – all use custom headers now */}
          <Stack.Screen name="Dashboard/index" options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard/editPage" options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard/index_2" options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard/History" options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard/ProgressDetail" options={{ headerShown: false }} />

          <Stack.Screen name="Dashboard/ProgressFinalDetail" options={{ headerShown: false }} />

          {/* Team & Member screens – all use custom headers now */}
          <Stack.Screen name="Team&Member/index" options={{ headerShown: false }} />

          <Stack.Screen name="Team&Member/createTeam" options={{ headerShown: false }} />

          <Stack.Screen name="Team&Member/joinTeam" options={{ headerShown: false }} />
        </Stack>

        {/* Global animated footer – show on all pages except index */}
        {root !== '' && <FooterBar activeTab={activeTab} onTabPress={handleTabPress} />}
      </View>

      <PortalHost />
    </ThemeProvider>
  );
}
