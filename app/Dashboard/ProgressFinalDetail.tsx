// app/Dashboard/ProgressFinalDetail.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Platform,
  RefreshControl,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type TaskRow = {
  taskID: number;
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number;
  progress: number;
};

type MemberJson = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

type SubTaskRow = {
  subTaskID: number;
  pId: number;
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTComments: string | null;
  sTStatus: number;
  Member?: MemberJson[] | string | null;
};

function getDeadline(ddlDate: string, ddlTime: string) {
  const iso = ddlDate.replace(/\//g, '-') + 'T' + ddlTime;
  return new Date(iso);
}

export default function ProgressFinalDetail() {
  const { taskID, subTaskID } = useLocalSearchParams<{ taskID: string; subTaskID: string }>();
  const router = useRouter();

  const [task, setTask] = useState<TaskRow | null>(null);
  const [subTask, setSubTask] = useState<SubTaskRow | null>(null);
  const [comment, setComment] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const fetchData = useCallback(async () => {
    if (!taskID || !subTaskID) {
      Alert.alert('Error', 'Missing Task or SubTask ID.');
      return;
    }
    const tId = Number(taskID);
    const sId = Number(subTaskID);

    const { data: taskData, error: tErr } = await supabase
      .from('Tasks')
      .select('*')
      .eq('taskID', tId)
      .single();

    if (tErr || !taskData) {
      Alert.alert('Error', tErr?.message || 'Task not found');
      return;
    }

    setTask({
      taskID: taskData.taskID,
      taskName: taskData.taskName,
      ddlDate: taskData.ddlDate,
      ddlTime: taskData.ddlTime,
      taskStatus: taskData.taskStatus,
      progress: typeof taskData.progress === 'number' ? taskData.progress : 0,
    });

    const { data: subData, error: sErr } = await supabase
      .from('subTasks')
      .select('*')
      .eq('pId', tId);

    if (sErr || !subData) {
      Alert.alert('Error', sErr?.message || 'SubTasks not found');
      return;
    }

    const current = subData.find((st: any) => st.subTaskID === sId);
    if (!current) {
      Alert.alert('Error', 'Selected SubTask not found.');
      return;
    }

    const mapped: SubTaskRow = {
      subTaskID: current.subTaskID,
      pId: current.pId,
      sTName: current.sTName,
      sTddlDate: current.sTddlDate,
      sTddlTime: current.sTddlTime,
      Descriptions: current.Descriptions,
      sTComments: current.sTComments ?? '',
      sTStatus: current.sTStatus,
      Member: current.Member ?? null,
    };
    setSubTask(mapped);
    setComment(mapped.sTComments ?? '');
  }, [taskID, subTaskID]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleConfirmFinished = async () => {
    if (!task || !subTask) return;

    if (subTask.sTStatus === 2) {
      Alert.alert('Info', 'This subtask is already finished.');
      return;
    }

    const tId = task.taskID;
    const sId = subTask.subTaskID;

    const { error: sErr } = await supabase
      .from('subTasks')
      .update({ sTStatus: 2, sTComments: comment })
      .eq('subTaskID', sId);

    if (sErr) {
      Alert.alert('Error', sErr.message);
      return;
    }

    const { data: allSubs, error: allErr } = await supabase
      .from('subTasks')
      .select('sTStatus')
      .eq('pId', tId);

    if (allErr || !allSubs) {
      Alert.alert('Error', allErr?.message || 'Cannot recompute progress.');
      return;
    }

    const total = allSubs.length || 1;
    const finishedCount = allSubs.filter((st: any) => st.sTStatus === 2).length;
    const ratioPerSub = 100 / total;
    const newProgress = Math.min(100, Math.round(finishedCount * ratioPerSub));

    const deadline = getDeadline(task.ddlDate, task.ddlTime);
    const now = new Date();

    let newTaskStatus = task.taskStatus;
    if (finishedCount === total) {
      newTaskStatus = 2; // finished
    } else if (deadline < now) {
      newTaskStatus = 3; // overdue
    }

    const { error: tErr } = await supabase
      .from('Tasks')
      .update({ progress: newProgress, taskStatus: newTaskStatus })
      .eq('taskID', tId);

    if (tErr) {
      Alert.alert('Error', tErr.message);
      return;
    }

    setSubTask({ ...subTask, sTStatus: 2, sTComments: comment });
    setTask({ ...task, progress: newProgress, taskStatus: newTaskStatus });

    Alert.alert('Success', 'Subtask marked as finished!');
    router.back();
  };

  if (!task || !subTask) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Loading Sub-Task...</Text>
      </View>
    );
  }

  const isFinished = subTask.sTStatus === 2;

  let memberNames: string[] = [];
  try {
    if (subTask.Member) {
      let raw = subTask.Member as any;
      if (typeof raw === 'string') raw = JSON.parse(raw);
      if (Array.isArray(raw)) {
        memberNames = raw.map((m) =>
          typeof m === 'object' && m !== null && 'MemberName' in m
            ? String((m as MemberJson).MemberName)
            : String(m)
        );
      }
    }
  } catch {
    memberNames = [];
  }

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

        <Text style={styles.headerTitleText}>Sub-Task Detail</Text>

        <View style={styles.headerRight} />
      </View>

      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.titleRow}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Sub-Task Detail Page
            </Text>
          </View>

          <View style={styles.cardWrapper}>
            <View style={{ width: '100%' }}>
              <CardHeader>
                <View>
                  <CardTitle>Sub-Task: {subTask.sTName}</CardTitle>

                  <CardDescription style={styles.label}>Task:</CardDescription>
                  <View style={styles.valueBox}>
                    <CardDescription style={styles.value}>{task.taskName}</CardDescription>
                  </View>

                  <CardDescription style={styles.label}>Deadline:</CardDescription>
                  <View style={styles.valueBox}>
                    <CardDescription style={styles.value}>
                      {subTask.sTddlDate} {subTask.sTddlTime}
                    </CardDescription>
                  </View>

                  <CardDescription style={styles.label}>Members:</CardDescription>
                  <View style={styles.valueBox}>
                    <CardDescription style={styles.value}>
                      {memberNames.length === 0 ? 'No members assigned.' : memberNames.join(', ')}
                    </CardDescription>
                  </View>

                  <CardDescription style={styles.label}>Descriptions:</CardDescription>
                  <View style={styles.valueBox}>
                    <CardDescription style={styles.value}>{subTask.Descriptions}</CardDescription>
                  </View>

                  <CardDescription style={styles.label}>Status:</CardDescription>
                  <View style={styles.valueBox}>
                    <CardDescription style={styles.value}>
                      {isFinished ? 'Finished' : subTask.sTStatus === 1 ? 'Urgent' : 'In-Progress'}
                    </CardDescription>
                  </View>

                  <CardDescription style={[styles.label, { marginTop: 12 }]}>
                    Comments:
                  </CardDescription>
                  <TextInput
                    style={styles.commentInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder="You may place your comments here"
                    placeholderTextColor={isDark ? '#a4a4a4ff' : '#9ca3af'}
                    editable={!isFinished}
                    multiline
                    textAlignVertical="top"
                  />
                </View>
              </CardHeader>
            </View>
          </View>
        </ScrollView>

        {isFinished ? (
          <View style={styles.finishedBannerContainer}>
            <Text style={styles.finishedBannerText}>This subtask has been finished.</Text>
          </View>
        ) : (
          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmFinished}>
              <Text style={styles.confirmButtonText}>Confirm Finished Subtask</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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

  root: { flex: 1, paddingBottom: 80 },
  loadingContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  titleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pageTitle: { fontSize: 28 },
  cardWrapper: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: 8, fontWeight: '600' },
  value: { color: '#000000ff' },
  valueBox: {
    marginTop: 4,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#ffffff',
    backgroundColor: '#efefef',
  },
  commentInput: {
    marginTop: 6,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    color: 'black',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 80,
    maxHeight: 140,
    textAlignVertical: 'top',
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 1,
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishedBannerContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  finishedBannerText: {
    backgroundColor: '#e5e7eb',
    color: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    fontWeight: '600',
  },
});
