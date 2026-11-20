import { useRef } from 'react';
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function useTabTransition() {
  const slideX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevIndexRef = useRef(0);

  const triggerTransition = (nextIndex: number, explicitPrevIndex?: number) => {
    const prevIndex = explicitPrevIndex ?? prevIndexRef.current;
    prevIndexRef.current = nextIndex;
    const direction = nextIndex >= prevIndex ? 1 : -1;

    slideX.set(
      withSequence(
        withTiming(direction * 16, { duration: 0 }),
        withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) }),
      ),
    );
    opacity.set(
      withSequence(
        withTiming(0.4, { duration: 0 }),
        withTiming(1, { duration: 220 }),
      ),
    );
  };

  const transitionStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.get() }],
    opacity: opacity.get(),
  }));

  return { triggerTransition, transitionStyle };
}
