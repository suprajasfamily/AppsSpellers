import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  usePreferences,
  KeyboardLayout,
  SizeOption,
  BUTTON_COLORS,
} from "@/contexts/PreferencesContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const avatars = [
  { id: "robot", source: require("../../assets/images/avatars/robot.png"), label: "Robot" },
  { id: "sun", source: require("../../assets/images/avatars/sun.png"), label: "Sun" },
  { id: "cat", source: require("../../assets/images/avatars/cat.png"), label: "Cat" },
];

const sizeOptions: SizeOption[] = ["small", "medium", "large"];

function SegmentedControl({
  options,
  selectedValue,
  onValueChange,
  labels,
}: {
  options: string[];
  selectedValue: string;
  onValueChange: (value: any) => void;
  labels?: string[];
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.segmentedControl, { backgroundColor: theme.backgroundSecondary }]}>
      {options.map((option, index) => (
        <Pressable
          key={option}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onValueChange(option);
          }}
          style={[
            styles.segment,
            selectedValue === option && { backgroundColor: theme.primary },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              { color: selectedValue === option ? "#FFFFFF" : theme.text },
            ]}
          >
            {labels ? labels[index] : option.charAt(0).toUpperCase() + option.slice(1)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ColorPicker({
  selectedColorId,
  onColorChange,
}: {
  selectedColorId: string;
  onColorChange: (id: string) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.colorGrid}>
      {BUTTON_COLORS.map((color) => (
        <Pressable
          key={color.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onColorChange(color.id);
          }}
          style={[
            styles.colorButton,
            { backgroundColor: color.value },
            selectedColorId === color.id && {
              borderColor: theme.text,
              borderWidth: 3,
            },
          ]}
          accessibilityLabel={`Select ${color.label} color`}
        >
          {selectedColorId === color.id ? (
            <Feather name="check" size={20} color="#FFFFFF" />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const {
    keyboardLayout,
    keyboardSize,
    typingAreaSize,
    displayName,
    avatarId,
    buttonColorId,
    setKeyboardLayout,
    setKeyboardSize,
    setTypingAreaSize,
    setDisplayName,
    setAvatarId,
    setButtonColorId,
  } = usePreferences();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Profile</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.label, { color: theme.text }]}>Avatar</Text>
            <View style={styles.avatarRow}>
              {avatars.map((avatar) => (
                <Pressable
                  key={avatar.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAvatarId(avatar.id);
                  }}
                  style={[
                    styles.avatarButton,
                    avatarId === avatar.id && {
                      borderColor: theme.primary,
                      borderWidth: 3,
                    },
                  ]}
                  accessibilityLabel={`Select ${avatar.label} avatar`}
                >
                  <Image source={avatar.source} style={styles.avatarImage} />
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Display Name
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.keyBorder,
                },
              ]}
              placeholder="Enter your name"
              placeholderTextColor={theme.tabIconDefault}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Keyboard Settings</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.label, { color: theme.text }]}>Default Layout</Text>
            <SegmentedControl
              options={["abc", "qwerty"]}
              selectedValue={keyboardLayout}
              onValueChange={(value: KeyboardLayout) => setKeyboardLayout(value)}
              labels={["ABC", "QWERTY"]}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Keyboard Size
            </Text>
            <SegmentedControl
              options={sizeOptions}
              selectedValue={keyboardSize}
              onValueChange={(value: SizeOption) => setKeyboardSize(value)}
              labels={["Small", "Medium", "Large"]}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Typing Area Size
            </Text>
            <SegmentedControl
              options={sizeOptions}
              selectedValue={typingAreaSize}
              onValueChange={(value: SizeOption) => setTypingAreaSize(value)}
              labels={["Small", "Medium", "Large"]}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Button Color
            </Text>
            <ColorPicker
              selectedColorId={buttonColorId}
              onColorChange={setButtonColorId}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: theme.text }]}>App Name</Text>
              <Text style={[styles.aboutValue, { color: theme.tabIconDefault }]}>TypeBuddy</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={[styles.aboutLabel, { color: theme.text }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: theme.tabIconDefault }]}>1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
    marginBottom: Spacing.sm,
  },
  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  avatarButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  aboutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  aboutLabel: {
    fontSize: Typography.body.fontSize,
  },
  aboutValue: {
    fontSize: Typography.body.fontSize,
  },
});
