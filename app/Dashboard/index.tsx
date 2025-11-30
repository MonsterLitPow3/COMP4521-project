// app/Dashboard/index.tsx
import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Platform, FlatList, TouchableOpacity, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ProgressRed } from '@/components/ui/progress(RED)';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/utils/supabase';
import { SearchInput } from '@/components/ui/search_input';

type TaskType = {
  taskID: number;
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number;
  progress: number;
  subTasks: any[];
};

function getDeadline(ddlDate: string, ddlTime: string) {
  const iso = ddlDate.replace(/\//g, '-') + 'T' + ddlTime;
  return new Date(iso);
}

export default function DashBoard() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const handleReceive = useCallback(async () => {
    const { data, error } = await supabase.from('Tasks').select('*');
    if (error) {
      console.error('Cannot receive data from supabase.', error);
      return;
    }
    const now = new Date();
    const nonFinished = (data ?? []).filter((task: TaskType) => {
      // status 2 = finished -> never show on index
      if (task.taskStatus === 2) return false;
      const deadline = getDeadline(task.ddlDate, task.ddlTime);
      return deadline >= now;
    });
    setTasks(
      nonFinished.map((t: any) => ({
        ...t,
        progress: typeof t.progress === 'number' ? t.progress : 0,
      }))
    );
  }, []);

  // Refetch whenever this screen gains focus
  useFocusEffect(
    useCallback(() => {
      handleReceive();
    }, [handleReceive])
  );

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
        <View>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Dashboard</Text>
          </View>
          <View style={styles.searchRow}>
            <SearchInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search tasks"
              style={styles.searchInput}
            />
            <Ionicons name="search-outline" size={24} color="black" style={styles.searchIcon} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.cardTouchable}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => {
              router.push({
                pathname: '/Dashboard/ProgressDetail',
                params: {
                  taskID: String(item.taskID),
                  canEdit: 'true',
                },
              });
            }}>
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
                {item.taskStatus === 0 && <EvilIcons name="play" size={60} color="black" />}
                {item.taskStatus === 1 && <EvilIcons name="exclamation" size={60} color="red" />}
                {item.taskStatus === 2 && <EvilIcons name="check" size={60} color="green" />}
              </View>
            </View>
            <View style={styles.progressWrap}>
              {item.taskStatus === 1 ? (
                <ProgressRed value={item.progress} style={styles.progressBarRed} />
              ) : (
                <Progress value={item.progress} style={styles.progressBar} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 14, paddingHorizontal: 10, flexGrow: 1 },
  headerRow: { alignItems: 'center', marginTop: 10, marginBottom: 6 },
  headerTitle: { fontSize: 26, fontWeight: 'bold' },
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#fff',
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
  progressBarRed: {
    height: 6,
    width: Platform.OS === 'ios' ? 290 : 260,
    borderRadius: 4,
    backgroundColor: '#c3c3c3ff',
  },
});
