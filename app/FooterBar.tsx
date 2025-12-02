// app/components/FooterBar.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  LayoutChangeEvent,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';

export type TabKey = 'clock' | 'dashboard' | 'user' | 'settings';

type FooterBarProps = {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
};

const TABS: TabKey[] = ['clock', 'dashboard', 'user', 'settings'];

export default function FooterBar({ activeTab, onTabPress }: FooterBarProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  const activeIndex = TABS.indexOf(activeTab);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: activeIndex,
      duration: 200,
      easing: Easing.out(Easing.circle),
      useNativeDriver: true,
    }).start();
  }, [activeIndex, anim]);

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const handleTabPress = (key: TabKey) => {
    if (key === activeTab) return;
    onTabPress(key);
  };

  const tabWidth = containerWidth / TABS.length || 0;
  const highlightSize = tabWidth * 0.6;

  const baseLeft = tabWidth / 2 - highlightSize / 2;

  const translateX =
    tabWidth === 0
      ? 0
      : anim.interpolate({
          inputRange: [0, TABS.length - 1],
          outputRange: [0, tabWidth * (TABS.length - 1)],
        });

  return (
    <View style={styles.outer}>
      <View style={styles.container} onLayout={handleLayout}>
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.activeBackground,
              {
                width: highlightSize,
                height: highlightSize,
                left: baseLeft,
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {TABS.map((key) => {
          const isActive = key === activeTab;
          const color = isActive ? '#000' : '#fff';

          let iconElement: React.ReactNode = null;

          if (key === 'clock') {
            iconElement = <MaterialIcons className="-ml-4" name="route" size={24} color={color} />;
          } else if (key === 'dashboard') {
            iconElement = (
              <MaterialIcons className="-ml-5" name="add-task" size={24} color={color} />
            );
          } else if (key === 'user') {
            iconElement = <Feather className="-ml-5" name="user" size={24} color={color} />;
          } else if (key === 'settings') {
            iconElement = <Feather className="-ml-5" name="settings" size={24} color={color} />;
          }

          return (
            <TouchableOpacity
              key={key}
              style={[styles.tabButton, { width: tabWidth || undefined }]}
              activeOpacity={0.8}
              onPress={() => handleTabPress(key)}>
              {iconElement}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: '#292D32',
  },
  container: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  activeBackground: {
    position: 'absolute',
    bottom: 10,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  tabButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
