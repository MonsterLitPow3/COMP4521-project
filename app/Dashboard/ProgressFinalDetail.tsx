import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Input } from '@/components/ui/input';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import * as React from 'react';
import { useRouter } from 'expo-router';
import data from 'data.json';
import { Maximize } from 'lucide-react-native';

export default function DashBoard() {
  const [progress, setProgress] = React.useState(13);
  const router = useRouter();

  React.useEffect(() => {
    const timer = setTimeout(() => setProgress(99), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView>
      <View style={{ marginBottom: 40 }}>
        <View
          style={{
            marginTop: 20,
            marginBottom: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text style={{ fontSize: 28 }}>Sub-Task Detail Page</Text>
        </View>

        {/* {data.map((d, i) => ( */}
        <View
          // key={i}
          style={{
            marginTop: 20,
            marginBottom: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ width: '100%', flexDirection: 'column' }}>
            <CardHeader className="flex items-center justify-center">
              <View>
                <CardTitle>Sub-Task 1</CardTitle>
                <CardDescription>Details:</CardDescription>
                {/* {Object.values(d)
                    .filter((value) => value)
                    .map((value, idx, arr) => (
                      <CardDescription key={idx}>
                        {typeof value === 'object'
                          ? JSON.stringify(value) // keep for debug, or format if needed
                          : value}
                        {idx < arr.length - 1 ? ', ' : ''}
                      </CardDescription>
                    ))} */}
                <CardDescription>Descriptions:</CardDescription>
                {/* keep the following 5 lines for display */}
                {Array.from({ length: 5 }).map((_, index) => (
                  <CardDescription key={index}>
                    ____________________________________
                  </CardDescription>
                ))}
                <Input
                  className="itemms-center flex w-max justify-center"
                  multiline={true}
                  numberOfLines={10}
                  style={styles.input}
                  placeholder="Comments"
                />
              </View>
            </CardHeader>
          </View>
        </View>
        {/* ))} */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    marginLeft: -1,
    flex: 1,
    height: 200,
    marginTop: 30,
    // width: 250,
    borderColor: '#d7d4d4ff',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#ffffffff',
    color: 'black',
    paddingLeft: 10,
    paddingVertical: 0,
    lineHeight: 17,
  },
});
