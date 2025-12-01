import { View, Text, TextInput, ImageStyle } from 'react-native';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabase';
import * as React from 'react';

export default function Settings() {
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleResetPassword = async () => {
    try {
      setLoading(true);
      const user = supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      alert('Password updated successfully');
    } catch (error) {
      alert('Error updating password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-sm text-muted-foreground">New Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          className="border rounded px-3 py-2 bg-transparent ios:text-foreground"
        />
        <View className="flex-row gap-2">
          <Button
            disabled={loading}
            onPress={handleResetPassword}
            className="flex-1"
          >
            <Text>{loading ? 'Please wait...' : 'Reset password'}</Text>
          </Button>
        </View>
      </View>
    </>
  );
}