# Meta (Facebook) Ads – Client Brief Summary

## What the client is saying

- **Goal:** Run **Meta (Facebook/Instagram) App Promotion** campaigns for the **Renew Alert iOS app**. Right now the app appears in Ads Manager but is **greyed out** and cannot be selected.
- **Reason:** Meta shows: *"Your app can't use Aggregated Event Measurement because conversion data is missing or partial. Usually, the easiest solution is to set up the Facebook SDK for iOS."*  
  So Meta is **not receiving any app events** (e.g. install/activation) from the iOS app. Until the app sends events (and optionally SKAdNetwork is set up), Ads Manager will keep the app greyed out.
- **What’s already done (client/Meta side):**
  - Meta Developer app created and published (App ID: **917327644166678**).
  - iOS platform added with Bundle ID **com.beingahmadowais.renewalert** and App Store ID **6757075671**.
  - Ad account and business linkage done; app still greyed out in Ads Manager.

## What “done” means (acceptance criteria)

1. In **Ads Manager**, the Renew Alert iOS app is **selectable** (not greyed out) for App Promotion campaigns.
2. **Meta Events Manager** shows **recent app events** from a real device (at least activation).
3. A test App Promotion campaign can be created and does not block publishing.
4. **SKAdNetwork** is configured for iOS 14+ attribution.

## Framework (for client / Meta)

- **App:** **Expo (React Native)**  
  - No native Swift project in repo; config via **app.json** and **config plugins**.  
  - Builds: **development builds** (e.g. EAS) or **prebuild**; **Expo Go is not supported** for this SDK.

## Developer tasks (what we implement)

| Task | Status | Notes |
|------|--------|--------|
| **A. Meta SDK for iOS** | ✅ Implemented | `react-native-fbsdk-next` added; App ID **917327644166678**, Display Name **Renew Alert**; SDK initialized on app launch; **autoLogAppEventsEnabled** so Meta receives activation and other events. |
| **B. SKAdNetwork** | ✅ Implemented | Meta’s SKAdNetwork identifiers added in **app.json** under `ios.infoPlist.SKAdNetworkItems` so Meta can use SKAdNetwork for attribution. |
| **C. Events Manager check** | ⏳ Client / you | After shipping a build: install on a **real iPhone**, open the app, then in **Meta Events Manager** confirm that events (e.g. activation) appear for the app. |
| **D. Ads Manager check** | ⏳ Client / you | After events are flowing, confirm in **Ads Manager** that the app is **no longer greyed out** and can be selected for App Promotion. |
| **E. Deep links (optional)** | 🔲 Later | Can add later for better install-to-open and reporting. |
| **F. Privacy / compliance** | ⏳ Client / you | Confirm App Store privacy text and data deletion URL match what’s in the Meta app settings. |

## What the client needs to provide

1. **Client token** (required by the Meta SDK plugin)  
   - From: [Meta for Developers](https://developers.facebook.com/) → Your App (**917327644166678**) → **Settings** → **Advanced** → **Client token**.  
   - In this repo: open **`app.json`** and replace `"REPLACE_WITH_CLIENT_TOKEN"` (inside the `react-native-fbsdk-next` plugin config) with the real Client token.  
   - **Do this before creating a new iOS build**, or the SDK may not work correctly.

## After implementation (deliverables you can send)

- **Framework:** Expo (React Native).
- **Checklist:**
  - [x] Meta SDK installed and initialized (with App ID and display name).
  - [x] SKAdNetwork identifiers configured in iOS config.
  - [ ] Events Manager showing events (after you/client test on device).
  - [ ] Ads Manager app selection confirmed (after events are visible).
- **Screenshots:** Events Manager (events received) and Ads Manager (app selectable), once both work.
- **App Store:** If this goes out in a new build, share version number and short “What’s new” (e.g. “Meta SDK and SKAdNetwork added for app install campaigns and attribution”).

## One sentence for the client

Meta is greyed out because the app doesn’t send any events to Meta yet; we’ve added the **Meta SDK** and **SKAdNetwork** so the app can send activation (and other) events and support attribution—after you add the **Client token** and ship a new build, the next step is to confirm events in Events Manager and then that the app is selectable in Ads Manager.
