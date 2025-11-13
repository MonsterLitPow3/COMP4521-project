// import { View, Text, Button } from 'react-native';
// import { Input } from '@/components/ui/input';
// import { SearchInput } from '@/components/ui/search_input';
// import AntDesign from '@expo/vector-icons/AntDesign';
// import Ionicons from '@expo/vector-icons/Ionicons';
// import { ProgressRed } from '@/components/ui/progress(RED)';
// import { Progress } from '@/components/ui/progress';
// import { ScrollView } from 'react-native';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import * as React from 'react';
// import MaterialIcons from '@expo/vector-icons/MaterialIcons';
// import EvilIcons from '@expo/vector-icons/EvilIcons';
// import { Stack, useRouter } from 'expo-router';
// import data from 'data.json';

// // 0 -> play icon, 1 -> excl icon, 2 -> tick icon

// export default function DashBoard() {
//   const [progress, setProgress] = React.useState(50);
//   const router = useRouter();

//   React.useEffect(() => {
//     const timer = setTimeout(() => setProgress(data[1].progress), 500);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <ScrollView>
//       <View className="mb-10">
//         <View className="mb-1.5 mt-5 items-center justify-center">
//           <Text className="text-3xl">Tasks</Text>
//         </View>

//         <View className="mb-7 ml-2 mr-6 mt-3 flex-row items-center justify-center">
//           <SearchInput />
//           <Ionicons name="search-outline" size={24} color="black" className="ml-7 mt-1" />
//         </View>
//         {data.map((d, i) => (
//           <View
//             key={i}
//             className="mb-5 flex items-center justify-center"
//             onTouchStart={() => router.push('/Dashboard/ProgressDetail')}>
//             <Card className="w-80 flex-col">
//               <CardHeader className="flex-row">
//                 <CardHeader>
//                   <CardTitle className="text-xl">
//                     {i + 1}. {d.taskName}
//                   </CardTitle>
//                   <CardDescription>
//                     {d.ddlDate} {d.ddlTime}
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   {d.taskStatus === 0 && (
//                     <EvilIcons name="play" size={60} color="black" className="" />
//                   )}
//                   {d.taskStatus === 1 && (
//                     <EvilIcons name="exclamation" size={60} color="red" className="" />
//                   )}
//                   {d.taskStatus === 2 && (
//                     <EvilIcons name="play" size={60} color="black" className="" />
//                   )}
//                 </CardContent>
//               </CardHeader>

//               {/* <View className="ml-8 flex h-1.5 w-64 items-center justify-center rounded-full bg-gray-400 align-middle" /> */}

//               <View className="w-max items-center justify-center">
//                 <Text className="h-max w-max flex-1 items-center justify-center">
//                   {d.taskStatus === 0 && (
//                     <Progress value={progress} className="h-1.5 w-64 color-red-400 md:w-[70%]" />
//                   )}
//                   {d.taskStatus === 1 && (
//                     <ProgressRed value={progress} className="h-1.5 w-64 color-red-400 md:w-[30%]" />
//                   )}
//                 </Text>
//               </View>
//             </Card>
//           </View>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressRed } from '@/components/ui/progress(RED)';
import { Progress } from '@/components/ui/progress';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { useRouter } from 'expo-router';
import data from 'data.json';

type TaskType = {
  taskName: string;
  ddlDate: string;
  ddlTime: string;
  taskStatus: number;
  progress: number;
  subTasks: any[];
};

export default function DashBoard() {
  const [searchText, setSearchText] = React.useState('');
  const [filteredData, setFilteredData] = React.useState<TaskType[] | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredData(null);
    } else {
      const filtered = data.filter((d: TaskType) =>
        d.taskName.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchText]);

  const taskList = filteredData !== null ? filteredData : data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Tasks</Text>
      </View>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search tasks"
          placeholderTextColor="#aaa"
          returnKeyType="search"
        />
        <TouchableOpacity onPress={() => {}} accessible accessibilityLabel="Search button">
          <Ionicons name="search-outline" size={24} color="black" style={styles.searchIcon} />
        </TouchableOpacity>
      </View>
      {taskList.map((d: TaskType, i: number) => (
        <View key={i} style={styles.cardTouchable}>
          <Card
            style={styles.card}
            onTouchStart={() =>
              router.push({
                pathname: '/Dashboard/ProgressDetail',
                params: { count_key: i },
              })
            }>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardTitleWrap}>
                <CardTitle style={styles.cardTitle}>
                  {i + 1}. {d.taskName}
                </CardTitle>
                <CardDescription style={styles.cardDescription}>
                  {d.ddlDate} {d.ddlTime}
                </CardDescription>
              </View>
              <View style={styles.cardIconWrap}>
                {d.taskStatus === 0 && <EvilIcons name="play" size={60} color="black" />}
                {d.taskStatus === 1 && <EvilIcons name="exclamation" size={60} color="red" />}
                {d.taskStatus === 2 && <EvilIcons name="check" size={60} color="green" />}
              </View>
            </View>
            <View style={styles.progressWrap}>
              {d.taskStatus === 0 && <Progress value={d.progress} style={styles.progressBar} />}
              {d.taskStatus === 1 && (
                <ProgressRed value={d.progress} style={styles.progressBarRed} />
              )}
              {d.taskStatus === 2 && <Progress value={d.progress} style={styles.progressBar} />}
            </View>
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  headerContainer: {
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    height: 40,
    width: 100,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: '#ffffffff',
    color: 'black',
    paddingLeft: 10,
    paddingVertical: 0, // add this to center vertically on iOS
    lineHeight: 17, // optional: adjust as needed for font size
  },

  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  // searchInput: {
  //   flex: 1,
  //   height: 40,
  //   borderColor: '#ccc',
  //   borderWidth: 1,
  //   paddingLeft: 8,
  //   borderRadius: 8,
  //   backgroundColor: '#fff',
  // },
  searchIcon: {
    marginLeft: 12,
    marginTop: 2,
  },
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
  cardTitleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: 5,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cardDescription: {
    color: '#666',
    marginBottom: -10,
  },
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
  progressBarRed: {
    height: 6,
    width: Platform.OS === 'ios' ? 290 : 260,
    borderRadius: 4,
    backgroundColor: '#c3c3c3ff',
  },
  progressBarGreen: {
    height: 6,
    width: Platform.OS === 'ios' ? 290 : 260,
    borderRadius: 4,
    backgroundColor: '#c3c3c3ff',
  },
});
