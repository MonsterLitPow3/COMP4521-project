import { View, Text, Button } from 'react-native';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search_input';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressGreen } from '@/components/ui/progress(Green)';
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

export default function DashBoard() {
  const [progress, setProgress] = React.useState(13);

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(99), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView>
      <View className="mb-10">
        <View className="mb-1.5 mt-5 items-center justify-center">
          <Text className="text-3xl">History</Text>
        </View>

        <View className="mb-7 ml-2 mr-6 mt-3 flex-row items-center justify-center">
          <SearchInput />
          <Ionicons name="search-outline" size={24} color="black" className="ml-7 mt-1" />
        </View>

        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col bg-slate-50 shadow-inherit">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl text-gray-400">Task 1</CardTitle>
                <CardDescription className="text-gray-300">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <Ionicons name="checkmark-circle-outline" size={55} color="lightgreen" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressGreen value={progress} className="h-1.5 w-64 color-red-400 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>

        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col bg-slate-50 shadow-inherit">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl text-gray-400">Task 2</CardTitle>
                <CardDescription className="text-gray-300">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <Ionicons name="checkmark-circle-outline" size={55} color="lightgreen" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressGreen value={progress} className="h-1.5 w-64 color-red-400 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>

        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl">Task 3</CardTitle>
                <CardDescription className="">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <EvilIcons name="exclamation" size={60} color="red" className="" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressRed value={progress} className="h-1.5 w-64 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>

        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col bg-slate-50 shadow-inherit">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl text-gray-400">Task 4</CardTitle>
                <CardDescription className="text-gray-300">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <Ionicons name="checkmark-circle-outline" size={55} color="lightgreen" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressGreen value={progress} className="h-1.5 w-64 color-red-400 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>

        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl">Task 5</CardTitle>
                <CardDescription className="">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <EvilIcons name="exclamation" size={60} color="red" className="" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressRed value={progress} className="h-1.5 w-64 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>
        <View className="mb-5 flex items-center justify-center">
          <Card className="w-80 flex-col">
            <CardHeader className="flex-row">
              <CardHeader>
                <CardTitle className="text-xl">Task 6</CardTitle>
                <CardDescription className="">00/00/0000 00:00:00</CardDescription>
              </CardHeader>
              <CardContent>
                <EvilIcons name="exclamation" size={60} color="red" className="" />
              </CardContent>
            </CardHeader>

            {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

            <View className="w-max items-center justify-center">
              <Text className="h-max w-max flex-1 items-center justify-center">
                <ProgressRed value={progress} className="h-1.5 w-64 md:w-[100%]" />
              </Text>
            </View>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}
