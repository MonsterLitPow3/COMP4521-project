// app/Dashboard/ProgressFinalDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

type TaskRow = {
  taskID: number;
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number; // 0 = ongoing  ,1 = edited/overdue ,2 = finished , 3 = overdue
  progress: number;
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

  useEffect(() => {
    const fetchData = async () => {
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
      };
      setSubTask(mapped);
      setComment(mapped.sTComments ?? '');
    };

    fetchData();
  }, [taskID, subTaskID]);

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
      newTaskStatus = 2;
    } else if (deadline < now) {
      newTaskStatus = 3;
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
      <View style={styles.loadingContainer}>
        <Text>Loading Sub-Task...</Text>
      </View>
    );
  }

  const isFinished = subTask.sTStatus === 2;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Sub-Task Detail Page</Text>
        </View>

        <View style={styles.cardWrapper}>
          <View style={{ width: '100%' }}>
            <CardHeader>
              <View>
                <CardTitle>Sub-Task: {subTask.sTName}</CardTitle>

                <CardDescription style={styles.label}>Task:</CardDescription>
                <CardDescription style={styles.value}>{task.taskName}</CardDescription>

                <CardDescription style={styles.label}>Deadline:</CardDescription>
                <CardDescription style={styles.value}>
                  {subTask.sTddlDate} {subTask.sTddlTime}
                </CardDescription>

                <CardDescription style={styles.label}>Descriptions:</CardDescription>
                <CardDescription style={styles.value}>{subTask.Descriptions}</CardDescription>

                <CardDescription style={styles.label}>Status:</CardDescription>
                <CardDescription style={styles.value}>
                  {isFinished ? 'Finished' : subTask.sTStatus === 1 ? 'Urgent' : 'Not Started'}
                </CardDescription>

                <CardDescription style={[styles.label, { marginTop: 12 }]}>
                  Comments:
                </CardDescription>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Comments"
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
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', paddingBottom: 80 },
  loadingContainer: {
    flex: 1,
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },
  titleRow: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 28 },
  cardWrapper: { marginTop: 10, alignItems: 'center', justifyContent: 'center' },
  label: { marginTop: 8, fontWeight: '600' },
  value: { color: '#4b5563' },
  commentInput: {
    marginTop: 6,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#ffffffff',
    color: 'black',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 80,
    maxHeight: 140,
    textAlignVertical: 'top',
    width: '100%',
    alignSelf: 'stretch',
    flexShrink: 1, // allow wrapping instead of horizontal scroll
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
  confirmButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
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
