// app/Dashboard/editPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RefreshableScroll } from '@/components/RefreshableScroll';

type MemberJson = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

type TeamRow = {
  teamId: number;
  name: string;
  inviteKey?: string;
};

type TeamWithMembers = TeamRow & { members: MemberJson[] };

type SubTask = {
  subTaskID?: number;
  pId: number;
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTStatus: number;
  Member?: MemberJson[] | string | null;
};

type SubTaskField = keyof Omit<SubTask, 'subTaskID' | 'pId' | 'sTStatus' | 'Member'>;

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

export default function EditPage() {
  const { taskID } = useLocalSearchParams<{ taskID: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [taskName, setTaskName] = useState('');
  const [ddlDate, setDdlDate] = useState('');
  const [ddlTime, setDdlTime] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

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

    // load members for all these teams
    const { data: memberRows } = await supabase
      .from('TeamMembers')
      .select('*')
      .in('teamId', teamIds);

    (memberRows ?? []).forEach((m: any) => {
      if (grouped[m.teamId]) {
        grouped[m.teamId].members.push({
          mId: m.mId,
          teamId: m.teamId,
          role: m.role,
          uId: m.uId,
          MemberName: m.MemberName,
        });
      }
    });

    const list = Object.values(grouped);
    setTeams(list);
    setSelectedTeamId(list.length > 0 ? list[0].teamId : null);
  }, []);

  const fetchTaskAndSubTasks = useCallback(async () => {
    if (!taskID) {
      Alert.alert('Error', 'No Task ID found.');
      setLoading(false);
      return;
    }
    try {
      const numericTaskId = Number(taskID);

      const { data: taskData, error: taskError } = await supabase
        .from('Tasks')
        .select('*')
        .eq('taskID', numericTaskId)
        .single();

      if (taskError || !taskData) {
        Alert.alert('Error', taskError?.message || 'Task not found.');
        setLoading(false);
        return;
      }

      setTaskName(taskData.taskName || '');
      setDdlDate(taskData.ddlDate || '');
      setDdlTime(taskData.ddlTime || '');
      if (taskData.TeamId) setSelectedTeamId(taskData.TeamId);

      const { data: subData, error: subError } = await supabase
        .from('subTasks')
        .select('*')
        .eq('pId', numericTaskId);

      if (subError) {
        Alert.alert('Error', subError.message);
        setSubTasks([]);
      } else {
        setSubTasks(
          (subData ?? []).map((st: any) => ({
            subTaskID: st.subTaskID,
            pId: st.pId,
            sTName: st.sTName,
            sTddlDate: st.sTddlDate,
            sTddlTime: st.sTddlTime,
            Descriptions: st.Descriptions,
            sTStatus: st.sTStatus,
            Member: st.Member ?? null,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [taskID]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadTeams(), fetchTaskAndSubTasks()]).then(() => setLoading(false));
  }, [loadTeams, fetchTaskAndSubTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTeams(), fetchTaskAndSubTasks()]);
    setRefreshing(false);
  }, [loadTeams, fetchTaskAndSubTasks]);

  const handleSubTaskChange = (idx: number, field: SubTaskField, value: string) => {
    setSubTasks((prev) => prev.map((st, i) => (i === idx ? { ...st, [field]: value } : st)));
  };

  const toggleSubTaskMember = (subTaskIndex: number, member: MemberJson) => {
    setSubTasks((prev) =>
      prev.map((st, i) => {
        if (i !== subTaskIndex) return st;
        let raw: any = st.Member ?? [];
        if (typeof raw === 'string') {
          try {
            raw = JSON.parse(raw);
          } catch {
            raw = [];
          }
        }
        if (!Array.isArray(raw)) raw = [];
        const existing = raw.some((m: any) => m.mId === member.mId);
        const updated = existing ? raw.filter((m: any) => m.mId !== member.mId) : [...raw, member];
        return { ...st, Member: updated };
      })
    );
  };

  const addSubTaskPanel = () => {
    if (!taskID) return;
    const numericTaskId = Number(taskID);
    setSubTasks((prev) => [
      ...prev,
      {
        subTaskID: undefined,
        pId: numericTaskId,
        sTName: '',
        sTddlDate: '',
        sTddlTime: '',
        Descriptions: '',
        sTStatus: 0,
        Member: [],
      },
    ]);
  };

  const handleUpdate = async () => {
    if (!taskID) {
      Alert.alert('Error', 'No Task ID found.');
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

    const numericTaskId = Number(taskID);
    const now = new Date();
    const exclamationStatus = 1;

    setLoading(true);
    try {
      const { error: taskErr } = await supabase
        .from('Tasks')
        .update({
          taskName,
          ddlDate,
          ddlTime,
          taskStatus: exclamationStatus,
        })
        .eq('taskID', numericTaskId);

      if (taskErr) {
        Alert.alert('Update Error', taskErr.message);
        setLoading(false);
        return;
      }

      const existingSubTasks = subTasks.filter((st) => st.subTaskID != null);
      const newSubTasks = subTasks.filter((st) => st.subTaskID == null);

      for (const st of existingSubTasks) {
        const { error: sErr } = await supabase
          .from('subTasks')
          .update({
            sTName: st.sTName,
            sTddlDate: st.sTddlDate,
            sTddlTime: st.sTddlTime,
            Descriptions: st.Descriptions,
            Member: st.Member ?? null,
          })
          .eq('subTaskID', st.subTaskID as number);

        if (sErr) {
          Alert.alert('SubTask Update Error', sErr.message);
          setLoading(false);
          return;
        }
      }

      if (newSubTasks.length > 0) {
        const newRows = newSubTasks.map((st) => {
          const stDeadline = getFullDateTime(st.sTddlDate, st.sTddlTime);
          let sTStatus = 0;
          if (stDeadline < now) sTStatus = 2;
          return {
            pId: numericTaskId,
            sTName: st.sTName,
            sTddlDate: st.sTddlDate,
            sTddlTime: st.sTddlTime,
            Descriptions: st.Descriptions,
            sTStatus,
            Member: st.Member ?? null,
          };
        });

        const { error: insertErr } = await supabase.from('subTasks').insert(newRows);

        if (insertErr) {
          Alert.alert('New SubTasks Insert Error', insertErr.message);
          setLoading(false);
          return;
        }
      }

      Alert.alert('Success', 'Task edits saved with Exclamation status!');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.foreground }}>Loading Task...</Text>
      </View>
    );
  }

  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) ?? null;

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
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <AntDesign name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerTitleText}>Edit Task</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/Dashboard/index_2')}
            style={styles.headerIconButton}>
            <MaterialCommunityIcons name="plus" size={22} color="#000" />
          </TouchableOpacity>

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
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Edit Task: {taskName}</Text>
        </View>

        <Card className="mb-7">
          <CardContent>
            <Text style={[styles.subtitle, { color: colors.foreground }]}>Main Task</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="Task Name"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={ddlDate}
              onChangeText={setDdlDate}
              placeholder="Deadline Date (YY/MM/DD)"
              placeholderTextColor={colors.mutedForeground}
            />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={ddlTime}
              onChangeText={setDdlTime}
              placeholder="Deadline Time (HH:MM:SS)"
              placeholderTextColor={colors.mutedForeground}
            />
          </CardContent>
        </Card>

        {subTasks.map((subTask, idx) => {
          // normalize Member to array for UI
          let memberArray: MemberJson[] = [];
          let raw = subTask.Member as any;
          if (raw) {
            if (typeof raw === 'string') {
              try {
                raw = JSON.parse(raw);
              } catch {
                raw = [];
              }
            }
            if (Array.isArray(raw)) {
              memberArray = raw as MemberJson[];
            }
          }

          return (
            <View key={subTask.subTaskID ?? `new-${idx}`}>
              <Card style={[styles.subTaskCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.subtitle, { color: colors.foreground }]}>
                  SubTask {idx + 1}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={subTask.sTName}
                  onChangeText={(v) => handleSubTaskChange(idx, 'sTName', v)}
                  placeholder="SubTask Name"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={subTask.sTddlDate}
                  onChangeText={(v) => handleSubTaskChange(idx, 'sTddlDate', v)}
                  placeholder="Deadline Date (YY/MM/DD)"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={subTask.sTddlTime}
                  onChangeText={(v) => handleSubTaskChange(idx, 'sTddlTime', v)}
                  placeholder="Deadline Time (HH:MM:SS)"
                  placeholderTextColor={colors.mutedForeground}
                />
                <TextInput
                  style={[
                    styles.descriptionInput,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={subTask.Descriptions}
                  onChangeText={(v) => handleSubTaskChange(idx, 'Descriptions', v)}
                  placeholder="Description"
                  placeholderTextColor={colors.mutedForeground}
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
                      Assign Members
                    </Text>
                    {selectedTeam.members.map((m) => {
                      const checked = memberArray.some((mm) => mm.mId === m.mId);
                      return (
                        <TouchableOpacity
                          key={m.mId}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 4,
                          }}
                          onPress={() => toggleSubTaskMember(idx, m)}>
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
              <View style={{ marginTop: 12 }} />
            </View>
          );
        })}

        <View style={styles.plusButtonContainer}>
          <TouchableOpacity style={styles.plusButton} onPress={addSubTaskPanel}>
            <MaterialCommunityIcons name="plus" size={32} color="black" />
          </TouchableOpacity>
        </View>

        <View style={styles.publishButtonContainer}>
          <TouchableOpacity style={styles.publishButton} onPress={handleUpdate}>
            <Text style={styles.publishButtonText}>Save Edit</Text>
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
  container: { flex: 1, padding: 20 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 38,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: { fontWeight: '600', fontSize: 18, marginBottom: 6 },
  input: {
    marginBottom: 10,
    borderRadius: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  descriptionInput: {
    marginBottom: 10,
    borderRadius: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    minHeight: 80,
  },
  subTaskCard: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },
  plusButtonContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  plusButton: {
    backgroundColor: '#fff',
    borderWidth: 0,
    borderColor: 'black',
    borderRadius: 40,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 8,
  },
  publishButtonContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  publishButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 25,
    elevation: 1,
  },
  publishButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
  },
});
