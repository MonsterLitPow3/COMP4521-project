// app/Dashboard/History.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  FlatList,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ProgressGreen } from '@/components/ui/progress(Green)';
import { ProgressRed } from '@/components/ui/progress(RED)';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/utils/supabase';
import { SearchInput } from '@/components/ui/search_input';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type TaskType = {
  taskID: number;
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number;
  progress: number;
};

function getDeadline(ddlDate: string, ddlTime: string) {
  const iso = ddlDate.replace(/\//g, '-') + 'T' + ddlTime;
  return new Date(iso);
}

export default function History() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 4, 0) : insets.top;

  const loadHistoryTasks = useCallback(async () => {
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
        taskStatus: raw.taskStatus,
        progress,
      });
    });

    historyTasks.sort((a, b) => {
      const da = getDeadline(a.ddlDate, a.ddlTime).getTime();
      const db = getDeadline(b.ddlDate, b.ddlTime).getTime();
      return db - da;
    });

    setTasks(historyTasks);
  }, []);

  useEffect(() => {
    loadHistoryTasks();
  }, [loadHistoryTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistoryTasks();
    setRefreshing(false);
  }, [loadHistoryTasks]);

  const filteredTasks =
    searchText.trim() === ''
      ? tasks
      : tasks.filter((task) => task.taskName.toLowerCase().includes(searchText.toLowerCase()));

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

        <Text style={styles.headerTitleText}>History</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/Dashboard/index_2')}
            style={styles.headerIconButton}>
            <AntDesign name="plus" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.taskID.toString()}
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.searchRow}>
              <SearchInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search history"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              <Ionicons
                name="search-outline"
                size={24}
                color={colors.foreground}
                style={styles.searchIcon}
              />
            </View>
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
    fontSize: 22,
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

  container: { paddingVertical: 14, paddingHorizontal: 10, flexGrow: 1 },
  listHeaderRow: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },

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
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 20,
    paddingRight: 10,
    paddingVertical: 10,
    fontSize: 18,
    textAlignVertical: 'center',
    marginTop: 2,
  },
  searchIcon: { marginLeft: 12, marginTop: 2 },
  cardTouchable: {
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cardTitle: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    color: 'black',
  },
  cardDescription: { color: '#666', marginBottom: -10 },
  cardIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginTop: 7,
  },
  progressWrap: {
    marginTop: 10,
    marginBottom: 5,
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    height: 6,
    width: Platform.OS === 'ios' ? 290 : 260,
    borderRadius: 4,
    backgroundColor: '#c3c3c3ff',
  },
});
