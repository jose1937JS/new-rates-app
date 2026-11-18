import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import PagerView, {
  type PagerViewOnPageScrollEventData,
  type PagerViewOnPageSelectedEvent,
} from 'react-native-pager-view';
import Animated, {
  useEvent,
  useHandler,
  type SharedValue,
} from 'react-native-reanimated';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export interface OnboardingPagerHandle {
  setPage: (pageIndex: number) => void;
}

export interface OnboardingPagerProps {
  pages: ReactNode[];
  scrollOffset: SharedValue<number>;
  onPageChange: (pageIndex: number) => void;
}

function usePagerScrollHandler(
  handlers: {
    onPageScroll: (
      event: PagerViewOnPageScrollEventData,
      context: Record<string, unknown>,
    ) => void;
  },
  dependencies: unknown[] = [],
) {
  const { context, doDependenciesDiffer } = useHandler(handlers, dependencies);

  return useEvent<PagerViewOnPageScrollEventData>(
    (event) => {
      'worklet';
      handlers.onPageScroll(event, context);
    },
    ['onPageScroll'],
    doDependenciesDiffer,
  );
}

export const OnboardingPager = forwardRef<
  OnboardingPagerHandle,
  OnboardingPagerProps
>(function OnboardingPager({ pages, scrollOffset, onPageChange }, ref) {
  const pagerRef = useRef<PagerView>(null);

  useImperativeHandle(ref, () => ({
    setPage: (pageIndex: number) => {
      pagerRef.current?.setPage(pageIndex);
    },
  }));

  const handlePageScroll = usePagerScrollHandler(
    {
      onPageScroll: (event) => {
        'worklet';
        scrollOffset.set(event.position + event.offset);
      },
    },
    [scrollOffset],
  );

  const handlePageSelected = (event: PagerViewOnPageSelectedEvent) => {
    onPageChange(event.nativeEvent.position);
  };

  return (
    <AnimatedPagerView
      ref={pagerRef}
      style={{ flex: 1 }}
      initialPage={0}
      overdrag
      onPageScroll={handlePageScroll as never}
      onPageSelected={handlePageSelected}
    >
      {pages.map((page, index) => (
        <View key={String(index)} style={{ flex: 1 }}>
          {page}
        </View>
      ))}
    </AnimatedPagerView>
  );
});
