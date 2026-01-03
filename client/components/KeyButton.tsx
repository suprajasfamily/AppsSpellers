import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography, Fonts } from "@/constants/theme";

interface KeyButtonProps {
  label: string;
  onPress: () => void;
  width?: number | string;
  isSpecial?: boolean;
  fontSize?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function KeyButton({
  label,
  onPress,
  width,
  isSpecial = false,
  fontSize,
}: KeyButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.key,
        animatedStyle,
        {
          backgroundColor: isSpecial ? theme.specialKey : theme.keyBackground,
          borderColor: theme.keyBorder,
          width: width || "auto",
        },
      ]}
      accessibilityLabel={`${label} button`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.keyText,
          {
            color: theme.text,
            fontSize: fontSize || Typography.keyboard.fontSize,
            fontFamily: Fonts?.rounded || "System",
          },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  key: {
    minWidth: 32,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    marginVertical: 3,
  },
  keyText: {
    fontWeight: Typography.keyboard.fontWeight,
    textAlign: "center",
  },
});
