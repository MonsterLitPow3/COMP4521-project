import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { Image } from 'react-native-svg';
import Feather from '@expo/vector-icons/Feather';
import Entypo from '@expo/vector-icons/Entypo';
import { StackScreen } from 'react-native-screens';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen
          name="settings/index"
          options={{
            headerShown: true,
            headerTitle: 'wow this is stupid',
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
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
