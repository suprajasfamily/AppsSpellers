import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
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
  LETTERBOARD_COLORS,
  LETTERBOARD_TEXT_COLORS,
} from "@/contexts/PreferencesContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface SystemVoice {
  identifier: string;
  name: string;
  language: string;
  quality: string;
}

const SPEED_PRESETS = [
  { id: "very-slow", label: "Very Slow", rate: 0.5 },
  { id: "slow", label: "Slow", rate: 0.75 },
  { id: "normal", label: "Normal", rate: 1.0 },
  { id: "fast", label: "Fast", rate: 1.25 },
  { id: "very-fast", label: "Very Fast", rate: 1.5 },
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
    letterboardBgColorId,
    letterboardTextColorId,
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
    setLetterboardBgColorId,
    setLetterboardTextColorId,
    setVoiceSettings,
    setMetronomeVolume,
    setMetronomeBpm,
    resetCustomLayout,
    qwertyTextColor,
    setQwertyTextColor,
  } = usePreferences();

  const [isTesting, setIsTesting] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SystemVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        const englishVoices = voices
          .filter(v => v.language.startsWith("en"))
          .map(v => ({
            identifier: v.identifier,
            name: v.name,
            language: v.language,
            quality: v.quality || "Default",
          }));
        setAvailableVoices(englishVoices);
      } catch {
        setAvailableVoices([]);
      } finally {
        setLoadingVoices(false);
      }
    };
    loadVoices();
  }, []);

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

  const getVoiceDisplayName = (voice: SystemVoice) => {
    const name = voice.name.replace(/com\.apple\.speech\.synthesis\.voice\./i, "")
      .replace(/com\.apple\.voice\.compact\./i, "")
      .replace(/com\.apple\.voice\.premium\./i, "")
      .replace(/com\.apple\.eloquence\./i, "");
    return name.length > 20 ? name.substring(0, 20) + "..." : name;
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
              options={["abc", "qwerty", "grid", "letterboard"]}
              selectedValue={keyboardLayout}
              onValueChange={(value: KeyboardLayout) => setKeyboardLayout(value)}
              labels={["ABC", "QWERTY", "Grid", "Board"]}
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
              Letterboard Background Color
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
              Background color for full-screen Letterboard keyboard
            </Text>
            <View style={styles.colorGrid}>
              {LETTERBOARD_COLORS.map((color) => (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLetterboardBgColorId(color.id);
                  }}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.value },
                    letterboardBgColorId === color.id && {
                      borderColor: theme.text,
                      borderWidth: 3,
                    },
                  ]}
                  accessibilityLabel={`Select ${color.label} letterboard background`}
                >
                  {letterboardBgColorId === color.id ? (
                    <Feather name="check" size={20} color={color.value === "#FFFFFF" || color.value === "#F5F5DC" || color.value === "#FFFACD" ? "#000" : "#FFF"} />
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Letterboard Text Color
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
              Letter color for full-screen Letterboard keyboard
            </Text>
            <View style={styles.colorGrid}>
              {LETTERBOARD_TEXT_COLORS.map((color) => (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLetterboardTextColorId(color.id);
                  }}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.value },
                    letterboardTextColorId === color.id && {
                      borderColor: color.value === "#FFFFFF" ? "#000" : theme.text,
                      borderWidth: 3,
                    },
                  ]}
                  accessibilityLabel={`Select ${color.label} letterboard text color`}
                >
                  {letterboardTextColorId === color.id ? (
                    <Feather name="check" size={20} color={color.value === "#FFFFFF" ? "#000" : "#FFF"} />
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              QWERTY Text Color
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
              Letter color when using the iPad native keyboard
            </Text>
            <View style={styles.colorGrid}>
              {LETTERBOARD_TEXT_COLORS.map((color) => (
                <Pressable
                  key={color.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQwertyTextColor(color.value);
                  }}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.value },
                    qwertyTextColor === color.value && {
                      borderColor: color.value === "#FFFFFF" ? "#000" : theme.text,
                      borderWidth: 3,
                    },
                  ]}
                  accessibilityLabel={`Select ${color.label} QWERTY text color`}
                >
                  {qwertyTextColor === color.value ? (
                    <Feather name="check" size={20} color={color.value === "#FFFFFF" ? "#000" : "#FFF"} />
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
              Custom Key Arrangement
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
              Long-press keys on other keyboards to rearrange
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
              <Pressable
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  resetCustomLayout("grid");
                }}
                style={[styles.resetButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.keyBorder }]}
                accessibilityLabel="Reset Grid layout"
              >
                <Feather name="rotate-ccw" size={16} color={theme.text} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Reset Grid</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Voice Settings</ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.label, { color: theme.text }]}>Choose a Voice</Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.md }]}>
              Select a voice from your device (male and female options available)
            </Text>
            
            {loadingVoices ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.helpText, { color: theme.tabIconDefault, marginLeft: Spacing.sm }]}>
                  Loading voices...
                </Text>
              </View>
            ) : availableVoices.length > 0 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.voiceScrollContainer}
                contentContainerStyle={styles.voiceScrollContent}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVoiceSettings({ voiceId: null });
                  }}
                  style={[
                    styles.voiceChip,
                    { 
                      backgroundColor: !voiceSettings.voiceId ? theme.primary : theme.backgroundSecondary,
                      borderColor: !voiceSettings.voiceId ? theme.primary : theme.keyBorder,
                    },
                  ]}
                >
                  <Text style={[styles.voiceChipText, { color: !voiceSettings.voiceId ? "#FFFFFF" : theme.text }]}>
                    Default
                  </Text>
                </Pressable>
                {availableVoices.map((voice) => {
                  const isSelected = voiceSettings.voiceId === voice.identifier;
                  return (
                    <Pressable
                      key={voice.identifier}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setVoiceSettings({ voiceId: voice.identifier });
                      }}
                      style={[
                        styles.voiceChip,
                        { 
                          backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.keyBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.voiceChipText, { color: isSelected ? "#FFFFFF" : theme.text }]}>
                        {getVoiceDisplayName(voice)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={[styles.helpText, { color: theme.tabIconDefault }]}>
                No voices available. Using default system voice.
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={[styles.label, { color: theme.text }]}>
              Reading Speed
            </Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.sm }]}>
              How fast the voice reads
            </Text>
            <View style={styles.speedPresetRow}>
              {SPEED_PRESETS.map((preset) => {
                const isSelected = Math.abs(voiceSettings.rate - preset.rate) < 0.05;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVoiceSettings({ rate: preset.rate });
                    }}
                    style={[
                      styles.speedChip,
                      { 
                        backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.keyBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.speedChipText, { color: isSelected ? "#FFFFFF" : theme.text }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
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

            <View style={styles.divider} />

            <Text style={[styles.label, { color: theme.text }]}>Typing Feedback</Text>
            <Text style={[styles.helpText, { color: theme.tabIconDefault, marginBottom: Spacing.md }]}>
              Voice feedback while typing helps kids learn letters
            </Text>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVoiceSettings({ speakLettersOnType: !voiceSettings.speakLettersOnType });
              }}
              style={[styles.toggleRow, { backgroundColor: theme.backgroundSecondary }]}
            >
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Speak Letters</Text>
                <Text style={[styles.toggleHelp, { color: theme.tabIconDefault }]}>
                  Read each letter aloud when typed
                </Text>
              </View>
              <View style={[
                styles.toggle, 
                { backgroundColor: voiceSettings.speakLettersOnType ? theme.primary : theme.keyBorder }
              ]}>
                <View style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: voiceSettings.speakLettersOnType ? 20 : 0 }] }
                ]} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVoiceSettings({ sayAndAfterLetters: !voiceSettings.sayAndAfterLetters });
              }}
              style={[styles.toggleRow, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.sm }]}
            >
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Say "And"</Text>
                <Text style={[styles.toggleHelp, { color: theme.tabIconDefault }]}>
                  Say "and" after each letter (A... and... B... and...)
                </Text>
              </View>
              <View style={[
                styles.toggle, 
                { backgroundColor: voiceSettings.sayAndAfterLetters ? theme.primary : theme.keyBorder }
              ]}>
                <View style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: voiceSettings.sayAndAfterLetters ? 20 : 0 }] }
                ]} />
              </View>
            </Pressable>

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVoiceSettings({ speakSentencesOnComplete: !voiceSettings.speakSentencesOnComplete });
              }}
              style={[styles.toggleRow, { backgroundColor: theme.backgroundSecondary, marginTop: Spacing.sm }]}
            >
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Read Sentences</Text>
                <Text style={[styles.toggleHelp, { color: theme.tabIconDefault }]}>
                  Read sentence aloud when you type a period
                </Text>
              </View>
              <View style={[
                styles.toggle, 
                { backgroundColor: voiceSettings.speakSentencesOnComplete ? theme.primary : theme.keyBorder }
              ]}>
                <View style={[
                  styles.toggleKnob,
                  { transform: [{ translateX: voiceSettings.speakSentencesOnComplete ? 20 : 0 }] }
                ]} />
              </View>
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
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  voiceScrollContainer: {
    marginBottom: Spacing.sm,
  },
  voiceScrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  voiceChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
  },
  voiceChipText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "500",
  },
  speedPresetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  speedChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  speedChipText: {
    fontSize: Typography.small.fontSize,
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  toggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  toggleHelp: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
  },
});
