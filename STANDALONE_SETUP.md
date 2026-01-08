# Letterboard SpellerBuddy - Standalone Setup Guide

This guide explains how to run and publish this app independently without Replit.

## Prerequisites

1. **Node.js 18+** - Download from [nodejs.org](https://nodejs.org)
2. **Git** - Download from [git-scm.com](https://git-scm.com)
3. **Expo CLI** - Install globally: `npm install -g expo-cli`
4. **EAS CLI** - Install globally: `npm install -g eas-cli`

## Developer Accounts (Required for App Store Publishing)

- **Apple Developer Account**: $99/year at [developer.apple.com](https://developer.apple.com)
- **Google Play Developer Account**: $25 one-time at [play.google.com/console](https://play.google.com/console)

## Quick Start (Local Development)

```bash
# 1. Navigate to project folder
cd letterboard-spellerbuddy

# 2. Install dependencies
npm install

# 3. Start the development server
npx expo start
```

Scan the QR code with Expo Go app on your phone to test.

## Project Structure

```
letterboard-spellerbuddy/
├── client/                 # React Native app code
│   ├── components/         # UI components (keyboard, calculator, etc.)
│   ├── screens/            # App screens
│   ├── contexts/           # React contexts (preferences)
│   ├── constants/          # Theme and constants
│   └── lib/                # Utilities
├── server/                 # Express backend (optional for standalone)
├── shared/                 # Shared types
├── assets/                 # Images and icons
├── app.json                # Expo configuration
└── package.json            # Dependencies
```

## Publishing to App Stores

### Step 1: Login to Expo (EAS)

```bash
npx eas login
```

### Step 2: Configure EAS Build

```bash
npx eas build:configure
```

This creates `eas.json` with build profiles.

### Step 3: Build for iOS (App Store)

```bash
# Development build (for testing)
npx eas build --platform ios --profile development

# Production build (for App Store submission)
npx eas build --platform ios --profile production
```

You'll need to:
- Login with your Apple Developer account
- The bundle identifier is: `com.letterboard.spellerbuddy`

### Step 4: Build for Android (Google Play)

```bash
# Development build
npx eas build --platform android --profile development

# Production build (for Google Play)
npx eas build --platform android --profile production
```

### Step 5: Submit to App Stores

```bash
# Submit to Apple App Store
npx eas submit --platform ios

# Submit to Google Play Store
npx eas submit --platform android
```

## App Store Listing Information

**App Name**: Letterboard SpellerBuddy

**Bundle ID (iOS)**: com.letterboard.spellerbuddy

**Package Name (Android)**: com.letterboard.spellerbuddy

**Category**: Education / Kids

**Suggested Description**:
> Letterboard SpellerBuddy is a fun, kid-friendly typing assistant designed to help children learn spelling and typing. Features customizable keyboards (ABC, QWERTY, Grid), word suggestions, text-to-speech, and a built-in calculator.

## Removing Server Dependency (Optional)

This app can run fully offline. The server is only used for optional cloud features. To run without the server:

1. The app already stores preferences locally using AsyncStorage
2. Google Drive integration requires the server for OAuth

## Environment Variables

For local development, create a `.env` file if needed:

```
# Only needed if using Google Drive sync
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

## Troubleshooting

**Build fails on iOS:**
- Ensure your Apple Developer account is active
- Check that bundle identifier matches in app.json

**Build fails on Android:**
- Make sure package name is valid (no spaces, lowercase)
- Check Android SDK is properly configured

**Expo Go won't connect:**
- Ensure phone and computer are on same network
- Try `npx expo start --tunnel` for network issues

## Support

For Expo/EAS issues: [docs.expo.dev](https://docs.expo.dev)
For React Native issues: [reactnative.dev](https://reactnative.dev)
