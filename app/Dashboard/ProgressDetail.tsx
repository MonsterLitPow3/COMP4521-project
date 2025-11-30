// app/Dashboard/ProgressDetail.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabase';

type SubTaskType = {
  pId: number;
  subTaskID: number;
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTStatus: number;
  Member?: any; // stored as JSON array in DB
  sTComments: string | null;
};

export default function ProgressDetail() {
  const { taskID, canEdit } = useLocalSearchParams<{ taskID: string; canEdit?: string }>();
  const router = useRouter();
  const [subTasks, setSubTasks] = useState<SubTaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubTasks = useCallback(async () => {
    setErrorMsg('');
    try {
      if (!taskID) {
        setErrorMsg('No Task ID found.');
        return;
      }
      const numericTaskId = Number(taskID);
      const { data, error } = await supabase.from('subTasks').select('*').eq('pId', numericTaskId);

      if (error) {
        setErrorMsg(`Supabase Error: ${error.message}`);
        setSubTasks([]);
      } else {
        setSubTasks((data ?? []) as SubTaskType[]);
      }
    } catch (e: any) {
      setErrorMsg(`Unknown Error: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [taskID]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchSubTasks();
    }, [fetchSubTasks])
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading SubTasks...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</Text>
      </View>
    );
  }

  const anyUnfinished = subTasks.some((st) => st.sTStatus !== 2);
  const canShowEditButton = canEdit === 'true' && anyUnfinished;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.header}>SubTasks</Text>

        {subTasks.length === 0 ? (
          <Text style={styles.emptyText}>No subtasks for this task yet.</Text>
        ) : (
          subTasks.map((subTask, idx) => {
            const isFinished = subTask.sTStatus === 2;
            const cardOpacity = isFinished ? 0.4 : 1;

            // short snippet of description
            const maxDescLen = 60;
            const fullDesc = subTask.Descriptions || '';
            const shortDesc =
              fullDesc.length > maxDescLen
                ? fullDesc.slice(0, maxDescLen).trimEnd() + '…'
                : fullDesc;

            // parse members JSON array
            let members: string[] = [];
            try {
              if (subTask.Member) {
                if (Array.isArray(subTask.Member)) {
                  members = subTask.Member.map((m) => String(m));
                } else if (typeof subTask.Member === 'string') {
                  const parsed = JSON.parse(subTask.Member);
                  if (Array.isArray(parsed)) members = parsed.map((m) => String(m));
                }
              }
            } catch {
              // ignore parse errors, keep members empty
            }

            return (
              <TouchableOpacity
                key={subTask.subTaskID}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/Dashboard/ProgressFinalDetail',
                    params: {
                      taskID: String(taskID),
                      subTaskID: String(subTask.subTaskID),
                    },
                  })
                }>
                <Card
                  style={[
                    styles.subTaskCard,
                    isFinished && styles.subTaskCardFinished,
                    { opacity: cardOpacity },
                  ]}>
                  <CardContent>
                    <Text style={styles.subTaskTitle}>
                      {idx + 1}. {subTask.sTName}
                    </Text>
                    <Text style={styles.subTaskDesc}>{shortDesc}</Text>

                    {/* Members panel */}
                    <Text style={[styles.subTaskInfo, { marginTop: 4, fontWeight: '600' }]}>
                      Members:
                    </Text>
                    {members.length === 0 ? (
                      <Text style={styles.subTaskInfo}>No members assigned.</Text>
                    ) : (
                      <Text style={styles.subTaskInfo}>{members.join(', ')}</Text>
                    )}

                    <Text style={[styles.subTaskInfo, { marginTop: 4 }]}>
                      Deadline: {subTask.sTddlDate} {subTask.sTddlTime}
                    </Text>
                    <Text style={styles.subTaskInfo}>
                      Status:{' '}
                      {subTask.sTStatus === 0
                        ? 'On-Going'
                        : subTask.sTStatus === 1
                          ? 'Not-finished'
                          : subTask.sTStatus === 2
                            ? 'Finished'
                            : 'Unknown'}
                    </Text>
                    {/* <Text style={styles.subTaskInfo}>SubTask ID: {subTask.subTaskID}</Text> */}
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {canShowEditButton && (
        <View style={styles.editButtonContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (!taskID) return;
              router.push({
                pathname: '/Dashboard/editPage',
                params: { taskID: String(taskID) },
              });
            }}>
            <Text style={styles.editButtonText}>Edit Task</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, padding: 18, backgroundColor: '#fafafa' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 38,
    backgroundColor: '#fafafa',
  },
  header: {
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: '#555',
    marginTop: 32,
    textAlign: 'center',
  },
  subTaskCard: {
    backgroundColor: '#f3f3f3',
    borderRadius: 13,
    padding: 15,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  subTaskCardFinished: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
    borderWidth: 1,
    borderColor: '#d4d4d8',
  },
  subTaskTitle: {
    fontWeight: 'bold',
    fontSize: 21,
    marginBottom: 3,
  },
  subTaskDesc: {
    color: '#454545',
    marginBottom: 6,
    fontSize: 16,
  },
  subTaskInfo: {
    fontSize: 15,
    marginBottom: 3,
    color: '#888',
  },
  editButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
