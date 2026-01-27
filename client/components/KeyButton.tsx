import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, KEY_TEXT_SIZE_VALUES } from "@/contexts/PreferencesContext";
import { BorderRadius, Spacing, Typography, Fonts } from "@/constants/theme";

export interface KeyButtonProps {
  label: string;
  onPress: () => void;
  width?: number | string;
  height?: number;
  isSpecial?: boolean;
  fontSize?: number;
  useCustomColor?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function KeyButton({
  label,
  onPress,
  width,
  height,
  isSpecial = false,
  fontSize,
  useCustomColor = true,
}: KeyButtonProps) {
  const { theme } = useTheme();
  const { getButtonColor, keyTextSize, getKeyTextColor } = usePreferences();
  const scale = useSharedValue(1);

  const buttonColor = useCustomColor ? getButtonColor() : theme.specialKey;
  const defaultFontSize = KEY_TEXT_SIZE_VALUES[keyTextSize];
  const keyTextColor = getKeyTextColor();

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const backgroundColor = isSpecial ? theme.specialKey : buttonColor;
  const textColor = keyTextColor;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.key,
        animatedStyle,
        {
          backgroundColor,
          borderColor: theme.keyBorder,
          width: width || "auto",
          height: height,
        },
      ]}
      accessibilityLabel={`${label} button`}
      accessibilityRole="button"
    >
      <Text
        style={[
          styles.keyText,
          {
            color: textColor,
            fontSize: fontSize || defaultFontSize,
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
    marginHorizontal: 3,
    marginVertical: 4,
  },
  keyText: {
    fontWeight: Typography.keyboard.fontWeight,
    textAlign: "center",
  },
});
