// app/Dashboard/ProgressDetail.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Card, CardContent } from '@/components/ui/card';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type MemberJson = {
  mId: number;
  teamId: number;
  role: string;
  uId: string;
  MemberName: string;
};

type SubTaskType = {
  pId: number;
  subTaskID: number;
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTStatus: number;
  Member?: MemberJson[] | string | null;
  sTComments: string | null;
};

function getDeadline(dateStr: string, timeStr: string) {
  const iso = dateStr.replace(/\//g, '-') + 'T' + timeStr;
  return new Date(iso);
}

export default function ProgressDetail() {
  const { taskID, canEdit } = useLocalSearchParams<{ taskID: string; canEdit?: string }>();
  const router = useRouter();

  const [subTasks, setSubTasks] = useState<SubTaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

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
        return;
      }

      const fetched = (data ?? []) as SubTaskType[];
      const now = new Date();

      const lateIds = fetched
        .filter((st) => {
          const isFinished = st.sTStatus === 2;
          if (isFinished) return false;
          const deadline = getDeadline(st.sTddlDate, st.sTddlTime);
          return deadline < now;
        })
        .map((st) => st.subTaskID);

      if (lateIds.length > 0) {
        const { error: updateErr } = await supabase
          .from('subTasks')
          .update({ sTStatus: 1 })
          .in('subTaskID', lateIds);

        if (updateErr) {
          setErrorMsg(`Supabase Update Error: ${updateErr.message}`);
        } else {
          fetched.forEach((st) => {
            if (lateIds.includes(st.subTaskID)) {
              st.sTStatus = 1;
            }
          });
        }
      }

      setSubTasks(fetched);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSubTasks();
    setRefreshing(false);
  }, [fetchSubTasks]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.foreground }}>Loading SubTasks...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.centeredContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: 'red', fontWeight: 'bold' }}>{errorMsg}</Text>
      </View>
    );
  }

  const anyUnfinished = subTasks.some((st) => st.sTStatus !== 2);
  const canShowEditButton = canEdit === 'true' && anyUnfinished;

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

        <Text style={styles.headerTitleText}>Progress Detail</Text>

        <View style={styles.headerRight} />
      </View>

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }>
          <Text style={[styles.header, { color: colors.foreground }]}>SubTasks</Text>

          {subTasks.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No subtasks for this task yet.
            </Text>
          ) : (
            subTasks.map((subTask) => {
              const isFinished = subTask.sTStatus === 2;
              const cardOpacity = isFinished ? 0.85 : 1;

              const maxDescLen = 60;
              const fullDesc = subTask.Descriptions || '';
              const shortDesc =
                fullDesc.length > maxDescLen
                  ? fullDesc.slice(0, maxDescLen).trimEnd() + '…'
                  : fullDesc;

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
                      <Text style={styles.subTaskTitle}>{subTask.sTName}</Text>
                      <Text style={styles.subTaskDesc}>{shortDesc}</Text>

                      <Text style={styles.subTaskInfoLabel}>Members:</Text>
                      {memberNames.length === 0 ? (
                        <Text style={styles.subTaskInfo}>No members assigned.</Text>
                      ) : (
                        <Text style={styles.subTaskInfo}>{memberNames.join(', ')}</Text>
                      )}

                      <Text style={styles.subTaskInfo}>
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
  scrollContainer: { flex: 1, padding: 18 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 38,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    marginTop: 32,
    textAlign: 'center',
  },
  subTaskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 13,
    padding: 15,
    marginBottom: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  subTaskCardFinished: {
    backgroundColor: '#f3f4f6',
    borderWidth: 0,
    borderColor: '#9ca3af',
    elevation: 0,
    shadowOpacity: 0,
  },
  subTaskTitle: {
    fontWeight: 'bold',
    fontSize: 21,
    marginBottom: 3,
    color: '#111827',
  },
  subTaskDesc: {
    color: '#374151',
    marginBottom: 6,
    fontSize: 16,
  },
  subTaskInfoLabel: {
    fontSize: 15,
    marginBottom: 3,
    marginTop: 4,
    color: '#111827',
    fontWeight: '600',
  },
  subTaskInfo: {
    fontSize: 15,
    marginBottom: 3,
    color: '#4b5563',
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
