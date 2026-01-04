import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions, Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { KeyButton } from "./KeyButton";
import { useTheme } from "@/hooks/useTheme";
import { usePreferences, KeyboardLayout } from "@/contexts/PreferencesContext";
import { Spacing, KeyboardSizes, BorderRadius, Typography } from "@/constants/theme";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
}

const ABC_ROW_SIZES = [5, 5, 5, 5, 6];
const QWERTY_ROW_SIZES = [10, 9, 7];

function chunkArray(array: string[], sizes: number[]): string[][] {
  const result: string[][] = [];
  let index = 0;
  for (const size of sizes) {
    result.push(array.slice(index, index + size));
    index += size;
  }
  return result;
}

function getRowAndColFromIndex(index: number, rowSizes: number[]): { row: number; col: number } {
  let cumulative = 0;
  for (let row = 0; row < rowSizes.length; row++) {
    if (index < cumulative + rowSizes[row]) {
      return { row, col: index - cumulative };
    }
    cumulative += rowSizes[row];
  }
  return { row: rowSizes.length - 1, col: index - cumulative + rowSizes[rowSizes.length - 1] };
}

function getIndexFromRowAndCol(row: number, col: number, rowSizes: number[]): number {
  const clampedRow = Math.max(0, Math.min(rowSizes.length - 1, row));
  const maxColInRow = rowSizes[clampedRow] - 1;
  const clampedCol = Math.max(0, Math.min(maxColInRow, col));
  
  let index = 0;
  for (let r = 0; r < clampedRow; r++) {
    index += rowSizes[r];
  }
  return index + clampedCol;
}

interface DraggableKeyProps {
  keyLabel: string;
  index: number;
  keyWidth: number;
  isCustomizing: boolean;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  totalKeys: number;
  getButtonColor: () => string;
  rowSizes: number[];
}

function DraggableKey({
  keyLabel,
  index,
  keyWidth,
  isCustomizing,
  onSwap,
  onPress,
  totalKeys,
  getButtonColor,
  rowSizes,
}: DraggableKeyProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = useCallback((fromIdx: number, deltaX: number, deltaY: number) => {
    const keyHeight = 52;
    const keyWidthWithMargin = keyWidth + 6;
    
    const colOffset = Math.round(deltaX / keyWidthWithMargin);
    const rowOffset = Math.round(deltaY / keyHeight);
    
    const { row: currentRow, col: currentCol } = getRowAndColFromIndex(fromIdx, rowSizes);
    const newRow = currentRow + rowOffset;
    const newCol = currentCol + colOffset;
    const toIdx = getIndexFromRowAndCol(newRow, newCol, rowSizes);
    
    if (toIdx !== fromIdx && toIdx >= 0 && toIdx < totalKeys) {
      onSwap(fromIdx, toIdx);
    }
  }, [keyWidth, onSwap, totalKeys, rowSizes]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      if (isCustomizing) {
        zIndex.value = 100;
        scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
        runOnJS(setIsDragging)(true);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      }
    });

  const panGesture = Gesture.Pan()
    .enabled(isCustomizing && isDragging)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      runOnJS(handleDragEnd)(index, event.translationX, event.translationY);
      translateX.value = withSpring(0, { damping: 15 });
      translateY.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(1, { damping: 15 });
      zIndex.value = 0;
      runOnJS(setIsDragging)(false);
    });

  const tapGesture = Gesture.Tap()
    .enabled(!isCustomizing)
    .onEnd(() => {
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      runOnJS(onPress)();
    });

  const composedGesture = Gesture.Simultaneous(
    longPressGesture,
    Gesture.Race(panGesture, tapGesture)
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const buttonColor = getButtonColor();

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.draggableKey,
          animatedStyle,
          {
            backgroundColor: buttonColor,
            borderColor: theme.keyBorder,
            width: keyWidth,
          },
          isCustomizing && styles.customizingKey,
          isDragging && styles.draggingKey,
        ]}
      >
        <Text style={[styles.keyText, { color: "#FFFFFF" }]}>{keyLabel}</Text>
        {isCustomizing ? (
          <View style={styles.dragIndicator}>
            <Feather name="move" size={12} color="rgba(255,255,255,0.6)" />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

export function CustomKeyboard({ onKeyPress, onBackspace, onSpace, onEnter }: CustomKeyboardProps) {
  const { theme } = useTheme();
  const { keyboardLayout, keyboardSize, setKeyboardLayout, getButtonColor, getCustomLayout, setCustomLayout, resetCustomLayout } = usePreferences();
  const { width, height } = useWindowDimensions();
  const [isCustomizing, setIsCustomizing] = useState(false);

  const customKeys = useMemo(() => getCustomLayout(keyboardLayout), [keyboardLayout, getCustomLayout]);
  const rowSizes = keyboardLayout === "abc" ? ABC_ROW_SIZES : QWERTY_ROW_SIZES;
  const layout = useMemo(() => chunkArray(customKeys, rowSizes), [customKeys, rowSizes]);

  const keyboardHeight = height * KeyboardSizes[keyboardSize];
  const maxKeysInRow = Math.max(...rowSizes);
  const keyWidth = keyboardLayout === "abc" 
    ? (width - Spacing.lg * 2 - 5 * 10) / 5
    : (width - Spacing.lg * 2 - maxKeysInRow * 8) / maxKeysInRow;

  const toggleLayout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setKeyboardLayout(keyboardLayout === "abc" ? "qwerty" : "abc");
  };

  const toggleCustomize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsCustomizing(!isCustomizing);
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetCustomLayout(keyboardLayout);
  };

  const handleSwap = useCallback((fromIndex: number, toIndex: number) => {
    const newKeys = [...customKeys];
    const temp = newKeys[fromIndex];
    newKeys[fromIndex] = newKeys[toIndex];
    newKeys[toIndex] = temp;
    setCustomLayout(keyboardLayout, newKeys);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [customKeys, keyboardLayout, setCustomLayout]);

  let keyIndex = 0;

  return (
    <View style={[styles.container, { height: keyboardHeight }]}>
      <View style={styles.topBar}>
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

        <View style={styles.customizeButtons}>
          {isCustomizing ? (
            <Pressable
              onPress={handleReset}
              style={[styles.toggleButton, { backgroundColor: theme.specialKey, borderColor: theme.keyBorder, marginRight: Spacing.sm }]}
              accessibilityLabel="Reset layout"
            >
              <Feather name="rotate-ccw" size={14} color={theme.text} />
              <Text style={[styles.toggleText, { color: theme.text, marginLeft: 4 }]}>Reset</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={toggleCustomize}
            style={[
              styles.toggleButton, 
              { 
                backgroundColor: isCustomizing ? theme.primary : theme.specialKey, 
                borderColor: theme.keyBorder 
              }
            ]}
            accessibilityLabel={isCustomizing ? "Done customizing" : "Customize keyboard"}
          >
            <Feather name={isCustomizing ? "check" : "edit-2"} size={14} color={isCustomizing ? "#FFFFFF" : theme.text} />
            <Text style={[styles.toggleText, { color: isCustomizing ? "#FFFFFF" : theme.text, marginLeft: 4 }]}>
              {isCustomizing ? "Done" : "Edit"}
            </Text>
          </Pressable>
        </View>
      </View>

      {isCustomizing ? (
        <Text style={[styles.hint, { color: theme.tabIconDefault }]}>
          Hold and drag keys to rearrange
        </Text>
      ) : null}

      <View style={styles.keysContainer}>
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => {
              const currentIndex = keyIndex++;
              return (
                <DraggableKey
                  key={`${key}-${currentIndex}`}
                  keyLabel={key}
                  index={currentIndex}
                  keyWidth={keyWidth}
                  isCustomizing={isCustomizing}
                  onSwap={handleSwap}
                  onPress={() => onKeyPress(key)}
                  totalKeys={customKeys.length}
                  getButtonColor={getButtonColor}
                  rowSizes={rowSizes}
                />
              );
            })}
          </View>
        ))}

        <View style={styles.bottomRow}>
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
              styles.specialKey,
              { backgroundColor: theme.specialKey, borderColor: theme.keyBorder },
            ]}
            accessibilityLabel="Backspace"
          >
            <Feather name="delete" size={22} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSpace();
            }}
            style={[
              styles.spaceKey,
              { backgroundColor: getButtonColor(), borderColor: theme.keyBorder },
            ]}
            accessibilityLabel="Space"
          >
            <Text style={[styles.spaceText, { color: "#FFFFFF" }]}>space</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onEnter();
            }}
            style={[
              styles.specialKey,
              { backgroundColor: theme.specialKey, borderColor: theme.keyBorder },
            ]}
            accessibilityLabel="Enter"
          >
            <Feather name="corner-down-left" size={22} color={theme.text} />
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  customizeButtons: {
    flexDirection: "row",
    alignItems: "center",
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
  hint: {
    textAlign: "center",
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.sm,
  },
  keysContainer: {
    flex: 1,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 3,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  specialKey: {
    minWidth: 60,
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  spaceKey: {
    flex: 1,
    maxWidth: 200,
    minHeight: 48,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
  },
  spaceText: {
    fontSize: Typography.keyboard.fontSize,
    fontWeight: "600",
  },
  draggableKey: {
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
    fontSize: Typography.keyboard.fontSize,
    fontWeight: "600",
    textAlign: "center",
  },
  customizingKey: {
    borderStyle: "dashed",
    borderWidth: 2,
  },
  draggingKey: {
    opacity: 0.9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dragIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
  },
});
