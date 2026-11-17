import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';

interface CardProps {
  title?: string;
  icon?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  title,
  icon,
  headerRight,
  children,
  className,
  contentClassName,
  noPadding = false,
  style,
}: CardProps) {
  const hasHeader = Boolean(title || icon || headerRight);

  return (
    <View
      className={`rounded-2xl bg-surface-card ${noPadding ? '' : 'p-4'} ${className ?? ''}`}
      style={[{ borderCurve: 'continuous' }, style]}
    >
      {hasHeader && (
        <View className="flex-row items-center justify-between border-b border-border pb-3">
          <View className="flex-row items-center gap-2">
            {icon}
            {title ? (
              <Text className="text-sm font-medium text-text-primary">
                {title}
              </Text>
            ) : null}
          </View>
          {headerRight}
        </View>
      )}
      {contentClassName ? (
        <View className={contentClassName}>{children}</View>
      ) : (
        children
      )}
    </View>
  );
}
