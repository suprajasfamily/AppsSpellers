import React, { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions, Pressable, Text, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useTheme } from "@/hooks/useTheme";
import { 
  usePreferences, 
  KeyboardLayout, 
  SPECIAL_KEYS, 
  ABC_ROW_SIZES, 
  QWERTY_ROW_SIZES,
  GRID_ROW_SIZES,
  KeySize,
  KEY_SPACING_VALUES,
} from "@/contexts/PreferencesContext";
import { Spacing, KeyboardSizes, BorderRadius, Typography } from "@/constants/theme";

interface CustomKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onEnter: () => void;
}

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

const KEY_SIZE_MULTIPLIERS: Record<KeySize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.12,
};

interface DraggableKeyProps {
  keyLabel: string;
  index: number;
  baseKeyWidth: number;
  isCustomizing: boolean;
  onSwap: (fromIndex: number, toIndex: number) => void;
  onPress: () => void;
  onLongPressForSize?: () => void;
  totalKeys: number;
  getButtonColor: () => string;
  getButtonTextColor: () => string;
  rowSizes: number[];
  keySize: KeySize;
  isSpecialKey: boolean;
  keyMargin: { horizontal: number; vertical: number };
  pushToRight?: boolean;
}

function DraggableKey({
  keyLabel,
  index,
  baseKeyWidth,
  isCustomizing,
  onSwap,
  onPress,
  onLongPressForSize,
  totalKeys,
  getButtonColor,
  getButtonTextColor,
  rowSizes,
  keySize,
  isSpecialKey,
  keyMargin,
  pushToRight = false,
}: DraggableKeyProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const sizeMultiplier = KEY_SIZE_MULTIPLIERS[keySize];
  const keyWidth = baseKeyWidth * sizeMultiplier;

  const handleDragEnd = useCallback((fromIdx: number, deltaX: number, deltaY: number) => {
    const keyHeight = 52;
    const keyWidthWithMargin = baseKeyWidth + 6;
    
    const colOffset = Math.round(deltaX / keyWidthWithMargin);
    const rowOffset = Math.round(deltaY / keyHeight);
    
    const { row: currentRow, col: currentCol } = getRowAndColFromIndex(fromIdx, rowSizes);
    const newRow = currentRow + rowOffset;
    const newCol = currentCol + colOffset;
    const toIdx = getIndexFromRowAndCol(newRow, newCol, rowSizes);
    
    if (toIdx !== fromIdx && toIdx >= 0 && toIdx < totalKeys) {
      onSwap(fromIdx, toIdx);
    }
  }, [baseKeyWidth, onSwap, totalKeys, rowSizes]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      if (isCustomizing) {
        zIndex.value = 100;
        scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
        runOnJS(setIsDragging)(true);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else if (onLongPressForSize) {
        runOnJS(onLongPressForSize)();
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
    .onStart(() => {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 12, stiffness: 300 });
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

  const { keyboardLayout } = usePreferences();
  const isGridLayout = keyboardLayout === "grid";
  const buttonColor = isGridLayout ? getButtonColor() : (isSpecialKey ? theme.specialKey : getButtonColor());
  const textColor = isGridLayout ? getButtonTextColor() : (isSpecialKey ? theme.text : getButtonTextColor());

  const getKeyDisplay = () => {
    switch (keyLabel) {
      case SPECIAL_KEYS.SPACE:
        return <Text style={[styles.keyText, { color: textColor }]}>space</Text>;
      case SPECIAL_KEYS.ENTER:
        return isGridLayout ? (
          <Text style={[styles.keyText, { color: textColor }]}>Enter</Text>
        ) : (
          <Feather name="corner-down-left" size={20} color={textColor} />
        );
      case SPECIAL_KEYS.DELETE:
        return isGridLayout ? (
          <Text style={[styles.keyText, { color: textColor }]}>Delete</Text>
        ) : (
          <Feather name="delete" size={20} color={textColor} />
        );
      default:
        return <Text style={[styles.keyText, { color: textColor }]}>{keyLabel}</Text>;
    }
  };

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.draggableKey,
          animatedStyle,
          {
            backgroundColor: buttonColor,
            borderColor: isGridLayout ? "#000000" : theme.keyBorder,
            width: keyLabel === SPECIAL_KEYS.SPACE ? (isGridLayout ? keyWidth * 5 : keyWidth * 2.5) : keyWidth,
            minHeight: isGridLayout ? 60 * sizeMultiplier : 44 * sizeMultiplier,
            marginHorizontal: isGridLayout ? 0 : keyMargin.horizontal,
            marginVertical: isGridLayout ? 0 : keyMargin.vertical,
            marginLeft: pushToRight ? "auto" : undefined,
            borderRadius: isGridLayout ? 0 : BorderRadius.xs,
            borderWidth: isGridLayout ? 0.5 : 1,
          },
          isCustomizing && styles.customizingKey,
          isDragging && styles.draggingKey,
        ]}
      >
        {getKeyDisplay()}
        {isCustomizing ? (
          <View style={styles.dragIndicator}>
            <Feather name="move" size={10} color="rgba(255,255,255,0.6)" />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

function KeySizeModal({
  visible,
  onClose,
  onSelectSize,
  currentSize,
  keyLabel,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectSize: (size: KeySize) => void;
  currentSize: KeySize;
  keyLabel: string;
}) {
  const { theme } = useTheme();
  const sizes: KeySize[] = ["small", "medium", "large"];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            Resize "{keyLabel === SPECIAL_KEYS.SPACE ? "Space" : keyLabel === SPECIAL_KEYS.ENTER ? "Enter" : keyLabel === SPECIAL_KEYS.DELETE ? "Delete" : keyLabel}"
          </Text>
          <View style={styles.sizeOptions}>
            {sizes.map((size) => (
              <Pressable
                key={size}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSelectSize(size);
                  onClose();
                }}
                style={[
                  styles.sizeOption,
                  { 
                    backgroundColor: currentSize === size ? theme.primary : theme.backgroundSecondary,
                    borderColor: theme.keyBorder,
                  },
                ]}
              >
                <Text style={[styles.sizeOptionText, { color: currentSize === size ? "#FFFFFF" : theme.text }]}>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

export function CustomKeyboard({ onKeyPress, onBackspace, onSpace, onEnter }: CustomKeyboardProps) {
  const { theme } = useTheme();
  const { 
    keyboardLayout, 
    keyboardSize,
    keySpacing,
    setKeyboardLayout, 
    getButtonColor,
    getButtonTextColor,
    getCustomLayout, 
    setCustomLayout, 
    resetCustomLayout,
    getKeySize,
    setKeySize,
  } = usePreferences();
  const { width, height } = useWindowDimensions();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [selectedKeyForSize, setSelectedKeyForSize] = useState<string | null>(null);

  const customKeys = useMemo(() => getCustomLayout(keyboardLayout), [keyboardLayout, getCustomLayout]);
  const rowSizes = keyboardLayout === "abc" ? ABC_ROW_SIZES : keyboardLayout === "qwerty" ? QWERTY_ROW_SIZES : GRID_ROW_SIZES;
  const layout = useMemo(() => chunkArray(customKeys, rowSizes), [customKeys, rowSizes]);

  const isGridLayout = keyboardLayout === "grid";
  const keyboardHeight = isGridLayout ? height * 0.75 : height * KeyboardSizes[keyboardSize];
  const maxKeysInRow = Math.max(...rowSizes);
  const spacing = KEY_SPACING_VALUES[keySpacing];
  const getBaseKeyWidth = () => {
    switch (keyboardLayout) {
      case "abc":
        return (width - Spacing.lg * 2 - 5 * (spacing.horizontal * 2)) / 5;
      case "grid":
        return (width - Spacing.sm * 2) / 7;
      default:
        return (width - Spacing.lg * 2 - maxKeysInRow * (spacing.horizontal * 2)) / maxKeysInRow;
    }
  };
  const baseKeyWidth = getBaseKeyWidth();

  const toggleLayout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const layouts: KeyboardLayout[] = ["abc", "qwerty", "grid"];
    const currentIndex = layouts.indexOf(keyboardLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setKeyboardLayout(layouts[nextIndex]);
  };

  const getLayoutDisplayName = () => {
    switch (keyboardLayout) {
      case "abc": return "ABC";
      case "qwerty": return "QWERTY";
      case "grid": return "Grid";
    }
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

  const handleKeyAction = (key: string) => {
    switch (key) {
      case SPECIAL_KEYS.SPACE:
        onSpace();
        break;
      case SPECIAL_KEYS.ENTER:
        onEnter();
        break;
      case SPECIAL_KEYS.DELETE:
        onBackspace();
        break;
      default:
        onKeyPress(key);
    }
  };

  const handleLongPressForSize = (key: string) => {
    setSelectedKeyForSize(key);
    setSizeModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  let keyIndex = 0;

  return (
    <View style={[styles.container, { height: keyboardHeight }, isGridLayout && styles.gridContainer]}>
      <View style={styles.topBar}>
        <View style={styles.leftButtons}>
          <Pressable
            onPress={toggleLayout}
            style={[styles.toggleButton, { backgroundColor: theme.specialKey, borderColor: theme.keyBorder }]}
            accessibilityLabel={`Switch keyboard layout, currently ${getLayoutDisplayName()}`}
          >
            <Text style={[styles.toggleText, { color: theme.text }]}>
              {getLayoutDisplayName()}
            </Text>
            <Feather name="refresh-cw" size={14} color={theme.text} style={styles.toggleIcon} />
          </Pressable>
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
          {keyboardLayout === "abc" ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onBackspace();
              }}
              style={[styles.deleteButtonLarge, { backgroundColor: theme.specialKey, borderColor: theme.keyBorder }]}
              accessibilityLabel="Delete"
            >
              <Feather name="delete" size={22} color={theme.text} />
              <Text style={[styles.deleteButtonText, { color: theme.text }]}>Delete</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {isCustomizing ? (
        <Text style={[styles.hint, { color: theme.tabIconDefault }]}>
          Hold and drag to rearrange. Long-press keys to resize.
        </Text>
      ) : null}

      <View style={[styles.keysContainer, isGridLayout && styles.gridKeysContainer]}>
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={[
            styles.row, 
            { marginVertical: isGridLayout ? 0 : spacing.vertical / 2 },
            isGridLayout && styles.gridRow
          ]}>
            {row.map((key, keyIndexInRow) => {
              const currentIndex = keyIndex++;
              const isSpecial = Object.values(SPECIAL_KEYS).includes(key);
              const isLastKeyInRow = keyIndexInRow === row.length - 1;
              const shouldPushToRight = false;
              return (
                <DraggableKey
                  key={`${key}-${currentIndex}`}
                  keyLabel={key}
                  index={currentIndex}
                  baseKeyWidth={baseKeyWidth}
                  isCustomizing={isCustomizing}
                  onSwap={handleSwap}
                  onPress={() => handleKeyAction(key)}
                  onLongPressForSize={() => handleLongPressForSize(key)}
                  totalKeys={customKeys.length}
                  getButtonColor={getButtonColor}
                  getButtonTextColor={getButtonTextColor}
                  rowSizes={rowSizes}
                  keySize={getKeySize(keyboardLayout, key)}
                  isSpecialKey={isSpecial}
                  keyMargin={spacing}
                  pushToRight={shouldPushToRight}
                />
              );
            })}
          </View>
        ))}
      </View>

      <KeySizeModal
        visible={sizeModalVisible}
        onClose={() => setSizeModalVisible(false)}
        onSelectSize={(size) => {
          if (selectedKeyForSize) {
            setKeySize(keyboardLayout, selectedKeyForSize, size);
          }
        }}
        currentSize={selectedKeyForSize ? getKeySize(keyboardLayout, selectedKeyForSize) : "medium"}
        keyLabel={selectedKeyForSize || ""}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  gridContainer: {
    paddingHorizontal: Spacing.xs,
    paddingBottom: 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
    zIndex: 10,
  },
  leftButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  customizeButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    minWidth: 110,
    justifyContent: "center",
  },
  deleteButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    marginLeft: Spacing.sm,
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
    zIndex: 1,
  },
  gridKeysContainer: {
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  gridRow: {
    justifyContent: "flex-start",
    width: "100%",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    minWidth: 250,
  },
  modalTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  sizeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  sizeOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  sizeOptionText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "500",
  },
});
