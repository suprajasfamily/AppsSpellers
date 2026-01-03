# TypeBuddy

## Overview

TypeBuddy is a React Native/Expo mobile application designed to help kids learn typing. It provides a kid-friendly typing interface with customizable keyboards (ABC alphabetical or QWERTY layouts), word suggestions, and a calculator mode. The app is a single-user utility without authentication, focusing on accessibility and ease of use for young learners.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with native stack navigator (stack-based, not tab-based)
- **State Management**: React Context for preferences (PreferencesContext) + TanStack React Query for server state
- **Styling**: StyleSheet-based with a custom theme system supporting light/dark modes
- **Animations**: React Native Reanimated for smooth micro-interactions
- **Storage**: AsyncStorage for persisting user preferences locally

### Screen Structure
1. **TypingScreen** (main screen) - Primary typing interface with keyboard, word suggestions, and calculator mode toggle
2. **SettingsScreen** (modal) - User preferences including avatar, display name, keyboard layout, and size settings

### Key Design Patterns
- **Custom Keyboard**: Two layouts available (ABC alphabetical for beginners, QWERTY for advanced users)
- **Word Suggestions**: Context-aware suggestions using bigram patterns and a kid-friendly word dictionary
- **Calculator Mode**: Expression evaluator supporting basic and scientific operations
- **Haptic Feedback**: Uses expo-haptics for tactile responses on key presses

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Current Storage**: In-memory storage (MemStorage class) as placeholder
- **API Pattern**: RESTful endpoints prefixed with `/api`

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

## External Dependencies

### Core Services
- **Database**: PostgreSQL via Drizzle ORM (schema defined in `shared/schema.ts`)
- **Build System**: Expo with custom build scripts for web deployment

### Key Libraries
- **expo-haptics**: Tactile feedback for keyboard interactions
- **@react-native-async-storage/async-storage**: Local preference persistence
- **react-native-keyboard-controller**: Keyboard-aware scroll views
- **react-native-reanimated**: Animation system for UI interactions
- **react-native-gesture-handler**: Touch gesture handling

### Development Tools
- **TypeScript**: Strict mode enabled
- **ESLint**: Expo configuration with Prettier integration
- **Drizzle Kit**: Database migration tooling