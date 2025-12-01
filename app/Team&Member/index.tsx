// app/Team&Member/index.tsx
import * as React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type TeamRow = {
  teamId: number;
  name: string;
  inviteKey: string;
};

type TeamMemberRow = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

type TeamWithMembers = TeamRow & { members: TeamMemberRow[] };

export default function TeamAndMemberIndex() {
  const [teams, setTeams] = React.useState<TeamWithMembers[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const loadMyTeams = React.useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setTeams([]);
      return;
    }

    const { data: memberships, error: memError } = await supabase
      .from('TeamMembers')
      .select('teamId')
      .eq('uId', user.id);

    if (memError || !memberships || memberships.length === 0) {
      setTeams([]);
      return;
    }

    const teamIds = memberships.map((m) => m.teamId);

    const [{ data: teamRows }, { data: memberRows }] = await Promise.all([
      supabase.from('Teams').select('*').in('teamId', teamIds),
      supabase.from('TeamMembers').select('*').in('teamId', teamIds),
    ]);

    const grouped: Record<number, TeamWithMembers> = {};
    (teamRows ?? []).forEach((t: TeamRow) => {
      grouped[t.teamId] = { ...t, members: [] };
    });
    (memberRows ?? []).forEach((m: TeamMemberRow) => {
      if (grouped[m.teamId]) grouped[m.teamId].members.push(m);
    });

    setTeams(Object.values(grouped));
  }, []);

  React.useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(() => {
      loadMyTeams();
    });
    loadMyTeams();
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [loadMyTeams]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadMyTeams();
    setRefreshing(false);
  }, [loadMyTeams]);

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

        <Text style={styles.headerTitleText}>Team & Member</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/Team&Member/createTeam')}>
            <MaterialCommunityIcons name="plus" size={22} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => router.push('/Team&Member/joinTeam')}>
            <AntDesign name="usergroup-add" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          backgroundColor: colors.background,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.tip, { color: '#4b5563' }]}>
            You can create a new team or join an existing one using the buttons in the top-right
            corner of this page.
          </Text>
        </View>

        {teams.length === 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.emptyText, { color: '#6b7280' }]}>
              You are not in any team yet. Use the + button to create a team or the group icon to
              join with an invite key.
            </Text>
          </View>
        )}

        <View style={{ marginBottom: 16 }}>
          {teams.map((team) => (
            <View key={team.teamId} style={styles.teamCard}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.inviteKey}>Invite key: {team.inviteKey}</Text>

              <Text style={styles.membersTitle}>Members</Text>
              {team.members.length === 0 && (
                <Text style={styles.noMembers}>No members yet for this team.</Text>
              )}
              {team.members.map((m) => (
                <View key={m.mId} style={styles.memberRow}>
                  <Text style={styles.memberName}>{m.MemberName}</Text>
                  <Text style={styles.memberRole}>Role: {m.role}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
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
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  headerIconButton: {
    height: 30,
    width: 30,
    borderRadius: 6,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  tip: { fontSize: 14, color: '#4b5563' },
  emptyText: { fontSize: 14, color: '#6b7280' },
  teamCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  teamName: { fontSize: 16, fontWeight: '600' },
  inviteKey: { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  membersTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  noMembers: { fontSize: 12, color: '#6b7280' },
  memberRow: {
    marginBottom: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberName: { fontSize: 14, fontWeight: '500' },
  memberRole: { fontSize: 12, color: '#6b7280' },
});
