import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Typography } from "@/constants/theme";

interface SuggestionPillProps {
  word: string;
  onPress: (word: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SuggestionPill({ word, onPress }: SuggestionPillProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const isPressed = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    isPressed.value = 1;
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    isPressed.value = 0;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(word);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: isPressed.value ? theme.primary : theme.suggestionBg,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: isPressed.value ? "#FFFFFF" : theme.text,
  }));

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pill,
        animatedStyle,
        { borderColor: theme.suggestionBorder },
      ]}
      accessibilityLabel={`Suggestion: ${word}`}
      accessibilityRole="button"
    >
      <Animated.Text style={[styles.text, textStyle]}>{word}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xs,
  },
  text: {
    fontSize: Typography.suggestion.fontSize,
    fontWeight: Typography.suggestion.fontWeight,
  },
});
