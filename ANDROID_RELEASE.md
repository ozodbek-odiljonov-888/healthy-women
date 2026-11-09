# Healthy Women — Android signed APK workflow

**The signed release workflow is prepared but not activated.** It needs your own private signing key. Do not send the key, password, or base64 text into a chat.

Android APKs can normally be updated without uninstalling only if the application ID, signing certificate, and versionCode requirements match. Previous debug APKs used different ephemeral runner keys; they **cannot** be updated in place with the new release-signed APK. Export and verify an encrypted `.hwbak` backup before uninstalling an old test version.

## Generate a private signing key on your own computer (Windows PowerShell)

```powershell
keytool -genkeypair -v -keystore "healthy-women-release.jks" -alias "healthy-women" -keyalg RSA -keysize 3072 -validity 12000 -dname "CN=Healthy Women, OU=Software, O=Healthy Women, C=UZ"
```

Select a strong password interactively. Keep at least two secure backups of the keystore in locations you control, not in the repository.

To copy the keystore into the clipboard as base64:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path ".\healthy-women-release.jks"))) | Set-Clipboard
```

Before setting these credentials, create GitHub repository → **Settings → Environments → New environment → `android-release`**. Add the following as **Environment secrets** (not source files or chat messages). The separate `android-signing` environment and signed-test workflow use a different **test-only** keystore. Add:

| Secret | Value |
|---|---|
| `HEALTHY_WOMEN_ANDROID_KEYSTORE_B64` | Base64 keystore text, then clear the clipboard |
| `HEALTHY_WOMEN_ANDROID_STORE_PASSWORD` | Keystore password |
| `HEALTHY_WOMEN_ANDROID_KEY_ALIAS` | `healthy-women` |
| `HEALTHY_WOMEN_ANDROID_KEY_PASSWORD` | Private key password |

To build, open Actions → **Build Healthy Women signed Android release** → Run workflow. Choose the first versionCode `100`, versionName `1.0.0`. Future signed versions MUST use the same keystore and a **larger** versionCode (for example `101`). Download the `Healthy-Women-SIGNED-Android-release` artifact after success; it includes a signed APK and its SHA-256 checksum.

The workflow is manual-only: routine GitHub pushes do not run it. When secrets are missing it fails before creating an Android project. No store account or paid services are enabled.

**Limitations:** The workflow and its Gradle signing configuration need a first real execution and device validation; they have not yet produced a release-signed APK. Never lose the signing key. Release signing does not establish clinical safety or privacy compliance.

## Android privacy and test signing

Normal Android debug builds now run `node scripts/harden-android.mjs` after Capacitor generates the project. This disables Android Auto Backup, adds exclusions for cloud/device-transfer backups, refuses cleartext traffic, and uses the native `FLAG_SECURE` window flag against screenshots/recent-app thumbnails. These are defense-in-depth mitigations, not guarantees against all device vendors or malware.

There is also a distinct manual workflow **Build Healthy Women signed test APK (manual)** with GitHub Environment `android-signing` and four secret names: `HW_KEYSTORE_BASE64`, `HW_STORE_PASSWORD`, `HW_KEY_ALIAS`, `HW_KEY_PASSWORD`. Use a **separate test key** from any future production release key. It advances the Android versionCode automatically and verifies the signed APK. Neither signing workflow runs on normal commits. Do not enable signed production distribution until Android device tests, clinical review and privacy assessment are complete.

**Compatibility:** Old debug APKs have ephemeral signing certificates, so neither test signing nor release signing can update them in place. Export and verify a `.hwbak` recovery file before uninstalling. Retain copies of keystores privately. Do not send passwords or keystore data into a chat.
