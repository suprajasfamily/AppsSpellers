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
  LETTERBOARD_ROW_SIZES,
  KeySize,
  KEY_SPACING_VALUES,
  GridDimensions,
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
  isLetterboard?: boolean;
  letterboardBgColor?: string;
  letterboardTextColor?: string;
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
  isLetterboard = false,
  letterboardBgColor,
  letterboardTextColor,
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
  const isFullscreenLayout = isGridLayout || isLetterboard;
  
  const getKeyButtonColor = () => {
    if (isLetterboard && letterboardBgColor) return letterboardBgColor;
    if (isGridLayout) return getButtonColor();
    if (isSpecialKey) return theme.specialKey;
    return getButtonColor();
  };
  
  const getKeyTextColor = () => {
    if (isLetterboard && letterboardTextColor) return letterboardTextColor;
    if (isGridLayout) return getButtonTextColor();
    if (isSpecialKey) return theme.text;
    return getButtonTextColor();
  };
  
  const buttonColor = getKeyButtonColor();
  const textColor = getKeyTextColor();

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
            borderColor: isFullscreenLayout ? "#000000" : theme.keyBorder,
            marginHorizontal: 0,
            marginVertical: 0,
            marginLeft: pushToRight ? "auto" : undefined,
            borderRadius: 0,
            borderWidth: 0.5,
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
    getLetterboardBgColor,
    getLetterboardTextColor,
    getCustomLayout, 
    setCustomLayout, 
    resetCustomLayout,
    getKeySize,
    setKeySize,
    gridDimensions,
    setGridDimensions,
  } = usePreferences();
  const { width, height } = useWindowDimensions();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);
  const [selectedKeyForSize, setSelectedKeyForSize] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const gridWidth = useSharedValue(gridDimensions?.width ?? width * 0.9);
  const gridHeight = useSharedValue(gridDimensions?.height ?? height * 0.75);
  const gridX = useSharedValue(gridDimensions?.x ?? (width - (gridDimensions?.width ?? width * 0.9)) / 2);
  const gridY = useSharedValue(gridDimensions?.y ?? height * 0.15);
  
  const startWidth = useSharedValue(0);
  const startHeight = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const customKeys = useMemo(() => getCustomLayout(keyboardLayout), [keyboardLayout, getCustomLayout]);
  const getRowSizes = () => {
    switch (keyboardLayout) {
      case "abc": return ABC_ROW_SIZES;
      case "qwerty": return QWERTY_ROW_SIZES;
      case "grid": return GRID_ROW_SIZES;
      case "letterboard": return LETTERBOARD_ROW_SIZES;
    }
  };
  const rowSizes = getRowSizes();
  const layout = useMemo(() => chunkArray(customKeys, rowSizes), [customKeys, rowSizes]);

  const isGridLayout = keyboardLayout === "grid";
  const isLetterboardLayout = keyboardLayout === "letterboard";
  const isFullscreenLayout = isGridLayout || isLetterboardLayout;
  const keyboardHeight = isLetterboardLayout ? height * 0.99 : (isGridLayout ? height * 0.85 : height * KeyboardSizes[keyboardSize]);
  const maxKeysInRow = Math.max(...rowSizes);
  const spacing = KEY_SPACING_VALUES[keySpacing];
  const getBaseKeyWidth = () => {
    switch (keyboardLayout) {
      case "abc":
        return (width - Spacing.lg * 2 - 5 * (spacing.horizontal * 2)) / 5;
      case "grid":
      case "letterboard":
        return (width - Spacing.sm * 2) / 6;
      default:
        return (width - Spacing.lg * 2 - maxKeysInRow * (spacing.horizontal * 2)) / maxKeysInRow;
    }
  };
  const baseKeyWidth = getBaseKeyWidth();

  const toggleLayout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const layouts: KeyboardLayout[] = ["abc", "qwerty", "grid", "letterboard"];
    const currentIndex = layouts.indexOf(keyboardLayout);
    const nextIndex = (currentIndex + 1) % layouts.length;
    setKeyboardLayout(layouts[nextIndex]);
  };

  const getLayoutDisplayName = () => {
    switch (keyboardLayout) {
      case "abc": return "ABC";
      case "qwerty": return "QWERTY";
      case "grid": return "Grid";
      case "letterboard": return "Letterboard";
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

  const saveGridDimensions = () => {
    setGridDimensions({
      width: gridWidth.value,
      height: gridHeight.value,
      x: gridX.value,
      y: gridY.value,
    });
  };

  const dragGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = gridX.value;
      startY.value = gridY.value;
    })
    .onUpdate((event) => {
      gridX.value = Math.max(0, Math.min(width - gridWidth.value, startX.value + event.translationX));
      gridY.value = Math.max(0, Math.min(height - gridHeight.value, startY.value + event.translationY));
    })
    .onEnd(() => {
      runOnJS(saveGridDimensions)();
    });

  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = gridWidth.value;
      startHeight.value = gridHeight.value;
      runOnJS(setIsResizing)(true);
    })
    .onUpdate((event) => {
      const newWidth = Math.max(200, Math.min(width - gridX.value, startWidth.value + event.translationX));
      const newHeight = Math.max(200, Math.min(height - gridY.value, startHeight.value + event.translationY));
      gridWidth.value = newWidth;
      gridHeight.value = newHeight;
    })
    .onEnd(() => {
      runOnJS(setIsResizing)(false);
      runOnJS(saveGridDimensions)();
    });

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    width: gridWidth.value,
    height: gridHeight.value,
    transform: [
      { translateX: gridX.value },
      { translateY: gridY.value },
    ],
  }));

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

  if (isLetterboardLayout) {
    return (
      <View style={[
        styles.container, 
        { height: keyboardHeight, flexDirection: "column" }, 
        styles.gridContainer,
        { backgroundColor: getLetterboardBgColor() }
      ]}>
        <View style={[styles.keysContainer, styles.gridKeysContainer, { flex: 1 }]}>
          {layout.map((row, rowIndex) => {
            return (
              <View key={rowIndex} style={[
                styles.row, 
                { marginVertical: 0 },
                rowIndex === layout.length - 1 ? styles.gridRowRight : styles.gridRow
              ]}>
                {row.map((key, keyIndexInRow) => {
                  const currentIndex = keyIndex++;
                  const isSpecial = Object.values(SPECIAL_KEYS).includes(key);
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
                      pushToRight={false}
                      isLetterboard={true}
                      letterboardBgColor={getLetterboardBgColor()}
                      letterboardTextColor={getLetterboardTextColor()}
                    />
                  );
                })}
              </View>
            );
          })}
        </View>
          <KeySizeModal
          visible={sizeModalVisible}
          onClose={() => setSizeModalVisible(false)}
          currentSize={selectedKeyForSize ? getKeySize(keyboardLayout, selectedKeyForSize) : "medium"}
          keyLabel={selectedKeyForSize || ""}
          onSelectSize={(size: KeySize) => {
            if (selectedKeyForSize) {
              setKeySize(keyboardLayout, selectedKeyForSize, size);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setSizeModalVisible(false);
          }}
        />
      </View>
    );
  }

  if (isGridLayout) {
    const currentGridWidth = gridDimensions?.width ?? width * 0.9;
    const currentGridHeight = gridDimensions?.height ?? height * 0.75;
    const dynamicKeyWidth = currentGridWidth / 6;
    const dynamicKeyHeight = currentGridHeight / rowSizes.length;

    return (
      <View style={styles.resizableContainer}>
        <GestureDetector gesture={dragGesture}>
          <Animated.View style={[styles.resizableGrid, gridAnimatedStyle, { backgroundColor: getButtonColor() }]}>
            <View style={[styles.keysContainer, styles.gridKeysContainer]}>
              {layout.map((row, rowIndex) => (
                <View key={rowIndex} style={[styles.row, styles.gridRow]}>
                  {row.map((key, keyIndexInRow) => {
                    const currentIndex = keyIndex++;
                    const isSpecial = Object.values(SPECIAL_KEYS).includes(key);
                    return (
                      <Pressable
                        key={`${key}-${currentIndex}`}
                        onPress={() => handleKeyAction(key)}
                        style={[
                          styles.gridKey,
                          {
                            width: dynamicKeyWidth,
                            height: dynamicKeyHeight,
                            backgroundColor: isSpecial ? theme.specialKey : getButtonColor(),
                            borderColor: "#000000",
                          },
                        ]}
                      >
                        <Text style={[styles.gridKeyText, { color: getButtonTextColor() }]}>
                          {key === SPECIAL_KEYS.SPACE ? "SPACE" : key === SPECIAL_KEYS.ENTER ? "ENTER" : key === SPECIAL_KEYS.DELETE ? "DEL" : key}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
            <GestureDetector gesture={resizeGesture}>
              <View style={styles.resizeHandle}>
                <Feather name="maximize-2" size={16} color={theme.tabIconDefault} />
              </View>
            </GestureDetector>
          </Animated.View>
        </GestureDetector>
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

  return (
    <View style={[styles.container, styles.gridContainer]}>
      <View style={[styles.keysContainer]}>
        {layout.map((row, rowIndex) => (
          <View key={rowIndex} style={[styles.row]}>
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
                  isLetterboard={isLetterboardLayout}
                  letterboardBgColor={getLetterboardBgColor()}
                  letterboardTextColor={getLetterboardTextColor()}
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
    flex: 1,
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  gridContainer: {
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  resizableContainer: {
    flex: 1,
    position: "relative",
  },
  resizableGrid: {
    position: "absolute",
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.2)",
  },
  resizeHandle: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  gridKey: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
  },
  gridKeyText: {
    fontSize: 14,
    fontWeight: "600",
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
    justifyContent: "space-evenly",
    zIndex: 1,
  },
  gridKeysContainer: {
    justifyContent: "flex-start",
    paddingTop: 0,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch",
    flex: 1,
  },
  gridRow: {
    justifyContent: "flex-start",
    width: "100%",
  },
  gridRowRight: {
    justifyContent: "flex-start",
    width: "100%",
  },
  draggableKey: {
    minWidth: 32,
    flex: 1,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
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
  letterboardBottomBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 20,
    gap: Spacing.lg,
  },
  letterboardBottomButton: {
    padding: 4,
  },
});
