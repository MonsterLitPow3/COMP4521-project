import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Ionicons from '@expo/vector-icons/Ionicons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { router, useLocalSearchParams } from 'expo-router';
import data from 'data.json';

type SubTask = {
  sTName: string;
  sTddlDate: string;
  sTddlTime: string;
  Descriptions: string;
  sTStatus: number;
  Member: Record<string, string | boolean>;
  sTDocs: Record<string, string>;
};

type TaskType = {
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number;
  progress: number;
  subTasks: SubTask[];
};

export default function ProgressDetail() {
  const { count_key } = useLocalSearchParams();
  function getNumericParam(val: string | string[] | undefined): number {
    if (Array.isArray(val)) return parseInt(val[0], 10);
    if (typeof val === 'string') return parseInt(val, 10);
    return 0;
  }
  const idx = getNumericParam(count_key);

  // Fallback to 0 if not provided
  const task: TaskType | undefined = data[idx] || data[0];

  if (!task) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No task found</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View
        className="flex w-max items-center justify-center"
        style={{ marginBottom: 40, marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
          {task.taskName} - SubTasks
        </Text>
        {task.subTasks.map((subTask: SubTask, j: number) => (
          <Card
            key={j}
            className={`mb-10 w-80 flex-col ${
              subTask.sTStatus === 2 ? 'bg-gray-100' : 'bg-white'
            } shadow-inherit`}
            onTouchStart={() =>
              router.push({
                pathname: '/Dashboard/ProgressFinalDetail',
              })
            }>
            <CardHeader className="-ml-5 flex w-full flex-row items-center">
              <View className="ml-5 min-w-0 flex-1">
                <CardTitle className="mt-0.5 text-xl text-gray-500">{subTask.sTName}</CardTitle>
                <CardDescription className="text-sm text-gray-400">Members:</CardDescription>
                {Object.values(subTask.Member)
                  .filter(Boolean)
                  .map((member, idx, arr) => (
                    <CardDescription key={idx} className="-mt-1 text-xs text-gray-400">
                      {member}
                      {idx < arr.length - 1 ? ', ' : ''}
                    </CardDescription>
                  ))}
                <CardDescription>Descriptions:</CardDescription>
                <CardDescription className="text-xs text-gray-400">
                  {subTask.Descriptions}
                </CardDescription>
              </View>
              <CardContent>
                {subTask.sTStatus === 2 && (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={80}
                    color="lightgreen"
                    className="-mr-8 -mt-20"
                  />
                )}
                {subTask.sTStatus === 0 && (
                  <EvilIcons name="play" size={80} className="-mr-8 -mt-10" color="black" />
                )}
                {subTask.sTStatus === 1 && (
                  <EvilIcons name="exclamation" size={80} color="red" className="-mr-8 -mt-20" />
                )}
              </CardContent>
            </CardHeader>
            <View className="mr-3 flex-1 items-end justify-end">
              <CardDescription className="flex-1 items-end justify-end text-gray-400">
                Deadline: {subTask.sTddlDate} {subTask.sTddlTime}
              </CardDescription>
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
