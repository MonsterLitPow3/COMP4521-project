import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Link, Stack, useRouter } from 'expo-router';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, TextInput, View } from 'react-native';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { vm } from '@/utils/ViewModel';

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

export default function Screen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<any>(null);
  const [session, setSession] = React.useState<any>(null);
  const [inputTeam, setInputTeam] = React.useState<string>('');
  const [teams, setTeams] = React.useState<any[]>([]);
  const [currentTeam, setCurrentTeam] = React.useState<any>(null);
  const [taskTitleInput, setTaskTitleInput] = React.useState<string>('');
  const [taskDescInput, setTaskDescInput] = React.useState<string>('');
  const [taskDueInput, setTaskDueInput] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Subscribe to auth state
    // there are some delay with subscriptions, so the  
    const unsubscribeSession = vm.subscribe('session', setSession);
    const unsubscribeLoading = vm.subscribe('loading', setLoading);
    const unsubscribeTeams = vm.subscribe('teams', setTeams);
    const unsubscribeCurrentTeam = vm.subscribe('currentTeam', setCurrentTeam);

    // Load user teams when authenticated
    if (vm.isAuthenticated()) {
      vm.loadUserTeams();
    }

    return () => {
      unsubscribeSession();
      unsubscribeLoading();
      unsubscribeTeams();
      unsubscribeCurrentTeam();
    };
  }, []);

  // Handle sign up
  const handleSignUp = async () => {
    setMessage(null);
    try {
      const { data, error } = await vm.signUpWithEmail(email, password);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Sign-up email sent. Check your inbox.');
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      vm.setState('loading', false);
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    setMessage(null);
    try {
      const { data, error } = await vm.signInWithEmail(email, password);
      console.log("front end: error:", error)
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed in successfully');
        console.log('front end: User:', data.user);
        console.log('front end: Session:', session);
        setUser(data.user);
        setEmail('');
        setPassword('');
        // Optionally navigate to dashboard after successful sign in
        // router.push('/Dashboard');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      vm.setState('loading', false);
    }
  };

  const handleSignOut = async () => {
    setMessage(null);
    try {
      const { error } = await vm.signOut();
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Signed out successfully');
        // Optionally navigate to dashboard after successful sign in
        // router.push('/Dashboard');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      vm.setState('loading', false);
    }
  };

  // need testing
  const handleCreateTeam = async () => {
    setMessage(null);
    try {
      const { error } = await vm.createTeam(inputTeam);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Add team successfully');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      vm.setState('loading', false);
    }
  };

  // need testing
  const handleCreateTask = async () => {
    setMessage(null);
    try {
      const { error } = await vm.createTask(taskTitleInput, taskDescInput, taskDueInput);
      if (error) {
        setMessage(error.message);
      } else {
        setMessage('Add task successfully');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      vm.setState('loading', false);
    }
  };

  {/* below are email/password inputs and signUp / signIn buttons */ }
  if (!session) {
    return (
      <>
        <Stack.Screen options={SCREEN_OPTIONS} />
        <View className="flex-1 items-center justify-center p-4">
          <Image
            source={LOGO[colorScheme ?? 'light']}
            style={IMAGE_STYLE}
            resizeMode="contain"
          />

          <View className="gap-4 p-4 w-full max-w-xs mt-8">
            <Text className="text-xl font-bold text-center mb-4">
              Sign In to Your Account
            </Text>

            <Text className="text-sm text-muted-foreground">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
            />

            <Text className="text-sm text-muted-foreground">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
            />

            <View className="flex-row gap-2">
              <Button
                disabled={loading}
                onPress={handleSignUp}
                className="flex-1"
              >
                <Text>{loading ? 'Please wait...' : 'Sign Up'}</Text>
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                onPress={handleSignIn}
                className="flex-1"
              >
                <Text>{loading ? 'Please wait...' : 'Sign In'}</Text>
              </Button>
            </View>

            {message ? (
              <Text className="text-sm text-foreground text-center mt-2">
                {message}
              </Text>
            ) : null}
          </View>
        </View>
      </>
    );
  }
  return (
    <>
      <Stack.Screen options={SCREEN_OPTIONS} />
      <View className="flex-1 items-center justify-center gap-8 p-4">
        <Image source={LOGO[colorScheme ?? 'light']} style={IMAGE_STYLE} resizeMode="contain" />
        <Button
          variant="outline"
          disabled={loading}
          onPress={handleSignOut}
          className="flex-1"
        >
          <Text>{loading ? 'Please wait...' : 'Sign Out'}</Text>
        </Button>
        <Text className="text-sm text-muted-foreground">Team</Text>
        <TextInput
          value={inputTeam}
          onChangeText={setInputTeam}
          placeholder="enter team name"
          className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
        />
        <Button
          variant="outline"
          disabled={loading}
          onPress={handleCreateTeam}
          className="flex-1"
        >
          <Text>{loading ? 'Please wait...' : 'Creating Team'}</Text>
        </Button>
        <Text>{currentTeam ? `Current team: ${currentTeam.name} with id: ${currentTeam.id}` : 'No team selected'}</Text>
        <Text className="text-sm text-muted-foreground">Task Title</Text>
        <TextInput
          value={taskTitleInput}
          onChangeText={setTaskTitleInput}
          placeholder="enter task title"
          className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
        />
        <Text className="text-sm text-muted-foreground">Task Description</Text>
        <TextInput
          value={taskDescInput}
          onChangeText={setTaskDescInput}
          placeholder="enter task description"
          className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
        />
        <Text className="text-sm text-muted-foreground">Task Due (optional)</Text>
        <TextInput
          value={taskDueInput ? taskDueInput.toString() : ''}
          onChangeText={(text) => {
            const timestamp = parseInt(text, 10);
            if (!isNaN(timestamp)) {
              setTaskDueInput(timestamp);
            } else {
              setTaskDueInput(null);
            }
          }}
          placeholder="enter task due as timestamp, should be date picker later I guess"
          keyboardType="numeric"
          className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
        />
        <Button
        variant="outline"
          disabled={loading}
          onPress={handleCreateTask}
          className="flex-1"
        >
          <Text>{loading ? 'Please wait...' : 'Creating Task'}</Text>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>
            <Text>Card Content</Text>
          </CardContent>
          <CardFooter className="flex-col gap-2">
            <Button className="w-full">
              <Text>Subscribe</Text>
            </Button>
            <Button variant="outline" className="w-full bg-red-300">
              <Text>Later</Text>
            </Button>
          </CardFooter>
        </Card>
        <View className="gap-2 p-4">
          <Text className="ios:text-foreground font-mono text-sm text-muted-foreground">
            1. Edit <Text variant="code">app/index.tsx</Text> to get started.
          </Text>
          <Text className="ios:text-foreground font-mono text-sm text-muted-foreground">
            2. Save to see your changes instantly.
          </Text>
        </View>
        <View className="flex-col gap-2">
          <Link href="https://reactnativereusables.com" asChild>
            <Button>
              <Text>Browse the documents</Text>
            </Button>
          </Link>
          <Link href="https://github.com/founded-labs/react-native-reusables" asChild>
            <Button variant="ghost">
              <Text>Star the Repo</Text>
              <Icon as={StarIcon} />
            </Button>
          </Link>
          <Button
            onPress={() => {
              router.push('/settings');
            }}>
            <Text>Go to settings</Text>
          </Button>
          {/* //////////////////// */}
          <Button
            onPress={() => {
              router.push('/Dashboard');
            }}>
            <Text>Go to Dashboard</Text>
          </Button>
        </View>
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
