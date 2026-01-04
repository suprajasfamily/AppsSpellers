import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import {
  usePreferences,
  KeyboardLayout,
  SizeOption,
  KeySpacing,
  BUTTON_COLORS,
} from "@/contexts/PreferencesContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface VoicePreset {
  id: string;
  label: string;
  description: string;
  pitch: number;
  rate: number;
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: "us-male-1", label: "American Man 1", description: "Deep voice", pitch: 0.85, rate: 0.9 },
  { id: "us-male-2", label: "American Man 2", description: "Standard voice", pitch: 0.95, rate: 0.95 },
  { id: "us-female-1", label: "American Woman 1", description: "Warm voice", pitch: 1.15, rate: 0.9 },
  { id: "us-female-2", label: "American Woman 2", description: "Bright voice", pitch: 1.25, rate: 0.95 },
  { id: "es-male", label: "Spanish Man", description: "Spanish accent", pitch: 0.9, rate: 0.85 },
  { id: "es-female", label: "Spanish Woman", description: "Spanish accent", pitch: 1.2, rate: 0.85 },
  { id: "uk-male", label: "British Man", description: "British accent", pitch: 0.88, rate: 0.88 },
  { id: "uk-female", label: "British Woman", description: "British accent", pitch: 1.18, rate: 0.88 },
  { id: "in-male", label: "Indian Man", description: "Indian accent", pitch: 0.92, rate: 0.82 },
  { id: "in-female", label: "Indian Woman", description: "Indian accent", pitch: 1.22, rate: 0.82 },
];

const avatars = [
  { id: "robot", source: require("../../assets/images/avatars/robot.png"), label: "Robot" },
  { id: "sun", source: require("../../assets/images/avatars/sun.png"), label: "Sun" },
  { id: "cat", source: require("../../assets/images/avatars/cat.png"), label: "Cat" },
];

const sizeOptions: SizeOption[] = ["small", "medium", "large"];
const spacingOptions: KeySpacing[] = ["tight", "normal", "wide"];

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
    keySpacing,
    displayName,
    avatarId,
    buttonColorId,
    voiceSettings,
    metronomeVolume,
    metronomeBpm,
    setKeyboardLayout,
    setKeyboardSize,
    setTypingAreaSize,
    setKeySpacing,
    setDisplayName,
    setAvatarId,
    setButtonColorId,
    setVoiceSettings,
    setMetronomeVolume,
    setMetronomeBpm,
    resetCustomLayout,
  } = usePreferences();

  const [isTesting, setIsTesting] = useState(false);

  const testVoice = () => {
    if (isTesting) {
      Speech.stop();
      setIsTesting(false);
      return;
    }
    setIsTesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Speech.speak("Hello! This is how I will read your text.", {
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      voice: voiceSettings.voiceId || undefined,
      onDone: () => setIsTesting(false),
      onStopped: () => setIsTesting(false),
      onError: () => setIsTesting(false),
    });
  };

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
              Key Spacing
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.sm }]}>
              More space between keys makes them easier to find and tap
            </Text>
            <SegmentedControl
              options={spacingOptions}
              selectedValue={keySpacing}
              onValueChange={(value: KeySpacing) => setKeySpacing(value)}
              labels={["Tight", "Normal", "Wide"]}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Button Color
            </Text>
            <ColorPicker
              selectedColorId={buttonColorId}
              onColorChange={setButtonColorId}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Custom Key Arrangement
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
              Tap the Edit button on the keyboard to rearrange keys
            </Text>
            <View style={styles.resetButtonsRow}>
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  resetCustomLayout("abc");
                }}
                style={[styles.resetButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.keyBorder }]}
                accessibilityLabel="Reset ABC layout"
              >
                <Feather name="rotate-ccw" size={16} color={theme.text} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset ABC</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  resetCustomLayout("qwerty");
                }}
                style={[styles.resetButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.keyBorder }]}
                accessibilityLabel="Reset QWERTY layout"
              >
                <Feather name="rotate-ccw" size={16} color={theme.text} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset QWERTY</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Voice Settings</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.label, { color: theme.text }]}>Choose a Voice</Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.md }]}>
              Select how the app reads text aloud
            </Text>
            
            <View style={styles.voicePresetGrid}>
              {VOICE_PRESETS.map((preset) => {
                const isSelected = voiceSettings.pitch === preset.pitch && voiceSettings.rate === preset.rate;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVoiceSettings({ pitch: preset.pitch, rate: preset.rate });
                    }}
                    style={[
                      styles.voicePresetButton,
                      { 
                        backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.keyBorder,
                      },
                    ]}
                  >
                    <Feather 
                      name={preset.id.includes("girl") ? "heart" : preset.id.includes("boy") ? "star" : "user"} 
                      size={20} 
                      color={isSelected ? "#FFFFFF" : theme.text} 
                    />
                    <Text style={[styles.voicePresetLabel, { color: isSelected ? "#FFFFFF" : theme.text }]}>
                      {preset.label}
                    </Text>
                    <Text style={[styles.voicePresetDesc, { color: isSelected ? "#FFFFFF" : theme.tabIconDefault }]}>
                      {preset.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Reading Speed
            </Text>
            <View style={styles.sliderRow}>
              <Feather name="rewind" size={16} color={theme.tabIconDefault} />
              <View style={styles.sliderContainer}>
                <View 
                  style={[
                    styles.sliderTrack, 
                    { backgroundColor: theme.backgroundSecondary }
                  ]}
                >
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        backgroundColor: theme.primary,
                        width: `${((voiceSettings.rate - 0.5) / 1.5) * 100}%`,
                      }
                    ]}
                  />
                </View>
                <View style={styles.sliderButtons}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVoiceSettings({ rate: Math.max(0.5, voiceSettings.rate - 0.1) });
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.sliderValue, { color: theme.text }]}>
                    {voiceSettings.rate.toFixed(1)}x
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVoiceSettings({ rate: Math.min(2.0, voiceSettings.rate + 0.1) });
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>
              </View>
              <Feather name="fast-forward" size={16} color={theme.tabIconDefault} />
            </View>

            <Pressable
              onPress={testVoice}
              style={[
                styles.testButton, 
                { 
                  backgroundColor: isTesting ? theme.primary : theme.backgroundSecondary, 
                  borderColor: theme.keyBorder 
                }
              ]}
              accessibilityLabel={isTesting ? "Stop test" : "Test voice settings"}
            >
              <Feather name={isTesting ? "stop-circle" : "play"} size={18} color={isTesting ? "#FFFFFF" : theme.text} />
              <Text style={[styles.testButtonText, { color: isTesting ? "#FFFFFF" : theme.text }]}>
                {isTesting ? "Stop" : "Test Voice"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Metronome</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.label, { color: theme.text }]}>Volume</Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.md }]}>
              Adjust the metronome beat volume
            </Text>
            <View style={styles.sliderRow}>
              <Feather name="volume" size={16} color={theme.tabIconDefault} />
              <View style={styles.sliderContainer}>
                <View 
                  style={[
                    styles.sliderTrack, 
                    { backgroundColor: theme.backgroundSecondary }
                  ]}
                >
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        backgroundColor: theme.primary,
                        width: `${metronomeVolume * 100}%`,
                      }
                    ]}
                  />
                </View>
                <View style={styles.sliderButtons}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMetronomeVolume(Math.max(0, metronomeVolume - 0.1));
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.sliderValue, { color: theme.text }]}>
                    {Math.round(metronomeVolume * 100)}%
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMetronomeVolume(Math.min(1, metronomeVolume + 0.1));
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>
              </View>
              <Feather name="volume-2" size={16} color={theme.tabIconDefault} />
            </View>

            <View style={styles.divider} />

            <Text style={[styles.label, { color: theme.text }]}>Speed (BPM)</Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.md }]}>
              Beats per minute - how fast the tick-tok rhythm plays
            </Text>
            <View style={styles.sliderRow}>
              <Feather name="clock" size={16} color={theme.tabIconDefault} />
              <View style={styles.sliderContainer}>
                <View 
                  style={[
                    styles.sliderTrack, 
                    { backgroundColor: theme.backgroundSecondary }
                  ]}
                >
                  <View 
                    style={[
                      styles.sliderFill, 
                      { 
                        backgroundColor: theme.primary,
                        width: `${((metronomeBpm - 10) / 110) * 100}%`,
                      }
                    ]}
                  />
                </View>
                <View style={styles.sliderButtons}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMetronomeBpm(Math.max(10, metronomeBpm - 5));
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="minus" size={16} color={theme.text} />
                  </Pressable>
                  <Text style={[styles.sliderValue, { color: theme.text }]}>
                    {metronomeBpm} BPM
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMetronomeBpm(Math.min(120, metronomeBpm + 5));
                    }}
                    style={[styles.sliderButton, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Feather name="plus" size={16} color={theme.text} />
                  </Pressable>
                </View>
              </View>
              <Feather name="fast-forward" size={16} color={theme.tabIconDefault} />
            </View>

            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginTop: Spacing.sm }]}>
              Lower BPM = slower ticks. 10 BPM = 1 tick every 6 seconds
            </Text>
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
  divider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.lg,
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
  helpText: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.md,
  },
  resetButtonsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  resetButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sliderLabel: {
    fontSize: Typography.small.fontSize,
    minWidth: 32,
  },
  sliderButtons: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.xs,
  },
  sliderButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  sliderButtonText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "500",
  },
  sliderContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  sliderFill: {
    height: "100%",
    borderRadius: 4,
  },
  sliderValue: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
    minWidth: 50,
  },
  voiceScrollView: {
    marginBottom: Spacing.md,
  },
  voiceRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  voiceButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 70,
    alignItems: "center",
  },
  voiceButtonText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "500",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  testButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  voicePresetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  voicePresetButton: {
    width: "48%",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.xs,
  },
  voicePresetLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  voicePresetDesc: {
    fontSize: Typography.small.fontSize,
    textAlign: "center",
  },
});
