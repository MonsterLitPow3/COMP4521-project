// app/Dashboard/History.tsx
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, FlatList, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ProgressGreen } from '@/components/ui/progress(Green)';
import { ProgressRed } from '@/components/ui/progress(RED)';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/utils/supabase';
import { SearchInput } from '@/components/ui/search_input';

type TaskType = {
  taskID: number;
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number; // 0,1,2
  progress: number;
};

function getDeadline(ddlDate: string, ddlTime: string) {
  const iso = ddlDate.replace(/\//g, '-') + 'T' + ddlTime;
  return new Date(iso);
}

export default function History() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const loadHistoryTasks = async () => {
    const { data: tasksRaw, error } = await supabase.from('Tasks').select('*');
    if (error) {
      console.error('Cannot receive data from supabase (history).', error);
      return;
    }

    const now = new Date();

    const historyTasks: TaskType[] = [];

    (tasksRaw ?? []).forEach((raw: any) => {
      const progress = typeof raw.progress === 'number' ? raw.progress : 0;
      const deadline = getDeadline(raw.ddlDate, raw.ddlTime);
      const isPast = deadline < now;

      const isFinished = progress >= 100;
      const shouldShow = isFinished || isPast;
      if (!shouldShow) return;

      historyTasks.push({
        taskID: raw.taskID,
        taskName: raw.taskName,
        ddlDate: raw.ddlDate,
        ddlTime: raw.ddlTime,
        taskStatus: raw.taskStatus, // kept for reference, but view logic only cares about finished/overdue
        progress,
      });
    });

    historyTasks.sort((a, b) => {
      const da = getDeadline(a.ddlDate, a.ddlTime).getTime();
      const db = getDeadline(b.ddlDate, b.ddlTime).getTime();
      return db - da;
    });

    setTasks(historyTasks);
  };

  useEffect(() => {
    loadHistoryTasks();
  }, []);

  const filteredTasks =
    searchText.trim() === ''
      ? tasks
      : tasks.filter((task) => task.taskName.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <FlatList
      data={filteredTasks}
      keyExtractor={(item) => item.taskID.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <View style={styles.searchRow}>
          <SearchInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search history"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={24} color="black" style={styles.searchIcon} />
        </View>
      }
      renderItem={({ item }) => {
        const deadline = getDeadline(item.ddlDate, item.ddlTime);
        const isPast = deadline < new Date();
        const isFinished = item.progress >= 100;
        const isOverdueUnfinished = !isFinished && isPast;

        const cardOpacity = isFinished ? 0.6 : 1;

        return (
          <View style={styles.cardTouchable}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.card,
                isFinished && styles.cardFinishedBorder,
                { opacity: cardOpacity },
              ]}
              onPress={() =>
                router.push({
                  pathname: '/Dashboard/ProgressDetail',
                  params: { taskID: String(item.taskID) },
                })
              }>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardTitleWrap}>
                  <CardTitle className="pl-5" style={styles.cardTitle}>
                    {item.taskName}
                  </CardTitle>
                  <CardDescription className="pl-5" style={styles.cardDescription}>
                    {item.ddlDate} {item.ddlTime}
                  </CardDescription>
                </View>
                <View style={styles.cardIconWrap}>
                  {isFinished ? (
                    <Ionicons name="checkmark-circle-outline" size={55} color="lightgreen" />
                  ) : isOverdueUnfinished ? (
                    <MaterialIcons name="running-with-errors" size={50} color="red" />
                  ) : null}
                </View>
              </View>

              <View style={styles.progressWrap}>
                {isFinished ? (
                  <ProgressGreen value={100} style={styles.progressBar} />
                ) : isOverdueUnfinished ? (
                  <ProgressRed value={item.progress} style={styles.progressBar} />
                ) : (
                  <Progress value={item.progress} style={styles.progressBar} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        );
      }}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 14, paddingHorizontal: 10 },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginLeft: 20,
    marginRight: 22,
    marginTop: 15,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 24,
    backgroundColor: '#fff',
    color: 'black',
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 10,
    fontSize: 18,
    textAlignVertical: 'center',
    marginTop: 2,
  },
  searchIcon: { marginLeft: 12, marginTop: 2 },
  cardTouchable: { marginBottom: 18, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: Platform.OS === 'ios' ? 330 : 320,
    padding: 18,
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#a9a8a8ff',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  cardFinishedBorder: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d4d4d8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitleWrap: { flex: 1, justifyContent: 'center' },
  cardTitle: { marginTop: 5, fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  cardDescription: { color: '#666', marginBottom: -10 },
  cardIconWrap: { alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginTop: 7 },
  progressWrap: { marginTop: 10, marginBottom: 5, alignItems: 'center', width: '100%' },
  progressBar: {
    height: 6,
    width: Platform.OS === 'ios' ? 290 : 260,
    borderRadius: 4,
    backgroundColor: '#c3c3c3ff',
  },
});
