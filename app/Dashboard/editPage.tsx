import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Card, CardContent } from '@/components/ui/card';

// Editable SubTask type
type SubTask = {
  subTaskID?: number; // optional: undefined for newly added subtasks
  pId: number;
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTStatus: number;
};

type SubTaskField = keyof Omit<SubTask, 'subTaskID' | 'pId' | 'sTStatus'>;

function isValidDate(str: string) {
  const match = str.match(/^(\d{2,4})\/(\d{2})\/(\d{2})$/);
  if (!match) return false;
  let [_, year, month, day] = match;
  year = year.length === 2 ? '20' + year : year;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(`${year}-${month}-${day}`);
  return date.getFullYear() === +year && date.getMonth() + 1 === m && date.getDate() === d;
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

  // main task fields
  const [taskName, setTaskName] = useState('');
  const [ddlDate, setDdlDate] = useState('');
  const [ddlTime, setDdlTime] = useState('');

  // editable subtasks (existing + newly added)
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  useEffect(() => {
    const fetchTaskAndSubTasks = async () => {
      if (!taskID) {
        Alert.alert('Error', 'No Task ID found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const numericTaskId = Number(taskID);

        // 1. Fetch Task
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

        // 2. Fetch SubTasks
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
            }))
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndSubTasks();
  }, [taskID]);

  const handleSubTaskChange = (idx: number, field: SubTaskField, value: string) => {
    setSubTasks((prev) => prev.map((st, i) => (i === idx ? { ...st, [field]: value } : st)));
  };

  const addSubTaskPanel = () => {
    if (!taskID) return;
    const numericTaskId = Number(taskID);
    setSubTasks((prev) => [
      ...prev,
      {
        subTaskID: undefined, // new; will be inserted
        pId: numericTaskId,
        sTName: '',
        sTddlDate: '',
        sTddlTime: '',
        Descriptions: '',
        sTStatus: 0,
      },
    ]);
  };

  const handleUpdate = async () => {
    if (!taskID) {
      Alert.alert('Error', 'No Task ID found.');
      return;
    }

    // 1. Validate formats
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

    // 2. Required fields
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

    // 3. Edit mode always sets Exclamation status (1)
    const taskDeadline = getFullDateTime(ddlDate, ddlTime);
    const now = new Date();
    console.log('Edited deadline vs now:', taskDeadline, now);

    const exclamationStatus = 1;

    setLoading(true);
    try {
      // 4. Update main Task
      const { error: taskErr } = await supabase
        .from('Tasks')
        .update({
          taskName,
          ddlDate,
          ddlTime,
          taskStatus: exclamationStatus, // always 1 in edit mode
        })
        .eq('taskID', numericTaskId);

      if (taskErr) {
        Alert.alert('Update Error', taskErr.message);
        setLoading(false);
        return;
      }

      // Split subtasks into existing vs new
      const existingSubTasks = subTasks.filter((st) => st.subTaskID != null);
      const newSubTasks = subTasks.filter((st) => st.subTaskID == null);

      // 5a. Update existing SubTasks
      for (const st of existingSubTasks) {
        const { error: sErr } = await supabase
          .from('subTasks')
          .update({
            sTName: st.sTName,
            sTddlDate: st.sTddlDate,
            sTddlTime: st.sTddlTime,
            Descriptions: st.Descriptions,
          })
          .eq('subTaskID', st.subTaskID as number);

        if (sErr) {
          Alert.alert('SubTask Update Error', sErr.message);
          setLoading(false);
          return;
        }
      }

      // 5b. Insert newly added SubTasks
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

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Loading Task...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View className="mb-1 w-max flex-1 items-center justify-center">
        <Text style={styles.title}>Edit Task</Text>
      </View>
      <Card className="mb-7">
        <CardContent>
          <TextInput
            style={styles.input}
            className="mt-3"
            value={taskName}
            onChangeText={setTaskName}
            placeholder="Task Name"
          />
          <TextInput
            style={styles.input}
            className="mt-2"
            value={ddlDate}
            onChangeText={setDdlDate}
            placeholder="Deadline Date (YY/MM/DD)"
          />
          <TextInput
            style={styles.input}
            className="mt-2"
            value={ddlTime}
            onChangeText={setDdlTime}
            placeholder="Deadline Time (HH:MM:SS)"
          />
        </CardContent>
      </Card>

      {subTasks.map((subTask, idx) => (
        <View key={subTask.subTaskID ?? `new-${idx}`}>
          <Card style={styles.subTaskCard}>
            <Text style={styles.subtitle}>SubTask {idx + 1}</Text>
            <TextInput
              style={styles.input}
              value={subTask.sTName}
              onChangeText={(v) => handleSubTaskChange(idx, 'sTName', v)}
              placeholder="SubTask Name"
            />
            <TextInput
              style={styles.input}
              value={subTask.sTddlDate}
              onChangeText={(v) => handleSubTaskChange(idx, 'sTddlDate', v)}
              placeholder="Deadline Date (YY/MM/DD)"
            />
            <TextInput
              style={styles.input}
              value={subTask.sTddlTime}
              onChangeText={(v) => handleSubTaskChange(idx, 'sTddlTime', v)}
              placeholder="Deadline Time (HH:MM:SS)"
            />
            <TextInput
              style={styles.input}
              value={subTask.Descriptions}
              onChangeText={(v) => handleSubTaskChange(idx, 'Descriptions', v)}
              placeholder="Description"
            />
          </Card>
          <View className="mt-3" />
        </View>
      ))}

      {/* "+" Add SubTask Button */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fafafa' },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 38,
    backgroundColor: '#fafafa',
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
    backgroundColor: '#f3f4f6',
    marginBottom: 10,
    borderRadius: 7,
    height: 40,
    paddingHorizontal: 10,
  },
  subTaskCard: {
    backgroundColor: '#cfcfcfff',
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
    shadowOffset: { width: 10, height: 4 },
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
    elevation: 2,
  },
  publishButtonText: {
    color: 'white',
    fontSize: 19,
    fontWeight: 'bold',
  },
});
