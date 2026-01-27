import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { useAudioPlayer } from "expo-audio";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, runOnJS } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { Calculator } from "@/components/Calculator";
import { SuggestionPill } from "@/components/SuggestionPill";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, AppMode, KeyboardLayout } from "@/contexts/PreferencesContext";
import { getSuggestions } from "@/lib/wordSuggestions";
import { evaluateExpression } from "@/lib/calculator";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Typing">;

const MIN_TEXT_HEIGHT = 80;
const MAX_TEXT_HEIGHT_RATIO = 0.6;

export default function TypingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { voiceSettings, metronomeVolume, metronomeBpm, keyboardLayout, qwertyTextColor, textAreaHeight, setTextAreaHeight } = usePreferences();
  const navigation = useNavigation<NavigationProp>();
  const { height: screenHeight } = useWindowDimensions();

  const [mode, setMode] = useState<AppMode>("keyboard");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(["I", "The", "My", "A", "We"]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [metronomeActive, setMetronomeActive] = useState(false);
  const metronomeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickTokRef = useRef<boolean>(true);

  const tickPlayer = useAudioPlayer(require("@/assets/audio/tick.wav"));
  const tokPlayer = useAudioPlayer(require("@/assets/audio/tok.wav"));

  const maxTextHeight = screenHeight * MAX_TEXT_HEIGHT_RATIO;
  const currentHeight = useSharedValue(textAreaHeight || 150);
  const startHeight = useSharedValue(textAreaHeight || 150);

  const saveHeight = useCallback((h: number) => {
    setTextAreaHeight(h);
  }, [setTextAreaHeight]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startHeight.value = currentHeight.value;
    })
    .onUpdate((event) => {
      const newHeight = startHeight.value + event.translationY;
      currentHeight.value = Math.max(MIN_TEXT_HEIGHT, Math.min(maxTextHeight, newHeight));
    })
    .onEnd(() => {
      runOnJS(saveHeight)(currentHeight.value);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });

  const animatedTextStyle = useAnimatedStyle(() => ({
    height: currentHeight.value,
  }));

  useEffect(() => {
    if (textAreaHeight && textAreaHeight !== currentHeight.value) {
      currentHeight.value = textAreaHeight;
    }
  }, [textAreaHeight]);

  useEffect(() => {
    return () => {
      Speech.stop();
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    const checkDriveConnection = async () => {
      try {
        const response = await fetch(new URL('/api/google-drive/status', getApiUrl()).toString());
        const data = await response.json();
        setDriveConnected(data.connected);
      } catch {
        setDriveConnected(false);
      }
    };
    checkDriveConnection();
  }, []);

  const updateSuggestions = useCallback((newText: string) => {
    const newSuggestions = getSuggestions(newText);
    setSuggestions(newSuggestions);
  }, []);

  const shouldCapitalize = useCallback((currentText: string): boolean => {
    if (currentText.length === 0) return true;
    const trimmed = currentText.trimEnd();
    if (trimmed.length === 0) return true;
    const lastNonSpace = trimmed[trimmed.length - 1];
    if (lastNonSpace === '.' || lastNonSpace === '?' || lastNonSpace === '!') return true;
    if (currentText.endsWith('\n')) return true;
    return false;
  }, []);

  const speakLetter = useCallback((letter: string) => {
    if (!voiceSettings.speakLettersOnType) return;
    
    const textToSpeak = voiceSettings.sayAndAfterLetters 
      ? `${letter}... and` 
      : letter;
    
    Speech.speak(textToSpeak, {
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      voice: voiceSettings.voiceId || undefined,
    });
  }, [voiceSettings]);

  const speakSentence = useCallback((fullText: string) => {
    if (!voiceSettings.speakSentencesOnComplete) return;
    
    const sentences = fullText.match(/[^.!?]*[.!?]/g);
    if (!sentences || sentences.length === 0) return;
    
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence) {
      setTimeout(() => {
        Speech.speak(lastSentence, {
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          voice: voiceSettings.voiceId || undefined,
        });
      }, 300);
    }
  }, [voiceSettings]);

  const handleKeyPress = useCallback((key: string) => {
    const capitalize = shouldCapitalize(text);
    const processedKey = capitalize ? key.toUpperCase() : key.toLowerCase();
    const newText = text + processedKey;
    setText(newText);
    updateSuggestions(newText);
    
    if (/^[A-Za-z]$/.test(key)) {
      speakLetter(processedKey);
    }
    
    if (['.', '!', '?'].includes(key)) {
      speakSentence(newText);
    }
  }, [text, updateSuggestions, shouldCapitalize, speakLetter, speakSentence]);

  const handleBackspace = useCallback(() => {
    const newText = text.slice(0, -1);
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleSpace = useCallback(() => {
    const newText = text + " ";
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleEnter = useCallback(() => {
    const newText = text + "\n";
    setText(newText);
    updateSuggestions(newText);
    
    if (voiceSettings.speakSentencesOnComplete && text.trim()) {
      const lines = text.split('\n');
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine) {
        setTimeout(() => {
          Speech.speak(lastLine, {
            rate: voiceSettings.rate,
            pitch: voiceSettings.pitch,
            voice: voiceSettings.voiceId || undefined,
          });
        }, 300);
      }
    }
  }, [text, updateSuggestions, voiceSettings]);

  const handleSuggestionPress = useCallback((word: string) => {
    const words = text.trim().split(/\s+/);
    const lastWord = words[words.length - 1] || "";
    let newText: string;
    
    if (lastWord && !text.endsWith(" ")) {
      newText = text.slice(0, -lastWord.length) + word + " ";
    } else {
      newText = text + word + " ";
    }
    
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions]);

  const handleClear = useCallback(() => {
    Alert.alert(
      "Clear all text?",
      "This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setText("");
            setSuggestions(["I", "The", "My", "A", "We"]);
          },
        },
      ]
    );
  }, []);

  const handleCalculatorCharacter = useCallback((char: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newText = text + char;
    setText(newText);
  }, [text]);

  const handleCalculatorClear = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setText("");
    setSuggestions(["I", "The", "My", "A", "We"]);
  }, []);

  const handleCalculatorEvaluate = useCallback(() => {
    const expressionMatch = text.match(/[\d\s+\-×÷*/().^√sinctanlogπ]+$/);
    if (!expressionMatch) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const expression = expressionMatch[0].trim();
    const result = evaluateExpression(expression);
    if (result === "Error") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const beforeExpression = text.slice(0, text.length - expressionMatch[0].length);
    setText(beforeExpression + result + " ");
  }, [text]);

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      return;
    }
    if (!text.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeaking(true);
    Speech.speak(text, {
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      voice: voiceSettings.voiceId || undefined,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [text, isSpeaking, voiceSettings]);

  const handleSaveToDrive = useCallback(async () => {
    if (!text.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Nothing to Save", "Type some text first to save to Google Drive.");
      return;
    }
    setIsSavingToDrive(true);
    try {
      const response = await apiRequest("POST", "/api/google-drive/save", { content: text });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed with status ${response.status}`);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved to Google Drive", "Your notes have been saved to 'TypeBuddy Notes' in your Google Drive.");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage = error.message || "";
      const isPermissionError = errorMessage.toLowerCase().includes("permission") || 
                                errorMessage.toLowerCase().includes("insufficient") ||
                                errorMessage.includes("403");
      const isNotConnected = errorMessage.toLowerCase().includes("not connected");
      
      if (isPermissionError) {
        Alert.alert(
          "Permission Issue",
          "Google Drive needs additional permissions to save files.\n\nTo fix this:\n1. Go to Replit Integrations\n2. Disconnect Google Drive\n3. Reconnect and accept all permissions\n\nThis will allow the app to create files in your Drive."
        );
      } else if (isNotConnected) {
        Alert.alert(
          "Google Drive Not Connected",
          "Please connect your Google account through Replit Integrations to save files to Google Drive."
        );
      } else {
        Alert.alert("Save Failed", errorMessage || "Could not save to Google Drive. Please try again.");
      }
    } finally {
      setIsSavingToDrive(false);
    }
  }, [text]);

  const playMetronomeTick = useCallback(() => {
    if (metronomeVolume > 0) {
      const isTick = tickTokRef.current;
      tickTokRef.current = !tickTokRef.current;
      Haptics.impactAsync(isTick ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
      const player = isTick ? tickPlayer : tokPlayer;
      player.volume = metronomeVolume;
      player.seekTo(0);
      player.play();
    }
  }, [metronomeVolume, tickPlayer, tokPlayer]);

  const toggleMetronome = useCallback(() => {
    if (metronomeInterval.current) {
      clearInterval(metronomeInterval.current);
      metronomeInterval.current = null;
    }
    
    if (metronomeActive) {
      setMetronomeActive(false);
    } else {
      tickTokRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMetronomeActive(true);
      const intervalMs = Math.round(60000 / metronomeBpm);
      playMetronomeTick();
      metronomeInterval.current = setInterval(() => {
        playMetronomeTick();
      }, intervalMs);
    }
  }, [metronomeActive, playMetronomeTick, metronomeBpm]);

  useEffect(() => {
    if (metronomeActive) {
      if (metronomeInterval.current) {
        clearInterval(metronomeInterval.current);
      }
      const intervalMs = Math.round(60000 / metronomeBpm);
      metronomeInterval.current = setInterval(() => {
        playMetronomeTick();
      }, intervalMs);
    }
  }, [metronomeBpm, metronomeActive, playMetronomeTick]);

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.md,
            paddingBottom: insets.bottom + Spacing.sm,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.headerButtonGroup}>
            <Pressable
              onPress={handleClear}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
              accessibilityLabel="Clear text"
            >
              <Feather name="trash-2" size={20} color={theme.text} />
            </Pressable>
            <Pressable
              onPress={handleReadAloud}
              style={[
                styles.headerButton,
                { backgroundColor: isSpeaking ? theme.primary : theme.backgroundSecondary, marginLeft: Spacing.xs },
              ]}
              accessibilityLabel={isSpeaking ? "Stop reading" : "Read aloud"}
            >
              <Feather name={isSpeaking ? "stop-circle" : "volume-2"} size={20} color={isSpeaking ? "#FFFFFF" : theme.text} />
            </Pressable>
            <Pressable
              onPress={toggleMetronome}
              style={[
                styles.headerButton,
                { backgroundColor: metronomeActive ? theme.primary : theme.backgroundSecondary, marginLeft: Spacing.xs },
              ]}
              accessibilityLabel={metronomeActive ? "Stop metronome" : "Start metronome"}
            >
              <Feather name="clock" size={20} color={metronomeActive ? "#FFFFFF" : theme.text} />
            </Pressable>
            {driveConnected ? (
              <Pressable
                onPress={handleSaveToDrive}
                disabled={isSavingToDrive}
                style={[
                  styles.headerButton,
                  { backgroundColor: theme.backgroundSecondary, marginLeft: Spacing.xs },
                ]}
                accessibilityLabel="Save to Google Drive"
              >
                {isSavingToDrive ? (
                  <ActivityIndicator size="small" color={theme.text} />
                ) : (
                  <Feather name="upload-cloud" size={20} color={theme.text} />
                )}
              </Pressable>
            ) : null}
          </View>

          <View style={styles.headerButtonGroup}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("keyboard");
              }}
              style={[
                styles.modeButton,
                { backgroundColor: mode === "keyboard" ? theme.primary : theme.backgroundSecondary },
              ]}
              accessibilityLabel="Letters mode"
            >
              <Feather
                name="type"
                size={16}
                color={mode === "keyboard" ? "#FFFFFF" : theme.text}
              />
              <Text style={[styles.modeButtonText, { color: mode === "keyboard" ? "#FFFFFF" : theme.text }]}>
                Letters
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("calculator");
              }}
              style={[
                styles.modeButton,
                { backgroundColor: mode === "calculator" ? theme.primary : theme.backgroundSecondary, marginLeft: Spacing.xs },
              ]}
              accessibilityLabel="Numeric mode"
            >
              <Feather
                name="hash"
                size={16}
                color={mode === "calculator" ? "#FFFFFF" : theme.text}
              />
              <Text style={[styles.modeButtonText, { color: mode === "calculator" ? "#FFFFFF" : theme.text }]}>
                Numeric
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate("Settings")}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary, marginLeft: Spacing.xs }]}
              accessibilityLabel="Settings"
            >
              <Feather name="settings" size={20} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {keyboardLayout === "letterboard" && mode === "keyboard" ? (
          <View
            style={[
              styles.typingArea,
              {
                flex: 1,
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.typingAreaBorder,
              },
            ]}
          >
            <TextInput
              style={[
                styles.letterboardTextInput,
                {
                  color: theme.text,
                  fontFamily: Fonts?.sans || "System",
                },
              ]}
              value={text}
              onChangeText={(newText) => {
                if (newText.length > text.length) {
                  const newChar = newText.slice(-1);
                  if (newChar !== ' ' && newChar !== '\n') {
                    speakLetter(newChar);
                  }
                }
                setText(newText);
                updateSuggestions(newText);
                if (newText.endsWith('.') || newText.endsWith('!') || newText.endsWith('?')) {
                  speakSentence(newText);
                }
              }}
              placeholder="Connect Bluetooth keyboard and start typing..."
              placeholderTextColor={theme.tabIconDefault}
              multiline
              autoFocus
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect={true}
            />
          </View>
        ) : (
          <Animated.View
            style={[
              styles.typingArea,
              animatedTextStyle,
              {
                backgroundColor: theme.typingAreaBg,
                borderColor: theme.typingAreaBorder,
              },
            ]}
          >
            <ScrollView
              style={styles.typingScroll}
              contentContainerStyle={styles.typingContent}
              showsVerticalScrollIndicator={true}
            >
              <Text
                style={[
                  styles.typingText,
                  {
                    color: theme.text,
                    fontFamily: Fonts?.sans || "System",
                  },
                ]}
              >
                {text || "Start typing..."}
              </Text>
            </ScrollView>
          </Animated.View>
        )}

        {mode === "keyboard" && keyboardLayout !== "letterboard" ? (
          <>
            <GestureDetector gesture={panGesture}>
              <View style={[styles.dragHandle, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.dragHandleBar, { backgroundColor: theme.tabIconDefault }]} />
              </View>
            </GestureDetector>

            <View style={styles.suggestionsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsScroll}
              >
                {suggestions.map((word, index) => (
                  <SuggestionPill
                    key={`${word}-${index}`}
                    word={word}
                    onPress={handleSuggestionPress}
                  />
                ))}
              </ScrollView>
            </View>

            <CustomKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onSpace={handleSpace}
              onEnter={handleEnter}
            />
          </>
        ) : mode === "calculator" ? (
          <>
            <GestureDetector gesture={panGesture}>
              <View style={[styles.dragHandle, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={[styles.dragHandleBar, { backgroundColor: theme.tabIconDefault }]} />
              </View>
            </GestureDetector>
            <Calculator
              onCharacter={handleCalculatorCharacter}
              onBackspace={handleBackspace}
              onClear={handleCalculatorClear}
              onEvaluate={handleCalculatorEvaluate}
              expression={text}
            />
          </>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerButtonGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  modeButtonText: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
    marginLeft: 4,
  },
  typingArea: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: 0,
    overflow: "hidden",
  },
  typingScroll: {
    flex: 1,
  },
  typingContent: {
    padding: Spacing.md,
    minHeight: "100%",
  },
  typingText: {
    fontSize: Typography.typing.fontSize,
    fontWeight: Typography.typing.fontWeight,
  },
  typingTextInput: {
    flex: 1,
    fontSize: Typography.typing.fontSize,
    fontWeight: Typography.typing.fontWeight,
    padding: Spacing.md,
    textAlignVertical: "top",
  },
  letterboardTextInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "500",
    padding: Spacing.lg,
    textAlignVertical: "top",
    lineHeight: 32,
  },
  suggestionsContainer: {
    height: 36,
    marginBottom: 0,
    marginTop: 0,
  },
  suggestionsScroll: {
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
  dragHandle: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 0,
    borderRadius: BorderRadius.xs,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});
