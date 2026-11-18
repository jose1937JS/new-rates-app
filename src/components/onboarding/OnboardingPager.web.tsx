import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import type {
  OnboardingPagerHandle,
  OnboardingPagerProps,
} from './OnboardingPager';

export type { OnboardingPagerHandle, OnboardingPagerProps };

export const OnboardingPager = forwardRef<
  OnboardingPagerHandle,
  OnboardingPagerProps
>(function OnboardingPagerWeb({ pages, scrollOffset, onPageChange }, ref) {
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  useImperativeHandle(ref, () => ({
    setPage: (pageIndex: number) => {
      scrollRef.current?.scrollTo({ x: pageIndex * width, animated: true });
      onPageChange(pageIndex);
    },
  }));

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const progress = event.nativeEvent.contentOffset.x / width;
    scrollOffset.set(progress);
  };

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (width <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    onPageChange(Math.max(0, Math.min(pages.length - 1, nextIndex)));
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onMomentumScrollEnd={handleMomentumEnd}
      style={{ flex: 1 }}
    >
      {pages.map((page: ReactNode, index: number) => (
        <View key={String(index)} style={{ width, flex: 1 }}>
          {page}
        </View>
      ))}
    </ScrollView>
  );
});
