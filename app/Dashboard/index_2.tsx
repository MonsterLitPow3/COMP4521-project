// app/Dashboard/index_2.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshableScroll } from '@/components/RefreshableScroll';

type TeamRow = {
  teamId: number;
  name: string;
  inviteKey?: string;
};

type TeamMemberRow = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

type TeamWithMembers = TeamRow & { members: TeamMemberRow[] };

type SubTask = {
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTComments: string;
  sTStatus: number;
  Member: TeamMemberRow[];
};

type SubTaskField = keyof Omit<SubTask, 'Member'>;

function isValidDate(str: string) {
  const match = str.match(/^(\d{2,4})\/(\d{2})\/(\d{2})$/);
  if (!match) return false;
  let [, year, month, day] = match;
  year = year.length === 2 ? '20' + year : year;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(`${year}-${month}-${day}`);
  return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
}

function isValidTime(str: string) {
  const match = str.match(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/);
  return !!match;
}

function getFullDateTime(dateStr: string, timeStr: string) {
  const isoDateStr = dateStr.replace(/\//g, '-') + 'T' + timeStr;
  return new Date(isoDateStr);
}

export default function AddTaskPage() {
  const [taskName, setTaskName] = useState('');
  const [ddlDate, setDdlDate] = useState('');
  const [ddlTime, setDdlTime] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([
    {
      sTName: '',
      sTddlDate: '',
      sTddlTime: '',
      Descriptions: '',
      sTComments: '',
      sTStatus: 0,
      Member: [],
    },
  ]);

  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const loadTeams = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setTeams([]);
      setSelectedTeamId(null);
      return;
    }

    const { data: memberships, error: memError } = await supabase
      .from('TeamMembers')
      .select('teamId')
      .eq('uId', user.id);

    if (memError || !memberships || memberships.length === 0) {
      setTeams([]);
      setSelectedTeamId(null);
      return;
    }

    const teamIds = memberships.map((m) => m.teamId);

    const { data: teamRows } = await supabase.from('Teams').select('*').in('teamId', teamIds);

    const grouped: Record<number, TeamWithMembers> = {};
    (teamRows ?? []).forEach((t: any) => {
      grouped[t.teamId] = {
        teamId: t.teamId,
        name: t.name,
        inviteKey: t.inviteKey,
        members: [],
      };
    });

    const list = Object.values(grouped);
    setTeams(list);
    setSelectedTeamId(list.length > 0 ? list[0].teamId : null);
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    const loadMembersForSelectedTeam = async () => {
      if (!selectedTeamId) return;

      const { data: memberRows, error } = await supabase
        .from('TeamMembers')
        .select('*')
        .eq('teamId', selectedTeamId);

      if (error) {
        console.error('Error loading members for team', selectedTeamId, error);
        return;
      }

      setTeams((prev) =>
        prev.map((t) =>
          t.teamId === selectedTeamId ? { ...t, members: (memberRows ?? []) as TeamMemberRow[] } : t
        )
      );
    };

    loadMembersForSelectedTeam();
  }, [selectedTeamId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTeams();
    setRefreshing(false);
  }, [loadTeams]);

  const addSubTaskPanel = () => {
    setSubTasks((prev) => [
      ...prev,
      {
        sTName: '',
        sTddlDate: '',
        sTddlTime: '',
        Descriptions: '',
        sTComments: '',
        sTStatus: 0,
        Member: [],
      },
    ]);
  };

  const handleSubTaskChange = (idx: number, field: SubTaskField, value: string) => {
    setSubTasks((prev) => prev.map((st, i) => (i === idx ? { ...st, [field]: value } : st)));
  };

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) ?? null;

  const handleSubmit = async () => {
    if (selectedTeamId == null) {
      Alert.alert('Validation Error', 'Please choose a responsible team for this task.');
      return;
    }

    if (!isValidDate(ddlDate) || !isValidTime(ddlTime)) {
      Alert.alert(
        'Validation Error',
        'Main Task must have a valid date (YYYY/MM/DD) and time (HH:MM:SS).'
      );
      return;
    }
    for (const st of subTasks) {
      if (!isValidDate(st.sTddlDate) || !isValidTime(st.sTddlTime)) {
        Alert.alert('Validation Error', 'All SubTasks must have valid date and time formats.');
        return;
      }
    }

    const isTaskValid = taskName.trim() !== '' && ddlDate.trim() !== '' && ddlTime.trim() !== '';
    const areSubTasksValid = subTasks.every(
      (st) =>
        st.sTName.trim() !== '' &&
        st.sTddlDate.trim() !== '' &&
        st.sTddlTime.trim() !== '' &&
        st.Descriptions.trim() !== ''
    );
    if (!isTaskValid) {
      Alert.alert('Validation Error', 'Please fill out all Task fields.');
      return;
    }
    if (!areSubTasksValid) {
      Alert.alert('Validation Error', 'Please fill out all SubTasks fields.');
      return;
    }

    const now = new Date();
    const taskDeadline = getFullDateTime(ddlDate, ddlTime);
    if (taskDeadline < now) {
      Alert.alert('Validation Error', 'Task deadline cannot be earlier than the current time.');
      return;
    }
    for (const st of subTasks) {
      const stDeadline = getFullDateTime(st.sTddlDate, st.sTddlTime);
      if (stDeadline < now) {
        Alert.alert(
          'Validation Error',
          'SubTask deadline cannot be earlier than the current time.'
        );
        return;
      }
    }

    for (const st of subTasks) {
      const stDeadline = getFullDateTime(st.sTddlDate, st.sTddlTime);
      if (stDeadline > taskDeadline) {
        Alert.alert(
          'Validation Error',
          'Each SubTask deadline must be on or before the main Task deadline.'
        );
        return;
      }
    }

    const { data: taskData, error: taskError } = await supabase
      .from('Tasks')
      .insert([
        {
          taskName,
          ddlDate,
          ddlTime,
          taskStatus: 0,
          progress: 0,
          TeamId: selectedTeamId,
        },
      ])
      .select();

    if (taskError) {
      Alert.alert('Task Insertion Error', taskError.message || 'Unknown error inserting Task.');
      return;
    }

    const insertedTask = Array.isArray(taskData) ? taskData[0] : taskData;
    const parentTaskID = insertedTask?.taskID;
    if (!parentTaskID) {
      Alert.alert('Task ID missing', 'Could not retrieve Task ID.');
      return;
    }

    const subTaskRows = subTasks.map((st) => ({
      sTName: st.sTName,
      sTddlDate: st.sTddlDate,
      sTddlTime: st.sTddlTime,
      Descriptions: st.Descriptions,
      sTComments: st.sTComments ?? '',
      sTStatus: 0,
      pId: parentTaskID,
      Member: st.Member,
    }));

    const { error: sTError } = await supabase.from('subTasks').insert(subTaskRows);
    if (sTError) {
      Alert.alert(
        'SubTasks Insertion Error',
        sTError.message || 'Unknown error inserting SubTasks.'
      );
      return;
    }

    Alert.alert('Success', 'Task and SubTasks published!');
    router.push('/Dashboard');
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
          <TouchableOpacity
            onPress={() => router.push('/Dashboard')}
            style={styles.headerBackButton}>
            <AntDesign name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitleText}>Add New Task</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/Dashboard/History')}
            style={styles.headerIconButton}>
            <AntDesign name="clock-circle" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <RefreshableScroll
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshing={refreshing}
        onRefresh={onRefresh}>
        <Card className="mb-3 mt-5">
          <CardContent>
            <Text style={[styles.subtitle, { color: colors.foreground }]}>Responsible Team</Text>
            {teams.length === 0 ? (
              <Text style={{ marginBottom: 8, color: colors.mutedForeground }}>
                You are not in any team yet, please add or join a team before adding a new task.
              </Text>
            ) : (
              <ScrollView horizontal style={{ marginBottom: 8 }}>
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.teamId}
                    onPress={() => setSelectedTeamId(t.teamId)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 8,
                      backgroundColor:
                        selectedTeamId === t.teamId ? colors.primary : colors.secondary,
                    }}>
                    <Text
                      style={{
                        color:
                          selectedTeamId === t.teamId
                            ? colors.primaryForeground
                            : colors.foreground,
                      }}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </CardContent>
        </Card>

        <Card className="mb-7 mt-3">
          <CardContent>
            <Text style={[styles.subtitle, { color: colors.foreground }]}>Task</Text>
            <TextInput
              style={[
                styles.input,
                isDark
                  ? {
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      color: '#000000',
                    }
                  : {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
              ]}
              className="mb-3 mt-2"
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Task Name"
              placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
            />
            <TextInput
              style={[
                styles.input,
                isDark
                  ? {
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      color: '#000000',
                    }
                  : {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
              ]}
              className="mb-2 mt-2"
              value={ddlDate}
              onChangeText={setDdlDate}
              placeholder="Deadline Date (YYYY/MM/DD)"
              placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
            />
            <TextInput
              style={[
                styles.input,
                isDark
                  ? {
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e7eb',
                      color: '#000000',
                    }
                  : {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
              ]}
              className="mb-2 mt-2"
              value={ddlTime}
              onChangeText={setDdlTime}
              placeholder="Deadline Time (HH:MM:SS)"
              placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
            />
          </CardContent>
        </Card>

        {subTasks.map((subTask, idx) => (
          <View key={idx}>
            <Card style={styles.subTaskCard}>
              <Text className="pl-2 pt-4" style={[styles.subtitle, { color: colors.foreground }]}>
                SubTask {idx + 1}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isDark
                    ? {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        color: '#000000',
                      }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                ]}
                value={subTask.sTName}
                onChangeText={(v) => handleSubTaskChange(idx, 'sTName', v)}
                placeholder="SubTask Name"
                placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
              />
              <TextInput
                style={[
                  styles.input,
                  isDark
                    ? {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        color: '#000000',
                      }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                ]}
                value={subTask.sTddlDate}
                onChangeText={(v) => handleSubTaskChange(idx, 'sTddlDate', v)}
                placeholder="Deadline Date (YY/MM/DD)"
                placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
              />
              <TextInput
                style={[
                  styles.input,
                  isDark
                    ? {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        color: '#000000',
                      }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                ]}
                value={subTask.sTddlTime}
                onChangeText={(v) => handleSubTaskChange(idx, 'sTddlTime', v)}
                placeholder="Deadline Time (HH:MM:SS)"
                placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
              />
              <TextInput
                style={[
                  styles.descriptionInput,
                  isDark
                    ? {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        color: '#000000',
                      }
                    : {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                ]}
                value={subTask.Descriptions}
                onChangeText={(v) => handleSubTaskChange(idx, 'Descriptions', v)}
                placeholder="Description"
                placeholderTextColor={isDark ? '#6b7280' : colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />

              {selectedTeam && (
                <>
                  <Text
                    style={{
                      marginTop: 8,
                      marginBottom: 4,
                      fontWeight: '600',
                      color: colors.foreground,
                    }}>
                    Assign Members (optional)
                  </Text>
                  {selectedTeam.members.map((m) => {
                    const checked = subTask.Member.some((mm) => mm.mId === m.mId);
                    return (
                      <TouchableOpacity
                        key={m.mId}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}
                        onPress={() => {
                          setSubTasks((prev) =>
                            prev.map((st, i) =>
                              i !== idx
                                ? st
                                : {
                                    ...st,
                                    Member: checked
                                      ? st.Member.filter((mm) => mm.mId !== m.mId)
                                      : [...st.Member, m],
                                  }
                            )
                          );
                        }}>
                        <View
                          style={{
                            width: 18,
                            height: 18,
                            marginRight: 8,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isDark ? '#ffffff' : colors.border,
                            backgroundColor: checked
                              ? isDark
                                ? '#22c55e'
                                : colors.primary
                              : isDark
                                ? '#000000'
                                : colors.card,
                          }}
                        />
                        <Text style={{ color: colors.foreground }}>
                          {m.MemberName} ({m.role})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </Card>
            <View className="mt-3" />
          </View>
        ))}

        <View style={styles.plusButtonContainer}>
          <TouchableOpacity style={styles.plusButton} onPress={addSubTaskPanel}>
            <MaterialCommunityIcons name="plus" size={32} color="black" />
          </TouchableOpacity>
        </View>

        <View className="pb-20" style={styles.publishButtonContainer}>
          <TouchableOpacity style={styles.publishButton} onPress={handleSubmit}>
            <Text style={styles.publishButtonText}>Add New Task</Text>
          </TouchableOpacity>
        </View>
      </RefreshableScroll>
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
  headerIconButton: {
    height: 30,
    width: 30,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  container: { padding: 12, flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginTop: 0,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    minHeight: 80,
  },
  subTaskCard: {
    marginBottom: 8,
    padding: 12,
  },
  plusButtonContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#ffffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffff',
    shadowColor: '#000',
    shadowOpacity: 1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    marginBottom: 10,
  },
  publishButtonContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  publishButton: {
    width: '80%',
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
