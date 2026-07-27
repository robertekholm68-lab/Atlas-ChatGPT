# ASKR Android Alpha

This branch packages the existing Vite application as an installable Android app with Capacitor.

## Build locally

Requirements:

- Node.js 22+
- Android Studio with Android SDK
- Java 21

Run:

```bash
npm install
npm run android:add
npm run android:apk:debug
```

The APK is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Build with GitHub Actions

1. Open the repository's **Actions** tab.
2. Select **Build ASKR Android APK**.
3. Choose **Run workflow**.
4. When the workflow is complete, download the artifact named `ASKR-1.0.0-alpha.1-android`.
5. Unzip it and send `ASKR-1.0.0-alpha.1.apk` to the tester.

## Install on a test phone

1. Download the APK on the Android phone.
2. Open the file.
3. Android may ask for permission to install apps from the browser or file manager. Allow it for that source.
4. Install ASKR.

This first Alpha package is a debug-signed APK intended only for controlled external testing. A production release must use a protected release signing key and should normally be distributed through Google Play Internal Testing.

## App identity

- App name: ASKR
- Android application ID: `se.askr.app`
- Version: `1.0.0-alpha.1`

## Icon and splash assets

Capacitor uses the native Android project resources. Add final source assets before the public Alpha build:

```text
assets/icon-only.png      1024 × 1024 px
assets/icon-foreground.png 1024 × 1024 px, transparent
assets/icon-background.png 1024 × 1024 px
assets/splash.png          2732 × 2732 px
assets/splash-dark.png     2732 × 2732 px
```

Then run:

```bash
npx capacitor-assets generate --android
npx cap sync android
```

Do not commit signing passwords or keystore files to the repository.
