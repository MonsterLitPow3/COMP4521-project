// app/Team&Member/index.tsx
import * as React from 'react';
import { ScrollView, View, Text, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { supabase } from '@/utils/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

// random 6‑character invite key
function generateInviteKey(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

export default function TeamAndMember() {
  const [teamName, setTeamName] = React.useState('');
  const [createdInviteKey, setCreatedInviteKey] = React.useState<string | null>(null);
  const [joinInviteKey, setJoinInviteKey] = React.useState('');
  const [loadingCreate, setLoadingCreate] = React.useState(false);
  const [loadingJoin, setLoadingJoin] = React.useState(false);
  const [teams, setTeams] = React.useState<TeamWithMembers[]>([]);

  // load all teams current user belongs to
  const loadMyTeams = React.useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) return;

    // all memberships for this user
    const { data: memberships, error: memError } = await supabase
      .from('TeamMembers')
      .select('teamId')
      .eq('uId', user.id);

    if (memError || !memberships || memberships.length === 0) {
      setTeams([]);
      return;
    }

    const teamIds = memberships.map((m) => m.teamId);

    // teams + all their members
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
    loadMyTeams();
  }, [loadMyTeams]);

  // create a team, creator becomes leader
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

      // generate unique invite key
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
        uId: user.id, // references auth.users.id
        MemberName: user.email ?? 'Leader',
      });

      if (memberError) {
        Alert.alert('Error', memberError.message);
        return;
      }

      setCreatedInviteKey(team.inviteKey);
      setTeamName('');
      await loadMyTeams();
    } finally {
      setLoadingCreate(false);
    }
  };

  // join a team via invite key; user can join many teams but only once per team
  // join a team via invite key; user can join many teams but only once per team
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

      // 1) find team by invite key
      const { data: team, error: teamError } = await supabase
        .from('Teams')
        .select('*')
        .eq('inviteKey', key)
        .single<TeamRow>();

      if (teamError || !team) {
        Alert.alert('Team not found', 'No team exists with that invite key.');
        return;
      }

      // 2) check if this user is already a member of that team
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
        // already a member – just tell the user and stop
        Alert.alert('Already joined', 'You are already a member of this team.');
        setJoinInviteKey('');
        await loadMyTeams();
        return;
      }

      // 3) not a member yet → insert new membership
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
      await loadMyTeams();
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Team & Member</Text>
        <Text>1. Create Team → creator becomes leader, gets invite key.</Text>
        <Text>2. Join Team → enter invite key to join once per team.</Text>
      </View>

      {/* Create Team */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Create a new Team</Text>
        <Input value={teamName} onChangeText={setTeamName} placeholder="Team name" />
        <Button
          disabled={loadingCreate}
          className="mt-3 flex-row items-center justify-center"
          onPress={handleCreateTeam}>
          <Text className="text-white">{loadingCreate ? 'Creating...' : 'Create Team'}</Text>
        </Button>

        {createdInviteKey && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 14 }}>Your Team Invite Key:</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{createdInviteKey}</Text>
            <Text style={{ fontSize: 12, color: '#6b7280' }}>
              Share this key so others can join your team.
            </Text>
          </View>
        )}
      </View>

      {/* Join Team */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Join an existing Team
        </Text>
        <Input
          value={joinInviteKey}
          onChangeText={setJoinInviteKey}
          placeholder="Enter 6‑character invite key"
          autoCapitalize="characters"
        />
        <Button
          disabled={loadingJoin}
          variant="outline"
          className="mt-3 flex-row items-center justify-center"
          onPress={handleJoinTeam}>
          <Ionicons name="log-in-outline" size={18} color="black" style={{ marginRight: 6 }} />
          <Text>{loadingJoin ? 'Joining...' : 'Join Team'}</Text>
        </Button>
      </View>

      {/* Teams list */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Your Teams</Text>
        {teams.length === 0 && (
          <Text style={{ fontSize: 13, color: '#6b7280' }}>You are not in any team yet.</Text>
        )}
        {teams.map((team) => (
          <View
            key={team.teamId}
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{team.name}</Text>
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
              Invite key: {team.inviteKey}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Members</Text>
            {team.members.length === 0 && (
              <Text style={{ fontSize: 12, color: '#6b7280' }}>No members yet for this team.</Text>
            )}
            {team.members.map((m) => (
              <View
                key={m.mId}
                style={{
                  marginBottom: 4,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}>
                <Text style={{ fontSize: 14, fontWeight: '500' }}>{m.MemberName}</Text>
                <Text style={{ fontSize: 12, color: '#6b7280' }}>Role: {m.role}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
