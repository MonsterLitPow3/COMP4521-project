// app/index.tsx
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack, useRouter } from 'expo-router';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, TextInput } from 'react-native';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '@/utils/supabase';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/registerForPushNotificationsAsync';

const LOGO = {
  light: require('@/assets/images/react-native-reusables-light.png'),
  dark: require('@/assets/images/react-native-reusables-dark.png'),
};

const SCREEN_OPTIONS = {
  title: 'React Native Reusables',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/utils/registerForPushNotificationsAsync';
import ClockInOutScreen from './ClockInOut';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function Screen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<any>(null);

  // notification setup
  const [expoPushToken, setExpoPushToken] = React.useState('');
  const [notification, setNotification] = React.useState<Notifications.Notification | undefined>(
    undefined
  );

  React.useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(String(error)));

    const notificationListener = Notifications.addNotificationReceivedListener((n) => {
      setNotification(n);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log(response);
    });

    return () => {
      authListener.subscription.unsubscribe();
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const handleSignUp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Sign-up email sent. Check your inbox.\nBut if you have signed up before, the email will not be sent.');
        alert('If you have confirmed sign-up before, please sign in directly and do not sign up again.');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const upsertPushToken = async (session: any | null, token: string) => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: session.user.id, expo_push_token: token })
      .select()
      .single();
    if (error) {
      console.log('Error upserting push token:', error.message);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else {
        console.log('Signed in successfully');
        setEmail('');
        setPassword('');
        await upsertPushToken(data.session, expoPushToken);
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await upsertPushToken(session, '');
      const { error } = await supabase.auth.signOut();
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed out successfully');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // passwordless (OTP) sign-in
  const [passwordLess, setPasswordLess] = React.useState(false);
  const [otp, setOtp] = React.useState('');

  const handleForgotPassword = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('One time password sent to your email. Check your inbox.');
        setPassword('');
        setPasswordLess(true);
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInWithOtp = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      if (error) {
        setMessage(error.message);
      } else {
        console.log('Signed in successfully with OTP');
        setEmail('');
        setOtp('');
        setPasswordLess(false);
        await upsertPushToken(data.session);
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const inputTextStyle = { color: isDark ? '#ffffff' : '#000000' };

  // OTP form
  if (!session && passwordLess) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center p-4">
          <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />

          <View className="mt-8 w-full max-w-xs gap-4 p-4">
            <Text className="mb-4 text-center text-xl font-bold">Sign In to Your Account</Text>

            <Text className="text-sm text-muted-foreground">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="ios:text-foreground rounded border bg-transparent px-3 py-2"
              style={inputTextStyle}
            />

            <Text className="text-sm text-muted-foreground">One Time Password</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              className="ios:text-foreground rounded border bg-transparent px-3 py-2"
              style={inputTextStyle}
            />

            <View className="flex-row gap-2">
              <Button
                variant="outline"
                disabled={loading}
                onPress={handleSignInWithOtp}
                className="flex-1">
                <Text>{loading ? 'Please wait...' : 'Sign In With OTP'}</Text>
              </Button>
            </View>

            {message ? (
              <Text className="mt-2 text-center text-sm text-foreground">{message}</Text>
            ) : null}
          </View>
        </View>
      </>
    );
  }

  // email/password sign-in + sign-up form
  if (!session) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center p-4">
          <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />

          <View className="mt-8 w-full max-w-xs gap-4 p-4">
            <Text className="mb-4 text-center text-xl font-bold">Sign In to Your Account</Text>

            <Text className="text-sm text-muted-foreground">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="ios:text-foreground rounded border bg-transparent px-3 py-2"
              style={inputTextStyle}
            />

            <Text className="text-sm text-muted-foreground">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              className="ios:text-foreground rounded border bg-transparent px-3 py-2"
              style={inputTextStyle}
            />

            <View className="flex-row gap-2">
              <Button disabled={loading} onPress={handleSignUp} className="flex-1">
                <Text>{loading ? 'Please wait...' : 'Sign Up'}</Text>
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                onPress={handleSignIn}
                className="flex-1">
                <Text>{loading ? 'Please wait...' : 'Sign In'}</Text>
              </Button>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                disabled={loading}
                onPress={handleForgotPassword}
                className="flex-1">
                <Text>{loading ? 'Please wait...' : 'Send OTP to email'}</Text>
              </Button>
            </View>

            {message ? (
              <Text className="mt-2 text-center text-sm text-foreground">{message}</Text>
            ) : null}
          </View>
        </View>
      </>
    );
  }

  // signed-in: show your original main content
  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1 items-center justify-center gap-8 p-4">
        <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
        <View className="flex-row gap-2">
          <Button variant="outline" disabled={loading} onPress={handleSignOut} className="flex-1">
            <Text>{loading ? 'Please wait...' : 'Sign Out'}</Text>
          </Button>
        </View>
        <View className="flex-col gap-2">
          <Button
            onPress={() => {
              router.push('/settings');
            }}>
            <Text>Go to settings</Text>
          </Button>
          <Button
            variant="outline"
            disabled={loading}
            onPress={handleSignOut}
            className="flex-1"
          >
            <Text>{loading ? 'Please wait...' : 'Sign Out'}</Text>
          </Button>
        </View>
          <ClockInOutScreen />
      </View>
    </>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
