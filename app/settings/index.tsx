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
// import * as React from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SettingsScreen() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? THEME.dark : THEME.light;

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top - 6, 0) : insets.top;

  // ----- Manager state -----
  const [role, setRole] = React.useState<string | null>(null);
  const [teamId, setTeamId] = React.useState<number | null>(null);
  const [teamData, setTeamData] = React.useState<any>(null);

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

      // Look up role in TeamMembers
      const { data: member } = await supabase
        .from('TeamMembers')
        .select('role, teamId')
        .eq('uId', user.id)
        .single();

      if (!member) return;

      setRole(member.role);
      setTeamId(member.teamId);

      // If leader → load team settings
      if (member.role === 'leader') {
        const { data: t } = await supabase
          .from('Teams')
          .select('*')
          .eq('teamId', member.teamId)
          .single();

        if (t) {
          setTeamData(t);

          // Convert DB time strings → JS Date objects??
          if (t.checkInTime) setClockInTime(new Date(`1970-01-01T${t.checkInTime}`));
          if (t.checkOutTime) setClockOutTime(new Date(`1970-01-01T${t.checkOutTime}`));

          if (t.locationLatitude) setLat(String(t.locationLatitude));
          if (t.locationLongitude) setLng(String(t.locationLongitude));
        }
      }
    }

    load();
  }, []);

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

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}>
      <View style={styles.screen}>
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

        {/* Leader Settings */}
        {role === 'leader' && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Team Clock-in Settings
            </Text>

            {/* Clock-in time */}
            <Text style={[styles.label, { marginTop: 8, color: colors.foreground }]}>
              Clock-in Time
            </Text>
            <DateTimePicker
              mode="time"
              value={clockInTime}
              onChange={(e, t) => t && setClockInTime(t)}
            />

            {/* Clock-out time */}
            <Text style={[styles.label, { marginTop: 16, color: colors.foreground }]}>
              Clock-out Time
            </Text>
            <DateTimePicker
              mode="time"
              value={clockOutTime}
              onChange={(e, t) => t && setClockOutTime(t)}
            />

            {/* Location */}
            <Text style={[styles.label, { marginTop: 16, color: colors.foreground }]}>
              Allowed Clock-in Location
            </Text>

            <TextInput
              placeholder="Latitude"
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
              style={styles.input}
            />
            <TextInput
              placeholder="Longitude"
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
              style={styles.input}
            />

            <Button className="mt-4" onPress={saveTeamSettings}>
              <Text>Save Settings</Text>
            </Button>
          </View>
        )}
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
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
});
