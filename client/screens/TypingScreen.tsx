import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ThemedView } from "@/components/ThemedView";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { Calculator } from "@/components/Calculator";
import { SuggestionPill } from "@/components/SuggestionPill";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, AppMode } from "@/contexts/PreferencesContext";
import { getSuggestions } from "@/lib/wordSuggestions";
import { evaluateExpression } from "@/lib/calculator";
import { Spacing, BorderRadius, Typography, TypingAreaSizes, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Typing">;

export default function TypingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { typingAreaSize } = usePreferences();
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();

  const [mode, setMode] = useState<AppMode>("keyboard");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(["I", "The", "My", "A", "We"]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const typingHeight = height * TypingAreaSizes[typingAreaSize];

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

  const handleKeyPress = useCallback((key: string) => {
    const capitalize = shouldCapitalize(text);
    const processedKey = capitalize ? key.toUpperCase() : key.toLowerCase();
    const newText = text + processedKey;
    setText(newText);
    updateSuggestions(newText);
  }, [text, updateSuggestions, shouldCapitalize]);

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
  }, [text, updateSuggestions]);

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
      rate: 0.85,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [text, isSpeaking]);

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
          </View>

          <View style={styles.modeToggle}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("keyboard");
              }}
              style={[
                styles.modeButton,
                mode === "keyboard" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="type"
                size={18}
                color={mode === "keyboard" ? "#FFFFFF" : theme.text}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "keyboard" ? "#FFFFFF" : theme.text },
                ]}
              >
                Keyboard
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMode("calculator");
              }}
              style={[
                styles.modeButton,
                mode === "calculator" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="hash"
                size={18}
                color={mode === "calculator" ? "#FFFFFF" : theme.text}
              />
              <Text
                style={[
                  styles.modeText,
                  { color: mode === "calculator" ? "#FFFFFF" : theme.text },
                ]}
              >
                Calculator
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => navigation.navigate("Settings")}
            style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
            accessibilityLabel="Settings"
          >
            <Feather name="settings" size={20} color={theme.text} />
          </Pressable>
        </View>

        <View
          style={[
            styles.typingArea,
            {
              height: typingHeight,
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
        </View>

        {mode === "keyboard" ? (
          <>
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
        ) : (
          <Calculator
              onCharacter={handleCalculatorCharacter}
              onBackspace={handleBackspace}
              onClear={handleCalculatorClear}
              onEvaluate={handleCalculatorEvaluate}
            />
        )}
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
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "transparent",
  },
  modeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginHorizontal: 2,
  },
  modeText: {
    marginLeft: Spacing.xs,
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
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
  suggestionsContainer: {
    height: 50,
    marginBottom: 0,
  },
  suggestionsScroll: {
    alignItems: "center",
    paddingHorizontal: Spacing.xs,
  },
});
