// app/Team&Member/joinTeam.tsx
import * as React from 'react';
import {
  ScrollView,
  View,
  Text,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type TeamRow = {
  teamId: number;
  name: string;
  inviteKey: string;
};

export default function JoinTeam() {
  const router = useRouter();
  const [joinInviteKey, setJoinInviteKey] = React.useState('');
  const [loadingJoin, setLoadingJoin] = React.useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const handleJoinTeam = async () => {
    const key = joinInviteKey.trim();
    if (!key) {
      Alert.alert('Invalid key', 'Please enter a 6‑character invite key.');
      return;
    }

    setLoadingJoin(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Not signed in', 'You must be signed in to join a team.');
        return;
      }

      const { data: team, error: teamError } = await supabase
        .from('Teams')
        .select('*')
        .eq('inviteKey', key)
        .single<TeamRow>();

      if (teamError || !team) {
        Alert.alert('Team not found', 'No team exists with that invite key.');
        return;
      }

      const { data: existing, error: existsError } = await supabase
        .from('TeamMembers')
        .select('mId')
        .eq('teamId', team.teamId)
        .eq('uId', user.id)
        .maybeSingle();

      if (existsError) {
        Alert.alert('Error', existsError.message);
        return;
      }

      if (existing) {
        Alert.alert('Already joined', 'You are already a member of this team.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        setJoinInviteKey('');
        return;
      }

      const { error: memberError } = await supabase.from('TeamMembers').insert({
        teamId: team.teamId,
        uId: user.id,
        role: 'member',
        MemberName: user.email ?? 'Member',
      });

      if (memberError) {
        Alert.alert('Error', memberError.message);
        return;
      }

      setJoinInviteKey('');
      Alert.alert('Joined team', `You joined "${team.name}".`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}>
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: '#292D32', paddingTop: headerTopPadding },
        ]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('../')} style={styles.headerBackButton}>
            <AntDesign name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitleText}>Join Team</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          backgroundColor: colors.background,
        }}>
        <View style={{ marginBottom: 20 }}>
          <Text className="ml-2" style={[styles.tip, { color: colors.mutedForeground }]}>
            Enter the 6‑character invite key provided by the team leader to join their team.
          </Text>
        </View>

        <TextInput
          value={joinInviteKey}
          onChangeText={setJoinInviteKey}
          placeholder="Enter 6‑character invite key"
          autoCapitalize="none"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          style={[
            styles.input,
            {
              backgroundColor: '#ffffff',
              color: '#000000',
            },
          ]}
        />

        <Button
          disabled={loadingJoin}
          variant="outline"
          className="mt-3 flex-row items-center justify-center"
          onPress={handleJoinTeam}
          style={{
            backgroundColor: isDark ? '#111827' : '#ffffff',
            borderColor: isDark ? '#111827' : '#000000',
          }}>
          <Ionicons
            name="log-in-outline"
            size={18}
            color={isDark ? '#ffffff' : '#000000'}
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: isDark ? '#ffffff' : '#000000' }}>
            {loadingJoin ? 'Joining...' : 'Join Team'}
          </Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
    minHeight: 56,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitleText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBackButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  tip: { fontSize: 14, marginBottom: 16 },
  input: {
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
    marginBottom: 16,
  },
});
