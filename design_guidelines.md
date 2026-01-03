# Design Guidelines: Kids Typing Assistant

## Architecture Decisions

### Authentication
**No authentication required.** This is a single-user utility app focused on helping kids with typing.

**Profile/Settings Screen:**
- User-customizable avatar (generate 3 kid-friendly preset avatars: friendly robot, smiling sun, playful cat)
- Display name field (defaults to "Young Writer")
- Keyboard preferences (alphabetical/QWERTY default, keyboard size)
- Theme preferences (light/dark mode)

### Navigation
**Stack Navigation** - The app has one primary screen (typing interface) with settings accessible via a gear icon in the header.

**Screen Structure:**
1. Main Typing Screen (root)
2. Settings Screen (modal from header button)

## Screen Specifications

### Main Typing Screen
**Purpose:** Primary typing interface with word suggestions, customizable keyboard, and calculator mode.

**Layout:**
- **Header:** 
  - Transparent background
  - Right button: Settings gear icon
  - Left button: Clear text (trash icon) with confirmation alert
  - No title (maximize typing space)

- **Main Content:**
  - Non-scrollable root view
  - Segmented control at very top: "Keyboard" | "Calculator" modes
  - **Typing Area** (resizable via Settings):
    - White/light gray background with subtle border
    - Large, readable text (min 18pt for kids)
    - Auto-scrolls as text grows
    - Height options: Small (30% screen), Medium (40%), Large (50%)
  
  - **Word Suggestions Bar** (keyboard mode only):
    - Horizontal scrollable pill buttons above keyboard
    - Shows 5-7 suggested words based on typed text
    - Tapping inserts word + space
  
  - **Keyboard Area** (55-70% of screen):
    - Toggle button above keyboard: "ABC" ⇄ "QWERTY"
    - Size slider in Settings: Small | Medium | Large
    - Keys have rounded corners, subtle shadows
    - Active key: scale animation + haptic feedback
    - Space bar and backspace extra large

- **Calculator Mode:**
  - Replaces word suggestions with calculator display
  - Scientific calculator layout below
  - Symbols palette: +, -, ×, ÷, (, ), ^, √, sin, cos, tan, log, π, =

**Safe Area Insets:**
- Top: insets.top + Spacing.xl
- Bottom: insets.bottom + Spacing.xl

### Settings Screen
**Purpose:** Customize keyboard behavior and appearance.

**Layout:**
- **Header:**
  - Title: "Settings"
  - Left button: Back/Close
  - Standard navigation background

- **Main Content:**
  - Scrollable form layout
  - Sections:
    1. **Profile** (avatar picker, name input)
    2. **Keyboard Settings:**
       - Default layout: ABC / QWERTY toggle
       - Keyboard size: Slider (Small/Medium/Large)
       - Typing area size: Slider (Small/Medium/Large)
    3. **Appearance:** Theme toggle (Light/Dark)
    4. **About:** Version, privacy policy placeholder

**Safe Area Insets:**
- Top: Spacing.xl
- Bottom: insets.bottom + Spacing.xl

## Design System

### Color Palette
**Primary Colors (Kid-Friendly):**
- Primary: `#4A90E2` (Bright blue)
- Secondary: `#F5A623` (Warm orange)
- Success: `#7ED321` (Fresh green)
- Background Light: `#F8F9FA`
- Background Dark: `#1C1C1E`

**Keyboard Colors:**
- Key Background Light: `#FFFFFF`
- Key Border Light: `#E1E4E8`
- Key Text: `#2C3E50`
- Special Key (Space/Backspace): `#E8F4F8`

### Typography
- **Display Text (Typing Area):** System Font, 20-24pt, Regular/Medium
- **Word Suggestions:** System Font, 16pt, Medium
- **Keyboard Keys:** System Font Rounded, 18-22pt, Semibold
- **Calculator Display:** SF Mono / Monospace, 28pt

### Visual Design
**Keyboard Appearance:**
- Keys: White cards with 2pt border radius 8, 1pt gray borders
- Pressed state: Scale to 0.95, background to `#F0F0F0`
- Haptic feedback on all key presses
- Shadow for floating keyboards (iOS): shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.10, shadowRadius: 2

**Word Suggestion Pills:**
- Border radius: 16
- Padding: horizontal 16, vertical 8
- Background: `#E8F4F8`
- Border: 1pt `#4A90E2`
- Pressed state: Background `#4A90E2`, text white

**Icons:**
- Use Feather icons from @expo/vector-icons
- Settings: "settings"
- Clear: "trash-2"
- Calculator: "calculator"
- Keyboard switch: "type"

### Assets to Generate
1. **Avatar Set (3 kid-friendly illustrations):**
   - Friendly robot with antenna
   - Smiling sun with rays
   - Playful orange cat
   - Style: Flat, colorful, rounded shapes
   - Size: 120x120pt

### Accessibility
- Minimum touch target: 44x44pt (iOS) / 48x48dp (Android)
- High contrast mode support
- VoiceOver/TalkBack labels for all interactive elements
- Keyboard keys announce letter + "button"
- Dynamic Type support for typing area text
- Landscape orientation support for tablets

### Interaction Design
- **Keyboard Size Adjustment:** Live preview as slider moves
- **Mode Switching:** Smooth 200ms fade transition between keyboard/calculator
- **Text Insertion:** Word suggestions insert with subtle scale animation
- **Clear Action:** Confirmation alert: "Clear all text? This cannot be undone."