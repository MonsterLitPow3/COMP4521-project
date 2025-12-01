// app/Team&Member/TeamDetail.tsx
import * as React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type TeamMemberRow = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

export default function TeamDetail() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const [members, setMembers] = React.useState<TeamMemberRow[]>([]);
  const [teamName, setTeamName] = React.useState<string>('');

  React.useEffect(() => {
    const load = async () => {
      const numericId = Number(teamId);
      if (Number.isNaN(numericId)) return;

      const { data: team, error: teamError } = await supabase
        .from('Teams')
        .select('name')
        .eq('teamId', numericId)
        .single();

      if (!teamError && team) {
        setTeamName(team.name);
      }

      const { data: memberData } = await supabase
        .from('TeamMembers')
        .select('*')
        .eq('teamId', numericId)
        .order('mId', { ascending: true });

      setMembers(memberData ?? []);
    };

    load();
  }, [teamId]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: teamName || `Team ${teamId}`,
        }}
      />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>Team Members</Text>
        {members.map((m) => (
          <Card key={m.mId} className="mb-3">
            <CardHeader>
              <CardTitle>{m.MemberName}</CardTitle>
              <CardDescription>Role: {m.role}</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {members.length === 0 && <Text>No members found yet for this team.</Text>}
      </ScrollView>
    </>
  );
}
