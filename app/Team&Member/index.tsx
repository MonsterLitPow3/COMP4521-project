import { View, Text } from 'react-native';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search_input';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
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
import { Label } from '@/components/ui/label';
import { Add_New_Progress } from '@/components/ui/Add_New_Progress';
import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { router } from 'expo-router/build/imperative-api';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/button';

export default function DashBoard() {
  const router = useRouter();
  return (
    <ScrollView>
      <View className="mb-10">
        <Text>This is a page for the Team&Member Function </Text>
        <Text>Noticed that</Text>
        <Text>1. Create Team -≥ set creator to leader role</Text>
        <Text>2. Join a Team -≥ Input TeamID (unique)</Text>
      </View>
    </ScrollView>
  );
}
