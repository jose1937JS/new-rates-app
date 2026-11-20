import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShareRatesStudio } from '@/components/share/ShareRatesSheet';
import { ScreenHero } from '@/components/ui/ScreenHero';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function ShareRatesScreen() {
  const router = useRouter();
  const COLORS = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-surface"
      style={{ backgroundColor: COLORS.surface }}
    >
      <ScreenHero
        title="Compartir tasas"
        subtitle="Imagen y texto con monto opcional"
        leftAction={
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderCurve: 'continuous',
            }}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        }}
      >
        <ShareRatesStudio />
      </ScrollView>
    </View>
  );
}
