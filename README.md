# Kalkulator Toko

A mobile-first calculator app for small shop transactions, built with React + Capacitor and packaged as an Android APK.

## Features

- **Calculator** — expression-based input (supports `+`, `-`, `×`, `÷`, parentheses, decimals) with a session history you can tap to restore
- **Customer management** — assign a customer to each transaction; create new customers inline without leaving the flow
- **Transaction history** — paginated list with date range filter and a 3-state customer filter (All / Walk-in only / By customer); inline edit and delete
- **Thermal printer** — Bluetooth ESC/POS receipt printing with auto-retry on connection failure; configurable header, footer, paper width (58/80 mm), and currency format
- **Data backup** — export all customers and transactions to a JSON file; import with Merge (additive) or Replace all mode, with automatic name-based customer deduplication
- **Export reports** — CSV and PDF export of filtered transaction history
- **i18n** — Indonesian and English UI
- **Theming** — dark, light, and system-follow themes

## Stack

| Layer | Tech |
|---|---|
| UI | React 19 + TypeScript + Tailwind CSS v4 |
| Build | Vite |
| Mobile | Capacitor 8 (Android) |
| Database | SQLite via `@capacitor-community/sqlite` |
| Printer | `capacitor-thermal-printer` (ESC/POS) |

## Dependencies

**Runtime**

| Package | Purpose |
|---|---|
| `react` / `react-dom` | UI framework |
| `react-router-dom` | Client-side routing |
| `@capacitor/core` / `@capacitor/android` | Capacitor runtime |
| `@capacitor-community/sqlite` | SQLite on Android; `jeep-sqlite` for web fallback |
| `@capacitor/filesystem` + `@capacitor/share` | File I/O and share sheet for export/backup |
| `capacitor-thermal-printer` | Bluetooth ESC/POS printer |
| `lucide-react` | Icons |
| `mathjs` | Expression evaluation |
| `jspdf` + `jspdf-autotable` | PDF export |

**Dev**

| Package | Purpose |
|---|---|
| `vite` + `@vitejs/plugin-react` | Dev server and bundler |
| `typescript` + `typescript-eslint` | Type checking and linting |
| `tailwindcss` + `@tailwindcss/vite` | Utility CSS |
| `@capacitor/cli` | Capacitor build tooling |

## Download

Pre-built signed APKs are available on the [Releases](../../releases) page.

## Requirements

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | |
| JDK | 21 | JDK 22+ is incompatible with Gradle — use exactly 21 |
| Android SDK | API 36 | `compileSdkVersion` / `targetSdkVersion` |
| Android SDK min | API 24 | `minSdkVersion` (Android 7.0) |
| Android Build Tools | 8.13.0 | via Gradle plugin `com.android.tools.build:gradle` |

Set `JAVA_HOME` to your JDK 21 installation before running Gradle, e.g.:
```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
```

## Development

```bash
npm install
npm run dev          # web dev server
```

### Build Android APK

```bash
npm run build
npx cap sync android
cd android && JAVA_HOME=/usr/lib/jvm/java-21-openjdk ./gradlew assembleRelease
```

The signed APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

Signing requires `android/keystore.properties` (not committed):

```
storeFile=shop-calculator.jks
storePassword=<password>
keyAlias=shop-calculator
keyPassword=<password>
```
