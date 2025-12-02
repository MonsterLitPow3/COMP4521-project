// app/Dashboard/index.tsx
import React, { useCallback, useState } from 'react';
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
import EvilIcons from '@expo/vector-icons/EvilIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
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
  TeamId: number | null;
};

function getDeadline(ddlDate: string, ddlTime: string) {
  const iso = ddlDate.replace(/\//g, '-') + 'T' + ddlTime;
  return new Date(iso);
}

export default function DashBoard() {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const insets = useSafeAreaInsets();

  const handleReceive = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setTasks([]);
      return;
    }

    const { data: memberships, error: memError } = await supabase
      .from('TeamMembers')
      .select('teamId')
      .eq('uId', user.id);

    if (memError || !memberships || memberships.length === 0) {
      setTasks([]);
      return;
    }

    const teamIds = memberships.map((m: any) => m.teamId);

    const { data, error } = await supabase.from('Tasks').select('*').in('TeamId', teamIds);

    if (error) {
      console.error('Cannot receive data from supabase.', error);
      setTasks([]);
      return;
    }

    const now = new Date();
    const nonFinished = (data ?? []).filter((task: TaskType) => {
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

  useFocusEffect(
    useCallback(() => {
      handleReceive();
    }, [handleReceive])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleReceive();
    setRefreshing(false);
  }, [handleReceive]);

  const filteredTasks =
    searchText.trim() === ''
      ? tasks
      : tasks.filter((task) => task.taskName.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        <View
          style={[
            styles.headerContainer,
            {
              backgroundColor: '#292D32',
              paddingTop: insets.top,
            },
          ]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.push('/Dashboard')}
              style={styles.headerBackButton}>
              <AntDesign name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitleText}>Dashboard</Text>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/Dashboard/index_2')}
              style={styles.headerIconButton}>
              <AntDesign name="plus" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/Dashboard/History')}
              style={styles.headerIconButton}>
              <AntDesign name="clock-circle" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.taskID.toString()}
          contentContainerStyle={styles.listContent}
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
                  placeholder="Search tasks"
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
                    {item.taskStatus === 1 && (
                      <EvilIcons name="exclamation" size={60} color="red" />
                    )}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
    minHeight: 10,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    width: 80,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
    marginLeft: 4,
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
  listContent: { paddingVertical: 14, paddingHorizontal: 10, flexGrow: 1 },
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
