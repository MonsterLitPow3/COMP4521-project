// app/components/FooterBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';

// Icons
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'; // clock-in-out
import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // dashboard and settings
import Feather from '@expo/vector-icons/Feather'; // user
// import MaterialIcons from '@expo/vector-icons/MaterialIcons'; // settings

export type TabKey = 'clock' | 'dashboard' | 'user' | 'settings';

type FooterBarProps = {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
};

const TABS: TabKey[] = ['clock', 'dashboard', 'user', 'settings'];

export default function FooterBar({ activeTab, onTabPress }: FooterBarProps) {
  const anim = useRef(new Animated.Value(0)).current;

  const activeIndex = TABS.indexOf(activeTab);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: activeIndex,
      duration: 220,
      easing: Easing.out(Easing.circle),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, anim]);

  // 4 slots across the width – adjust 99 to tune spacing for your layout
  const translateX = anim.interpolate({
    inputRange: [0, TABS.length - 1],
    outputRange: [1, (TABS.length - 1) * 98.5],
  });

  return (
    <View style={styles.container}>
      {/* Sliding white pill */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.activeBackground,
          {
            transform: [{ translateX }],
          },
        ]}
      />

      {TABS.map((key) => {
        const isActive = key === activeTab;
        const color = isActive ? '#000' : '#fff';

        let iconElement: React.ReactNode = null;

        if (key === 'clock') {
          // clock-in-out
          iconElement = <MaterialIcons name="route" size={24} color={color} />;
        } else if (key === 'dashboard') {
          // dashboard
          iconElement = <MaterialIcons name="add-task" size={24} color={color} />;
        } else if (key === 'user') {
          // user account
          iconElement = <Feather name="user" size={24} color={color} />;
        } else if (key === 'settings') {
          // settings
          iconElement = <Feather name="settings" size={24} color={color} />;
        }

        return (
          <TouchableOpacity
            key={key}
            style={styles.tabButton}
            activeOpacity={0.8}
            onPress={() => onTabPress(key)}>
            {iconElement}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: '#292D32',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  activeBackground: {
    position: 'absolute',
    bottom: 8,
    left: 13,
    top: 15,
    right: 13,
    width: 60,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginLeft: 14, // centers pill under first tab; tune with translateX spacing
  },
  tabButton: {
    top: 5,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
