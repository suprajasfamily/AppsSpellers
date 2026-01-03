import React from "react";
import { View, StyleSheet, useWindowDimensions, Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { KeyButton } from "./KeyButton";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, KeyboardLayout } from "@/contexts/PreferencesContext";
import { Spacing, KeyboardSizes, BorderRadius, Typography } from "@/constants/theme";

const ABC_LAYOUT = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
  ["K", "L", "M", "N", "O", "P", "Q", "R", "S"],
  ["T", "U", "V", "W", "X", "Y", "Z"],
];

const QWERTY_LAYOUT = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
}

export function CustomKeyboard({ onKeyPress, onBackspace, onSpace }: CustomKeyboardProps) {
  const { theme } = useTheme();
  const { keyboardLayout, keyboardSize, setKeyboardLayout } = usePreferences();
  const { width, height } = useWindowDimensions();

  const layout = keyboardLayout === "abc" ? ABC_LAYOUT : QWERTY_LAYOUT;
  const keyboardHeight = height * KeyboardSizes[keyboardSize];
  const maxKeysInRow = Math.max(...layout.map(row => row.length));
  const keyWidth = (width - Spacing.lg * 2 - maxKeysInRow * 4) / maxKeysInRow;

  const toggleLayout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setKeyboardLayout(keyboardLayout === "abc" ? "qwerty" : "abc");
  };

  return (
    <View style={[styles.container, { height: keyboardHeight }]}>
      <View style={styles.layoutToggle}>
        <Pressable
          onPress={toggleLayout}
          style={[styles.toggleButton, { backgroundColor: theme.specialKey, borderColor: theme.keyBorder }]}
          accessibilityLabel={`Switch to ${keyboardLayout === "abc" ? "QWERTY" : "ABC"} layout`}
        >
          <Text style={[styles.toggleText, { color: theme.text }]}>
            {keyboardLayout === "abc" ? "ABC" : "QWERTY"}
          </Text>
          <Feather name="refresh-cw" size={14} color={theme.text} style={styles.toggleIcon} />
        </Pressable>
      </View>

      <View style={styles.keysContainer}>
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => (
              <KeyButton
                key={key}
                label={key}
                onPress={() => onKeyPress(key)}
                width={keyWidth}
              />
            ))}
          </View>
        ))}

        <View style={styles.bottomRow}>
          <KeyButton
            label="space"
            onPress={onSpace}
            width={width * 0.5}
            isSpecial
          />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onBackspace();
            }}
            onLongPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onBackspace();
            }}
            style={[
              styles.backspaceKey,
              { backgroundColor: theme.specialKey, borderColor: theme.keyBorder },
            ]}
            accessibilityLabel="Backspace"
          >
            <Feather name="delete" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  layoutToggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  toggleIcon: {
    marginLeft: Spacing.xs,
  },
  keysContainer: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  backspaceKey: {
    minWidth: 60,
    minHeight: 44,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.sm,
  },
});
