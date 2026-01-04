import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  Pressable,
  Alert,
  useWindowDimensions,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics"
import * as Speech from "expo-speech";
import { ThemedView } from "@/components/ThemedView";
import { CustomKeyboard } from "@/components/CustomKeyboard";
import { Calculator } from "@/components/Calculator";
import { SuggestionPill } from "@/components/SuggestionPill";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, AppMode } from "@/contexts/PreferencesContext";
import { getSuggestions } from "@/lib/wordSuggestions";
import { evaluateExpression } from "@/lib/calculator";
import { apiRequest, getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Typography, Fonts } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";


interface DriveDocument {
  id: string;
  name: string;
  modifiedTime: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Typing">;

export default function TypingScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const { height } = useWindowDimensions();

  const [mode, setMode] = useState<AppMode>("keyboard");
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>(["I", "The", "My", "A", "We"]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [documentsModalVisible, setDocumentsModalVisible] = useState(false);
  const [documents, setDocuments] = useState<DriveDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(50);

  const availableHeight = height - insets.top - insets.bottom - headerHeight - Spacing.md - Spacing.sm;
  const typingAreaHeight = availableHeight * 0.25;
  const keyboardAreaHeight = availableHeight * 0.75;

  useEffect(() => {
    return () => {
      Speech.stop();
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

  const loadDocumentsList = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const response = await fetch(new URL('/api/google-drive/list', getApiUrl()).toString());
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      setDocuments(data.files || []);
    } catch {
      Alert.alert("Error", "Could not load documents from Google Drive.");
    } finally {
      setIsLoadingDocuments(false);
    }
  }, []);

  const handleOpenDocuments = useCallback(() => {
    if (!driveConnected) {
      Alert.alert("Not Connected", "Connect Google Drive in Settings first.");
      return;
    }
    setDocumentsModalVisible(true);
    loadDocumentsList();
  }, [driveConnected, loadDocumentsList]);

  const handleLoadDocument = useCallback(async (fileId: string) => {
    setIsLoadingDocument(true);
    try {
      const response = await fetch(new URL(`/api/google-drive/file/${fileId}`, getApiUrl()).toString());
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const data = await response.json();
      setText(data.content || '');
      setSuggestions(getSuggestions(data.content || ''));
      setDocumentsModalVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not load the document.");
    } finally {
      setIsLoadingDocument(false);
    }
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
      Alert.alert("Save Failed", error.message || "Could not save to Google Drive.");
    } finally {
      setIsSavingToDrive(false);
    }
  }, [text]);

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
        <View 
          style={styles.header}
          onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        >
          <View style={styles.headerButtonGroup}>
            <Pressable
              onPress={handleOpenDocuments}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary }]}
              accessibilityLabel="Open document"
            >
              <Feather name="folder" size={20} color={theme.text} />
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
              onPress={handleClear}
              style={[styles.headerButton, { backgroundColor: theme.backgroundSecondary, marginLeft: Spacing.xs }]}
              accessibilityLabel="Clear text"
            >
              <Feather name="trash-2" size={20} color={theme.text} />
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
              height: typingAreaHeight,
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

        <View style={{ height: keyboardAreaHeight }}>
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
      </View>

      <Modal
        visible={documentsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDocumentsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDocumentsModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Your Documents</Text>
            {isLoadingDocuments ? (
              <ActivityIndicator size="large" color={theme.primary} />
            ) : documents.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.tabIconDefault }]}>
                No documents saved yet.
              </Text>
            ) : (
              <FlatList
                data={documents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleLoadDocument(item.id)}
                    disabled={isLoadingDocument}
                    style={[styles.documentItem, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <Text style={[styles.documentName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[styles.documentDate, { color: theme.tabIconDefault }]}>
                      {new Date(item.modifiedTime).toLocaleDateString()}
                    </Text>
                  </Pressable>
                )}
              />
            )}
            <Pressable
              onPress={() => setDocumentsModalVisible(false)}
              style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "60%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  documentItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  documentName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
  documentDate: {
    fontSize: Typography.small.fontSize,
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    fontSize: Typography.body.fontSize,
    marginTop: Spacing.lg,
  },
  closeButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
});
