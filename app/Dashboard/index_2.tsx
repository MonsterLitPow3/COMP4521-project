import { View, Text, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search_input';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { Add_New_Progress } from '@/components/ui/Add_New_Progress';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { router } from 'expo-router/build/imperative-api';
import { useRouter } from 'expo-router';
import { Icon, ChevronRight } from 'lucide-react-native';

export default function DashBoard() {
  const router = useRouter();
  return (
    <ScrollView>
      <View className="mb-20">
        <View className="mb-1.5 mt-5 items-center justify-center">
          <Text className="text-3xl">Add New Tasks</Text>
        </View>

        <View className="mb-7 ml-2 mr-6 mt-3 flex-row items-center justify-center">
          <SearchInput />
          <Ionicons name="search-outline" size={24} color="black" className="ml-7 mt-1" />
        </View>

        <View className="h-max w-max items-center justify-center">
          <Card className="mb-5 h-52 w-80 justify-center">
            <CardContent>
              <View className="w-full flex-row gap-2">
                <View className="mt-2.5 flex-col gap-y-10">
                  <Text className="">Name:</Text>
                  <Text>Deadline:</Text>
                </View>

                <View className="flex-col gap-y-5">
                  <Input id="NewTaskName" placeholder="Name of the New Task" />
                  <View className="flex-col gap-y-3">
                    <Input id="NewDealineDate" placeholder="DD/MM/YYYY" />
                    <Input id="NewDeadlineTime" placeholder="HH:MM:SS" />
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          <Card className="mb-5 h-max w-max bg-gray-200">
            <CardContent>
              <View className="w-full flex-row">
                <View className="mt-2.5 flex-col gap-y-10">
                  <Text className="">Progress 1:</Text>
                  <Text>Deadline:</Text>
                </View>

                <View className="flex-col gap-y-5">
                  <Input id="NewTaskName" placeholder="Name of the New Progress" />
                  <View className="flex-col gap-y-3">
                    <Input id="NewDealineDate" placeholder="DD/MM/YYYY" />
                    <Input id="NewDeadlineTime" placeholder="HH:MM:SS" />
                  </View>
                </View>
              </View>
            </CardContent>

            <CardContent>
              <View className="flex-row">
                <View className="mt-2.5 flex-col gap-y-32">
                  <Text className="">Description:</Text>
                  <Text>Documents:</Text>
                </View>

                <View className="flex-col gap-y-5">
                  <Input
                    id="NewProgressDescription"
                    placeholder="Details of new progress"
                    className="h-32 w-52"
                  />
                  <Input id="NewProgressDocuments" placeholder="Upload your documents here" />
                </View>
              </View>
            </CardContent>
          </Card>

          <View className="h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm shadow-black">
            <MaterialCommunityIcons
              onPress={() => router.push('/Dashboard/index_3')}
              name="plus"
              size={20}
              color="black"
              className=""
            />
          </View>

          <View className="mt-5 h-max w-max flex-row items-center justify-center">
            <Button className="">
              <Text className="color-white">Pulish Task</Text>
            </Button>
          </View>

          {/* <Add_New_Progress/> */}
        </View>
      </View>
    </ScrollView>
  );
}

// function Add_New_Progress() {
//   <Card className="mb-5 h-max w-max">
//     <CardContent>
//       <View className="w-full flex-row">
//         <View className="mt-2.5 flex-col gap-y-10">
//           <Text className="">Progress 1:</Text>
//           <Text>Deadline:</Text>
//         </View>

//         <View className="flex-col gap-y-5">
//           <Input id="NewTaskName" placeholder="Name of the New Progress" />
//           <View className="flex-col gap-y-3">
//             <Input id="NewDealineDate" placeholder="DD/MM/YYYY" />
//             <Input id="NewDeadlineTime" placeholder="HH:MM:SS" />
//           </View>
//         </View>
//       </View>
//     </CardContent>

//     <CardContent>
//       <View className="flex-row">
//         <View className="mt-2.5 flex-col gap-y-32">
//           <Text className="">Description:</Text>
//           <Text>Documents:</Text>
//         </View>

//         <View className="flex-col gap-y-5">
//           <Input
//             id="NewProgressDescription"
//             placeholder="Details of new progress"
//             className="h-32 w-52"
//           />
//           <Input id="NewProgressDocuments" placeholder="Upload your documents here" />
//         </View>
//       </View>
//     </CardContent>
//   </Card>;
// }

// export { Add_New_Progress };
