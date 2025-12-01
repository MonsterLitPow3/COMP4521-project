// app/components/RefreshableScroll.tsx
import React from 'react';
import { ScrollView, RefreshControl, ScrollViewProps } from 'react-native';

type Props = ScrollViewProps & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export function RefreshableScroll({ refreshing, onRefresh, children, ...rest }: Props) {
  return (
    <ScrollView
      {...rest}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {children}
    </ScrollView>
  );
}
