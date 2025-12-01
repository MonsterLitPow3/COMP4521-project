import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { Image, type ImageStyle, View, TextInput, Pressable } from 'react-native';
import { supabase } from '@/utils/supabase';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const SCREEN_OPTIONS = {
  title: 'React Native Reusables',
  headerTransparent: true,
  headerRight: () => <ThemeToggle />,
};

const IMAGE_STYLE: ImageStyle = {
  height: 76,
  width: 76,
};

type TeamType = {
  teamId: number;
  mId: number;
  role: string;
  name: string;
  checkInTime: string;
  checkOutTime: string;
  locationLatitude: number;
  locationLongitude: number;
  ClockInStatus: boolean;
};

const getUserTeams = async (uid: string): Promise<TeamType[]> => {
  const { data, error } = await supabase
    .from('TeamMembers')
    .select(
      'mId, teamId, role, ClockInStatus, Teams!TeamMembers_teamId_fkey ( name, checkInTime, checkOutTime, locationLatitude, locationLongitude )'
    )
    .eq('uId', uid);

  if (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
  if (!data) {
    console.error('No data returned for user teams');
    return [];
  }

  const formattedData: TeamType[] = data.map((item) => ({
    teamId: item.teamId,
    mId: item.mId,
    role: item.role,
    name: item.Teams.name,
    checkInTime: item.Teams.checkInTime,
    checkOutTime: item.Teams.checkOutTime,
    locationLatitude: item.Teams.locationLatitude,
    locationLongitude: item.Teams.locationLongitude,
    ClockInStatus: item.ClockInStatus,
  }));

  console.log('Fetched user teams:', formattedData);

  return formattedData;
};

export default function ClockInOutScreen() {
  const [user, setUser] = React.useState<any>(null);
  const [currentTime, setCurrentTime] = React.useState<string>('');
  const [teams, setTeams] = React.useState<TeamType[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);
  const [clockInStatus, setClockInStatus] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  type Location = {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  const [location, setLocation] = React.useState<Location | null>(null);

  React.useEffect(() => {
    if (selectedTeamId === null) {
      setClockInStatus(null);
      return;
    }
    const selectedTeam = teams.find((team) => team.teamId === selectedTeamId);
    setClockInStatus(selectedTeam ? selectedTeam.ClockInStatus : null);
  }, [selectedTeamId, teams]);

  React.useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();
  }, []);

  React.useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    getUserTeams(user.id)
      .then((t) => {
        if (mounted) setTeams(t);
      })
      .catch(console.error);
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      setCurrentTime(timeString);
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // location fetching
  React.useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Request permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission denied');
          setLoading(false);
          return;
        }

        // Get location
        let current = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e) {
        console.log('Location error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, []);

  const handleClockInOut = async () => {
    setLoading(true);
    try {
      if (selectedTeamId === null || user === null) {
        console.error('No team selected or user not logged in');
        setLoading(false);
        return;
      }
      const team = teams.find((team) => team.teamId === selectedTeamId);

      const { data, error } = await supabase
        .from('TeamMembers')
        .update({ ClockInStatus: !clockInStatus })
        .eq('uId', user.id)
        .eq('teamId', selectedTeamId)
        .select();

      if (error) {
        console.error('Error updating clock-in status:', error);
      } else {
        console.log('Clock-in status updated:', data);
        setClockInStatus(!clockInStatus);
        setTeams((prevTeams) =>
          prevTeams.map((team) =>
            team.teamId === selectedTeamId ? { ...team, ClockInStatus: !clockInStatus } : team
          )
        );

        // insert clock-in/out record
        const now = new Date();
        const { data: recordData, error: recordError } = await supabase
          .from('ClockInOutRecords')
          .insert([
            {
              mId: team?.mId,
              teamId: selectedTeamId,
              timestamp: now.toISOString(),
              inOut: !clockInStatus ? 'IN' : 'OUT',
            },
          ]);

        if (recordError) {
          console.error('Error inserting clock-in/out record:', recordError);
        } else {
          console.log('Clock-in/out record inserted:', recordData);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="mb-4 text-2xl font-bold">Clock In/Out</Text>

      {!loading && location && (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ width: '100%', height: '60%' }}
          region={location}>
          <Marker coordinate={location} title="You are here" />
        </MapView>
      )}

      <Text className="text-lg">{currentTime}</Text>
      <Text className="text-md mt-2">Teams:</Text>
      <View className="flex-row gap-2">
        <Button
          variant="outline"
          disabled={loading || selectedTeamId == null}
          onPress={handleClockInOut}
          className="flex-1">
          <Text>{loading ? 'Please wait...' : clockInStatus ? 'Clock Out' : 'Clock In'}</Text>
        </Button>
      </View>
      <Text>
        Clock in status:{' '}
        {clockInStatus !== null
          ? clockInStatus
            ? 'Clocked In'
            : 'Clocked Out'
          : 'No team selected'}
      </Text>
      {teams.map((team) => {
        const isSelected = team.teamId === selectedTeamId;
        return (
          <Pressable
            key={team.teamId}
            onPress={() => setSelectedTeamId(team.teamId)}
            className={`my-1 w-full rounded p-2 ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}`}>
            <Text className={`text-sm ${isSelected ? 'text-white' : 'text-black'}`}>
              {team.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const THEME_ICONS = {
  light: SunIcon,
  dark: MoonStarIcon,
};

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <Button
      onPressIn={toggleColorScheme}
      size="icon"
      variant="ghost"
      className="ios:size-9 rounded-full web:mx-4">
      <Icon as={THEME_ICONS[colorScheme ?? 'light']} className="size-5" />
    </Button>
  );
}
