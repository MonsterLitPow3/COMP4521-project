// app/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  TextInput,
} from 'react-native';
import AntDesign from '@expo/vector-icons/AntDesign';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { THEME } from '@/lib/theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 6, 0) : insets.top;

  // ----- Manager state -----
  const [role, setRole] = React.useState<string | null>(null);
  // const [teamId, setTeamId] = React.useState<number | null>(null);
  const [teamData, setTeamData] = React.useState<any>(null);

  // Add state for multiple teams
  const [teams, setTeams] = React.useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = React.useState<number | null>(null);
  const [clockInTime, setClockInTime] = React.useState(new Date());
  const [clockOutTime, setClockOutTime] = React.useState(new Date());
  const [lat, setLat] = React.useState('');
  const [lng, setLng] = React.useState('');

  // Load user role + team settings
  React.useEffect(() => {
    async function load() {
      // 1. Get current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Get all teams where user is leader
      const { data: memberTeams } = await supabase
        .from('TeamMembers')
        .select('role, teamId')
        .eq('uId', user.id);

      if (!memberTeams) return;

      // check if user is a leader for any team
      const leaderTeams = memberTeams.filter((m) => m.role === 'leader');
      // setTeams(leaderTeams.map((m) => ({ teamId: m.teamId })));

      // Fetch team name for each teamId
      const teamIds = leaderTeams.map((m) => m.teamId);

      // Fetch only teamId + name
      const { data: teamNames } = await supabase
        .from('Teams')
        .select('teamId, name')
        .in('teamId', teamIds);

      setTeams(teamNames || []);

      if (leaderTeams.length > 0) setSelectedTeamId(leaderTeams[0].teamId);

      // Optionally set role for rendering sections
      setRole(leaderTeams.length > 0 ? 'leader' : memberTeams[0]?.role || null);
      if (leaderTeams.length == 1) {
        setSelectedTeamId(leaderTeams[0].teamId);
        // setTeamId(leaderTeams[0].teamId);
      }
    }

    load();
  }, []);

  // When selectedTeamId changes, load that team's settings
  React.useEffect(() => {
    if (!selectedTeamId) return;

    async function loadTeamSettings() {
      const { data: t } = await supabase
        .from('Teams')
        .select('*')
        .eq('teamId', selectedTeamId)
        .single();

      if (!t) return;

      setTeamData(t);
      if (t.checkInTime) setClockInTime(new Date(`1970-01-01T${t.checkInTime}`));
      if (t.checkOutTime) setClockOutTime(new Date(`1970-01-01T${t.checkOutTime}`));
      if (t.locationLatitude) setLat(String(t.locationLatitude));
      if (t.locationLongitude) setLng(String(t.locationLongitude));
    }
    loadTeamSettings();
  }, [selectedTeamId]);

  // React.useEffect(() => {
  //   async function load() {
  //     const { data: userData } = await supabase.auth.getUser();
  //     console.log('🔵 Logged-in user:', userData?.user);

  //     const { data: member, error } = await supabase
  //       .from('TeamMembers')
  //       .select('*')
  //       .eq('uId', userData?.user?.id)
  //       .maybeSingle();

  //     console.log('🟡 TeamMembers row:', member);
  //     console.log('🔴 Supabase error:', error);

  //     if (!member) {
  //       console.log('❌ No TeamMembers row found for this user');
  //     } else {
  //       console.log('🟢 Role detected:', member.role);
  //     }
  //   }

  //   load();
  // }, []);

  const setCurrentLocationAsOffice = async () => {
    try {
      // Ask permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      // Get current location
      const loc = await Location.getCurrentPositionAsync({});
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      // correctly update REAL column names in DB
      const { error } = await supabase
        .from('Teams')
        .update({
          locationLatitude: latitude,
          locationLongitude: longitude,
        })
        .eq('teamId', selectedTeamId);

      if (error) {
        console.log('Supabase update error:', error);
        alert('Failed to update office location: ' + error.message);
      } else {
        alert('Office location updated!');
        setTeamData((prev) => ({
          ...prev,
          locationLatitude: latitude,
          locationLongitude: longitude,
        }));
      }
    } catch (err) {
      console.log(err);
      alert('Error getting location');
    }
  };

  // Save updated team settings
  const saveTeamSettings = async () => {
    if (!selectedTeamId) return;

    const { error } = await supabase
      .from('Teams')
      .update({
        checkInTime: clockInTime.toTimeString().slice(0, 5),
        checkOutTime: clockOutTime.toTimeString().slice(0, 5),
        locationLatitude: parseFloat(lat),
        locationLongitude: parseFloat(lng),
      })
      .eq('teamId', selectedTeamId);

    if (error) alert('Error saving: ' + error.message);
    else alert('Team settings updated!');
  };

  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [signOutLoading, setSignOutLoading] = React.useState(false);
  const [signOutMessage, setSignOutMessage] = React.useState<string | null>(null);
  const [pickClockInTime, setPickClockInTime] = React.useState(false);
  const [pickClockOutTime, setPickClockOutTime] = React.useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('No user logged in');

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
      alert('Password updated successfully');
    } catch (error: any) {
      alert('Error updating password: ' + error.message);
    } finally {
      setPassword('');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    setSignOutMessage(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutMessage(error.message);
      } else {
        // After logout, go back to auth (index)
        router.replace('/');
      }
    } catch (err: any) {
      setSignOutMessage(err?.message ?? 'An unexpected error occurred');
    } finally {
      setSignOutLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
        {/* Header */}
        <View
          style={[
            styles.headerContainer,
            { backgroundColor: '#292D32', paddingTop: headerTopPadding },
          ]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('../')} style={styles.headerBackButton}>
              <AntDesign name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.headerTitleText}>Settings</Text>

          <View style={styles.headerRight} />
        </View>

        <ScrollView>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Appearance</Text>

              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.foreground }]}>Dark mode</Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleColorScheme}
                  thumbColor={isDark ? '#f9fafb' : '#111827'}
                  trackColor={{ false: '#d1d5db', true: '#4b5563' }}
                />
              </View>
              <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                Toggle between light and dark themes. This will affect dashboard and other screens.
              </Text>
            </View>
          </View>

          {/* Reset Password */}
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.section, { borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>New Password</Text>
              <View style={styles.row}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                  placeholderTextColor={colors.mutedForeground}
                />
                <Button disabled={loading} onPress={handleResetPassword}>
                  <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                    {loading ? 'Please wait...' : 'Reset password'}
                  </Text>
                </Button>
              </View>
            </View>
          </View>

          {/* TEAM SETTINGS */}
          {role === 'leader' && teams.length > 0 && (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              <View style={[styles.section, { borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Choose Team to Manage
                </Text>
                {teams.map((team) => {
                  const isSelected = team.teamId === selectedTeamId;
                  return (
                    <Pressable
                      key={team.teamId}
                      onPress={() => setSelectedTeamId(team.teamId)}
                      className={`my-1 w-full rounded p-2 ${isSelected ? 'bg-blue-500' : 'bg-gray-200'}`}>
                      <Text className={`text-sm ${isSelected ? 'text-white' : 'text-black'}`}>
                        Team {team.teamId}: {team.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {role === 'leader' && (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
              <View style={[styles.section, { borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Team Clock-in Settings
                </Text>
                <Text style={[styles.label, { marginTop: 8 }]}>Clock-in Time</Text>
                {/* TIME PICKERS */}
                <Button style={{ marginTop: 16 }} onPress={() => setPickClockInTime(true)}>
                  <Text style={[styles.label, { color: colors.background }]}>Clock-in Time</Text>
                </Button>
                {pickClockInTime && (
                  <DateTimePicker
                    mode="time"
                    value={clockInTime}
                    onChange={(e, t) => {
                      if (t) setClockInTime(t);
                      setPickClockInTime(false);
                    }}
                  />
                )}
                <Button style={{ marginTop: 16 }} onPress={() => setPickClockOutTime(true)}>
                  <Text style={[styles.label, { color: colors.background }]}>Clock-out Time</Text>
                </Button>
                {pickClockOutTime && (
                  <DateTimePicker
                    mode="time"
                    value={clockOutTime}
                    onChange={(e, t) => {
                      if (t) setClockOutTime(t);
                      setPickClockOutTime(false);
                    }}
                  />
                )}

                {/* <DateTimePicker
                  mode="time"
                  value={clockInTime}
                  onChange={(e, t) => t && setClockInTime(t)}
                />
                <Text style={[styles.label, { marginTop: 16 }]}>Clock-out Time</Text>
                <DateTimePicker
                  mode="time"
                  value={clockOutTime}
                  onChange={(e, t) => t && setClockOutTime(t)}
                /> */}

                {/* MAP */}
                <View style={{ height: 220, marginVertical: 12 }}>
                  <MapView
                    style={{ flex: 1, borderRadius: 12 }}
                    region={{
                      latitude: Number(teamData?.locationLatitude) || 22.3027,
                      longitude: Number(teamData?.locationLongitude) || 114.1772,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}>
                    {teamData?.locationLatitude && (
                      <Marker
                        coordinate={{
                          latitude: Number(teamData.locationLatitude),
                          longitude: Number(teamData.locationLongitude),
                        }}
                        title="Office Location"
                      />
                    )}
                  </MapView>
                </View>
                <Button onPress={setCurrentLocationAsOffice}>
                  <Text style={[styles.label, { color: colors.background }]}>
                    Use current location as office
                  </Text>
                </Button>
                <Button className="mt-4" onPress={saveTeamSettings}>
                  <Text style={[styles.label, { color: colors.background }]}>Save Settings</Text>
                </Button>
                <View style={[styles.section, { borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Sign out</Text>
                    <Button variant="outline" disabled={signOutLoading} onPress={handleSignOut}>
                      <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                        {signOutLoading ? 'Please wait...' : 'Sign Out'}
                      </Text>
                    </Button>
                  </View>
                  {signOutMessage ? (
                    <Text style={[styles.helpText, { color: colors.mutedForeground }]}>
                      {signOutMessage}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 20,
    minHeight: 56,
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: { fontSize: 15 },
  helpText: { fontSize: 13 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
});
