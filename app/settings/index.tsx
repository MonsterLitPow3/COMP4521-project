// app/settings/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
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

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 6, 0) : insets.top;

  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Load user role + team settings
  React.useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: member } = await supabase
        .from('TeamMembers')
        .select('role, teamId')
        .eq('uId', user.id)
        .single();

      if (!member) return;

      setRole(member.role);
      setTeamId(member.teamId);

      if (member.role === 'leader') {
        const { data: t } = await supabase
          .from('Teams')
          .select('*')
          .eq('teamId', member.teamId)
          .single();

        if (t) {
          setTeamData(t);

          if (t.checkInTime) setClockInTime(new Date(`1970-01-01T${t.checkInTime}`));
          if (t.checkOutTime) setClockOutTime(new Date(`1970-01-01T${t.checkOutTime}`));

          if (t.locationLatitude) setLat(String(t.locationLatitude));
          if (t.locationLongitude) setLng(String(t.locationLongitude));
        }
      }
    }

    load();
  }, []);

  const setCurrentLocationAsOffice = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const latitude = loc.coords.latitude;
      const longitude = loc.coords.longitude;

      const { error } = await supabase
        .from('Teams')
        .update({
          locationLatitude: latitude,
          locationLongitude: longitude,
        })
        .eq('teamId', teamId);

      if (error) {
        console.log('Supabase update error:', error);
        alert('Failed to update office location: ' + error.message);
      } else {
        alert('Office location updated!');
        setTeamData((prev: any) => ({
          ...prev,
          locationLatitude: latitude,
          locationLongitude: longitude,
        }));
        setLat(String(latitude));
        setLng(String(longitude));
      }
    } catch (err) {
      console.log(err);
      alert('Error getting location');
    }
  };

  // Save updated team settings
  const saveTeamSettings = async () => {
    if (!teamId) return;

    const { error } = await supabase
      .from('Teams')
      .update({
        checkInTime: clockInTime.toTimeString().slice(0, 5),
        checkOutTime: clockOutTime.toTimeString().slice(0, 5),
        locationLatitude: parseFloat(lat),
        locationLongitude: parseFloat(lng),
      })
      .eq('teamId', teamId);

    if (error) alert('Error saving: ' + error.message);
    else alert('Team settings updated!');
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('No user logged in');

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      alert('Password updated successfully');
    } catch (err: any) {
      alert('Error updating password: ' + err.message);
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

        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Appearance + team settings */}
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

            <Text style={[styles.label, { marginTop: 8, color: colors.foreground }]}>
              Clock-in Time
            </Text>
            <DateTimePicker
              mode="time"
              value={clockInTime}
              onChange={(e, t) => t && setClockInTime(t)}
            />

            <Text style={[styles.label, { marginTop: 16, color: colors.foreground }]}>
              Clock-out Time
            </Text>
            <DateTimePicker
              mode="time"
              value={clockOutTime}
              onChange={(e, t) => t && setClockOutTime(t)}
            />

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
                {teamData?.locationLatitude && teamData?.locationLongitude && (
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
          </View>

          {/* Password reset */}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

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
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
});
