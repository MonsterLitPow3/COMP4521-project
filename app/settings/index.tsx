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
