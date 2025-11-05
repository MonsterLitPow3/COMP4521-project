import { View } from 'react-native';
import { Card, CardContent } from './card';
import { Input } from './input';

function Add_New_Progress() {
  <Card className="mb-5 h-max w-max">
    <CardContent>
      <View className="w-full flex-row">
        <View className="mt-2.5 flex-col gap-y-10">
          <View>Progress 1:</View>
          <View>Deadline:</View>
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
          <View>Description:</View>
          <View>Documents:</View>
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
  </Card>;
}

export { Add_New_Progress };
