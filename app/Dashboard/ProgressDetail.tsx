import { View, Text, Button } from 'react-native';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search_input';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressRed } from '@/components/ui/progress(RED)';
import { Progress } from '@/components/ui/progress';
import { ScrollView } from 'react-native';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import * as React from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { Stack, useRouter } from 'expo-router';

export default function DashBoard() {
  const [progress, setProgress] = React.useState(13);
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(99), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView>
      <View className="mb-10">
        <View className="mb-1.5 mt-5 items-center justify-center">
          <Text className="text-3xl">Sub-Tasks-One</Text>
        </View>

        {/* <View className="mb-7 ml-2 mr-6 mt-3 flex-row items-center justify-center">
          <SearchInput />
          <Ionicons name="search-outline" size={24} color="black" className="ml-7 mt-1" />
        </View> */}

        <View
          className="mb-5 mt-5 w-max items-center justify-center"
          onTouchStart={() => router.push('/Dashboard/ProgressFinalDetail')}>
          <Card className="w-80 flex-col bg-slate-100 shadow-inherit">
            <CardHeader className="-ml-5 w-max flex-row">
              <CardHeader>
                <CardTitle className="mt-0.5 text-xl text-gray-500">Sub-Task 1</CardTitle>
                <CardDescription className="text-xs text-gray-400">Members:</CardDescription>
                <CardDescription className="-mt-3 text-gray-400">
                  xxxx, xxxxx, xxxxxxxxx
                </CardDescription>
                <CardDescription>Descriptions:</CardDescription>
                <CardDescription className="-mt-2.5 text-gray-400">
                  XXXXXXXXXXXXXXXXXXX
                </CardDescription>
                <CardDescription className="-mt-2.5 text-gray-400">
                  XXXXXXXXXXXXXXXXXXX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={55}
                  color="lightgreen"
                  className="-ml-5"
                />
              </CardContent>
            </CardHeader>
            <View className="mr-3 flex-1 items-end justify-end">
              <CardDescription className="flex-1 items-end justify-end text-gray-400">
                Deadline: DD/MM/YYYY HH/MM
              </CardDescription>
            </View>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            {/* <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <Progress value={progress} className="h-1.5 w-64 color-red-400 md:w-[70%]" />
              </Text>
            </View> */}
          </Card>
        </View>

        <View
          className="mb-5 w-max items-center justify-center"
          onTouchStart={() => router.push('/Dashboard/ProgressFinalDetail')}>
          <Card className="w-80 flex-col">
            <CardHeader className="-ml-5 w-max flex-row">
              <CardHeader>
                <CardTitle className="mt-0.5 text-xl">Sub-Task 2</CardTitle>
                <CardDescription className="text-xs">Members:</CardDescription>
                <CardDescription className="-mt-3">xxxx, xxxxx, xxxxxxxxx</CardDescription>
                <CardDescription>Descriptions:</CardDescription>
                <CardDescription className="-mt-2.5">XXXXXXXXXXXXXXXXXXX</CardDescription>
                <CardDescription className="-mt-2.5">XXXXXXXXXXXXXXXXXXX</CardDescription>
              </CardHeader>
              <CardContent>
                <EvilIcons name="play" size={60} color="black" className="-ml-5" />
              </CardContent>
            </CardHeader>
            <View className="mr-3 flex-1 items-end justify-end">
              <CardDescription className="flex-1 items-end justify-end">
                Deadline: DD/MM/YYYY HH/MM
              </CardDescription>
            </View>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            {/* <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <Progress value={progress} className="h-1.5 w-64 color-red-400 md:w-[70%]" />
              </Text>
            </View> */}
          </Card>
        </View>

        <View
          className="mb-5 w-max items-center justify-center"
          onTouchStart={() => router.push('/Dashboard/ProgressFinalDetail')}>
          <Card className="w-80 flex-col">
            <CardHeader className="-ml-5 w-max flex-row">
              <CardHeader>
                <CardTitle className="mt-0.5 text-xl">Sub-Task 3</CardTitle>
                <CardDescription className="text-xs">Members:</CardDescription>
                <CardDescription className="-mt-3">xxxx, xxxxx, xxxxxxxxx</CardDescription>
                <CardDescription>Descriptions:</CardDescription>
                <CardDescription className="-mt-2.5">XXXXXXXXXXXXXXXXXXX</CardDescription>
                <CardDescription className="-mt-2.5">XXXXXXXXXXXXXXXXXXX</CardDescription>
              </CardHeader>
              <CardContent>
                <EvilIcons name="exclamation" size={60} color="red" className="-ml-5" />
              </CardContent>
            </CardHeader>
            <View className="mr-3 flex-1 items-end justify-end">
              <CardDescription className="flex-1 items-end justify-end">
                Deadline: DD/MM/YYYY HH/MM
              </CardDescription>
            </View>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            {/* <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <Progress value={progress} className="h-1.5 w-64 color-red-400 md:w-[70%]" />
              </Text>
            </View> */}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
