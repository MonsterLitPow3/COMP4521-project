// app/Team&Member/createTeam.tsx
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
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
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

function generateInviteKey(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export default function CreateTeam() {
  const router = useRouter();
  const [teamName, setTeamName] = React.useState('');
  const [createdInviteKey, setCreatedInviteKey] = React.useState<string | null>(null);
  const [loadingCreate, setLoadingCreate] = React.useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const handleCreateTeam = async () => {
    const trimmedName = teamName.trim();
    if (!trimmedName) {
      Alert.alert('Team name required', 'Please enter a team name.');
      return;
    }

    setLoadingCreate(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Not signed in', 'You must be signed in to create a team.');
        return;
      }

      let inviteKey = generateInviteKey();
      for (let i = 0; i < 5; i++) {
        const { data: existing } = await supabase
          .from('Teams')
          .select('teamId')
          .eq('inviteKey', inviteKey)
          .maybeSingle();
        if (!existing) break;
        inviteKey = generateInviteKey();
      }

      const { data: team, error: teamError } = await supabase
        .from('Teams')
        .insert({ name: trimmedName, inviteKey })
        .select()
        .single<TeamRow>();

      if (teamError || !team) {
        Alert.alert('Error', teamError?.message ?? 'Failed to create team.');
        return;
      }

      const { error: memberError } = await supabase.from('TeamMembers').insert({
        teamId: team.teamId,
        role: 'leader',
        uId: user.id,
        MemberName: user.email ?? 'Leader',
      });

      if (memberError) {
        Alert.alert('Error', memberError.message);
        return;
      }

      setCreatedInviteKey(team.inviteKey);
      setTeamName('');
      Alert.alert('Team created', 'Your team has been created.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } finally {
      setLoadingCreate(false);
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

        <Text style={styles.headerTitleText}>Create Team</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          backgroundColor: colors.background,
        }}>
        {/* <Text className="ml-2" style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
          Create a new Team
        </Text> */}
        <Text className="ml-2" style={[styles.tip, { color: colors.mutedForeground }]}>
          Enter a team name and a unique invite key will be generated automatically.
        </Text>

        <TextInput
          value={teamName}
          onChangeText={setTeamName}
          placeholder="Team name"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          multiline
          style={[
            styles.input,
            {
              backgroundColor: '#ffffff',
              color: '#000000',
            },
          ]}
        />

        <Button
          disabled={loadingCreate}
          className="mt-3 flex-row items-center justify-center"
          onPress={handleCreateTeam}
          style={{
            backgroundColor: '#111827',
            borderColor: '#111827',
          }}>
          <Text style={{ color: '#ffffff' }}>{loadingCreate ? 'Creating...' : 'Create Team'}</Text>
        </Button>

        {createdInviteKey && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.inviteLabel, { color: colors.foreground }]}>
              Your Team Invite Key:
            </Text>
            <Text style={[styles.inviteValue, { color: colors.foreground }]}>
              {createdInviteKey}
            </Text>
            <Text style={[styles.inviteHint, { color: colors.mutedForeground }]}>
              Share this key so others can join your team.
            </Text>
          </View>
        )}
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
    paddingVertical: 10,
    minHeight: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  inviteLabel: { fontSize: 14 },
  inviteValue: { fontSize: 20, fontWeight: 'bold' },
  inviteHint: { fontSize: 12 },
});
