# Meta SDK – Where Things Are & What to Ask the Client

## 1. Where the SDK name and permission are

### App name and permission text (iOS) – in **`app.json`**

Inside the **`react-native-fbsdk-next`** plugin block (around lines 47–59):

| What | Where in `app.json` | Current value |
|------|---------------------|---------------|
| **App display name** (shown to Meta) | `plugins` → `react-native-fbsdk-next` → **`displayName`** | `"Renew Alert"` |
| **iOS tracking permission text** (the popup users see) | same block → **`iosUserTrackingPermission`** | `"This identifier will be used to deliver personalized ads and measure ad performance for the Renew Alert app."` |

You can change `displayName` or the permission sentence there if the client wants different wording.

### SDK initialization and permission request – in **`app/_layout.tsx`**

- **Lines 35–46:** Meta SDK is initialized and (on iOS) the app requests the tracking permission:
  - `Settings.initializeSDK()` – starts the Meta SDK.
  - `Tracking.requestTrackingPermissionsAsync()` – shows the iOS “Allow tracking?” dialog (uses the text from `iosUserTrackingPermission` above).
  - `Settings.setAdvertiserTrackingEnabled(true)` – only if the user taps “Allow”.

So: **name/permission text** = `app.json` plugin; **actually asking for permission** = `app/_layout.tsx`.

---

## 2. Where the IDs are placed

All of these are in **`app.json`**, in the same **`react-native-fbsdk-next`** plugin block:

| ID / setting | Key in `app.json` | Current value |
|--------------|-------------------|---------------|
| **Meta (Facebook) App ID** | **`appID`** | `"917327644166678"` |
| **URL scheme** (for Meta to open the app) | **`scheme`** | `"fb917327644166678"` (must be `fb` + App ID) |
| **Client token** (from Meta; you must replace) | **`clientToken`** | `"REPLACE_WITH_CLIENT_TOKEN"` |

**SKAdNetwork IDs** (for ad attribution) are in **`app.json`** under **`ios`** → **`infoPlist`** → **`SKAdNetworkItems`** (lines 22–26). Those are fixed Meta values; no need to change them unless Meta tells you to.

---

## 3. What you need from the client – only the **Client Token**

You already have from the client (or their brief):

- **Meta App ID:** `917327644166678` (already in `app.json`).
- **App name:** Renew Alert (already in `app.json` as `displayName`).

The only thing you still need from the client is the **Client Token**.

---

## 4. What you can tell the client – how to create and give you the Client Token

You can send them something like this (copy and adjust if needed):

---

**Subject: One value needed for Meta (Facebook) ads in the app**

Hi,

To finish the Meta (Facebook) SDK setup so you can run App Promotion campaigns for the Renew Alert iOS app, we need one value from your Meta app settings:

**Client Token**

**How to get it:**

1. Go to **Meta for Developers**: https://developers.facebook.com/
2. Log in and open the app **“Renew Alert”** (App ID: **917327644166678**).
3. In the left sidebar, go to **Settings** → **Basic** (or **Settings** → **Advanced**).
4. Find the field **“Client token”**.
   - If you don’t see it: go to **Settings** → **Advanced** and look for **“Client token”** there.
5. Copy the **Client token** (a long string of letters and numbers).
6. Send it to us (e.g. in a secure message or password manager share). We will add it only in the app config and use it so Meta can receive app events for your ad campaigns.

**Screenshot path (for reference):**  
Meta for Developers → Your App → **Settings** → **Advanced** → **Client token**

Once we have this, we’ll plug it into the app and you can build the next iOS version. After that, you can check in Meta Events Manager that events are received and in Ads Manager that the app is selectable for campaigns.

Thanks,  
[Your name]

---

## 5. Where you put the Client Token once you have it

**File:** `app.json`  
**Place:** In the **`react-native-fbsdk-next`** plugin config, replace the placeholder:

- **Current:** `"clientToken": "REPLACE_WITH_CLIENT_TOKEN"`
- **Change to:** `"clientToken": "THE_EXACT_TOKEN_THE_CLIENT_SENT"`

Example (with a fake token):

```json
"clientToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
```

Save the file, then create a new iOS build. Do **not** commit the real Client Token to a public repo; use a private repo or environment/config that isn’t committed.

---

## 6. Quick reference – all Meta-related places

| What | File | Location |
|------|------|----------|
| App ID, display name, scheme, client token, permission text | `app.json` | `expo.plugins` → `["react-native-fbsdk-next", { ... }]` |
| SKAdNetwork IDs | `app.json` | `expo.ios.infoPlist.SKAdNetworkItems` |
| Initialize SDK + request tracking permission | `app/_layout.tsx` | Inside `prepare()` in the first `useEffect` |
