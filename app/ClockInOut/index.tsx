import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MoonStarIcon, StarIcon, SunIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import {
  Image,
  type ImageStyle,
  View,
  TextInput,
  Pressable,
  TouchableOpacity,
  Platform,
  RefreshControl,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/lib/theme';

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

// Calculate distance between 2 GPS points in meters
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // Earth radius
  const toRad = (v: number) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // meters
}

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

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 6, 0) : insets.top;

  const selectedTeam = React.useMemo(() => {
    return teams.find((t) => t.teamId === selectedTeamId) || null;
  }, [selectedTeamId, teams]);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);

      // Re-fetch the teams data
      await getUserTeams(user.id); // async function
    } catch (e) {
      console.log('Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

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

  // !update! location fetching
  React.useEffect(() => {
    let subscriber;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscriber = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 1000, // update every 1s
          distanceInterval: 1, // or every 1 meter
        },
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.002,
            longitudeDelta: 0.002,
          });
        }
      );
    })();

    return () => subscriber?.remove();
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
      let withinLocation = true;
      // 1. Distance calculation
      if (location && team && team.locationLatitude && team.locationLongitude) {
        const distance = getDistanceMeters(
          location?.latitude,
          location?.longitude,
          team.locationLatitude,
          team.locationLongitude
        );

        withinLocation = distance <= 50;
      }
      if (!withinLocation) {
        alert('Not within the required location to clock in/out.');
        setLoading(false);
        return;
      } else {
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

          const now = new Date();
          let onTime = true;

          if (selectedTeam && selectedTeam.checkInTime && selectedTeam.checkOutTime) {
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            // 2. Parse team time
            const [ciH, ciM] = selectedTeam?.checkInTime.split(':').map(Number);
            const [coH, coM] = selectedTeam?.checkOutTime.split(':').map(Number);

            const ciMinutes = ciH * 60 + ciM;
            const coMinutes = coH * 60 + coM;

            if (!clockInStatus) {
              // user is clocking IN now
              onTime = nowMinutes <= ciMinutes;
            } else {
              // user is clocking OUT now
              onTime = nowMinutes >= coMinutes;
            }
          }

          // insert clock-in/out record
          const { data: recordData, error: recordError } = await supabase
            .from('ClockInOutRecords')
            .insert([
              {
                mId: team?.mId,
                teamId: selectedTeamId,
                timestamp: now.toISOString(),
                inOut: !clockInStatus ? 'IN' : 'OUT',
                locationLatitude: location?.latitude ?? null, // !update! to store location
                locationLongitude: location?.latitude ?? null,
                onTime: onTime,
              },
            ]);

          if (recordError) {
            console.error('Error inserting clock-in/out record:', recordError);
          } else {
            console.log('Clock-in/out record inserted:', recordData);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'bottom', 'left', 'right']}>
      {/* HEADER */}
      <View
        style={[
          styles.headerContainer,
          { backgroundColor: '#292D32', paddingTop: headerTopPadding },
        ]}>
        <TouchableOpacity onPress={() => router.push('../')} style={styles.headerBackButton}>
          <AntDesign name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitleText}>Clock In/Out</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          backgroundColor: colors.background,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text className="mb-4 text-2xl font-bold">Clock In/Out</Text>
          {/* !update! */}
          {!loading && location && (
            <View style={{ height: 300 }}>
              <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={location}>
                <Marker coordinate={location} title="You are here" />
                {selectedTeam &&
                  selectedTeam.locationLatitude &&
                  selectedTeam.locationLongitude && (
                    <Marker
                      coordinate={{
                        latitude: selectedTeam.locationLatitude,
                        longitude: selectedTeam.locationLongitude,
                      }}
                      pinColor="blue" // office marker color
                      title="Office Location"
                    />
                  )}
              </MapView>
            </View>
          )}

          <Text className="text-lg">{currentTime}</Text>
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
          <Text className="text-md mt-2">Teams:</Text>
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
          {selectedTeam && (
            <View style={{ marginTop: 12 }}>
              {selectedTeam.checkInTime && (
                <View>
                  <Text>Check-in window: {selectedTeam.checkInTime}</Text>
                </View>
              )}
              {selectedTeam.checkOutTime && (
                <View>
                  <Text>Check-out window: {selectedTeam.checkOutTime}</Text>
                </View>
              )}
              {selectedTeam.locationLatitude && selectedTeam.locationLongitude && (
                <View>
                  <Text>
                    Office location: {selectedTeam.locationLatitude},
                    {selectedTeam.locationLongitude}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 12,
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

  container: { flex: 1, padding: 16 },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  label: { fontSize: 15 },
  helpText: { fontSize: 13 },
  input: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
});
