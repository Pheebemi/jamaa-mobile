# Jamaa Mobile

> Offline-First AI Case Management & Emergency Response Platform for West Africa
> Built for field officers, schools, clinics, and NGOs operating in low-connectivity environments.

---

## What is Jamaa?

**Jamaa** — meaning *people* or *community* in Hausa — is an open-source mobile application that enables humanitarian field workers to document, track, and respond to community cases — even without internet access.

Millions of vulnerable children fall through the cracks of fragile support systems not because help doesn't exist, but because the information infrastructure to find them, track them, and respond fast enough simply isn't there. Paper records get lost. Emergency alerts arrive too late. Clinics lose patient histories when the internet goes down.

**Jamaa solves this.**

---

## Core Features

### Offline-First Architecture
Every action — creating cases, adding notes, changing status — happens instantly on the device. Data is stored locally in SQLite and synced to the server when connectivity is available. A field officer in a remote village with no signal can work uninterrupted for days.

### AI-Powered Case Analysis
Cases are automatically analyzed by Google Gemini AI after syncing. Each case receives:
- Plain-English summary
- Risk category classification
- Urgency score (1–10)
- Suggested action for the field officer

### Emergency Alert System
Org admins broadcast real-time emergency alerts to all field officers simultaneously — cholera outbreaks, missing children, flood warnings. Alerts are stored locally so officers see them even offline.

### Role-Based Access Control
Five roles with strict permissions — `super_admin`, `org_admin`, `field_officer`, `school_staff`, `clinic_staff`. Sensitive cases are protected with biometric authentication. Every access is audit-logged.

### Organisational Data Isolation
Each organisation's data is completely isolated. A field officer from NGO A can never see NGO B's cases — enforced at the API level on every request.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Framework | Expo SDK 54 + React Native 0.81 |
| Navigation | Expo Router (file-based) |
| Local Database | expo-sqlite v16 (SQLite) |
| State Management | Zustand |
| API Client | Axios with JWT interceptor |
| UI Styling | NativeWind (TailwindCSS for React Native) |
| Forms | React Hook Form + Zod |
| Network Detection | @react-native-community/netinfo |
| Secure Storage | expo-secure-store |
| Icons | @expo/vector-icons (Ionicons) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Expo Go app on your phone (iOS or Android)

### Installation

```bash
git clone https://github.com/Pheebemi/jamaa-mobile.git
cd jamaa-mobile
pnpm install
```

### Environment Setup

Create a `.env` file in the root:

```
EXPO_PUBLIC_API_URL=https://jamaa.pythonanywhere.com/api
```

For local development, replace with your local Django server IP:
```
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api
```

### Database Setup

```bash
pnpm run db:generate
```

### Run the App

```bash
pnpm start
```

Scan the QR code with Expo Go on your phone.

---

## Project Structure

```
mobile/
├── app/
│   ├── _layout.tsx              # Root layout — auth guard, DB migrations
│   ├── (auth)/
│   │   └── login.tsx            # Login screen
│   └── (app)/
│       ├── _layout.tsx          # Tab navigator + Upload/Download buttons
│       ├── index.tsx            # Dashboard — stats, pending sync indicator
│       ├── cases/
│       │   ├── index.tsx        # Case list with search and filters
│       │   ├── new.tsx          # New case form
│       │   └── [id].tsx         # Case detail — notes, AI insights, status
│       ├── alerts.tsx           # Emergency alerts
│       └── profile.tsx          # User profile, sync stats, data reset
├── src/
│   ├── db/
│   │   ├── schema.ts            # Drizzle ORM schema
│   │   └── index.ts             # SQLite connection
│   ├── sync/
│   │   ├── syncEngine.ts        # Push/pull sync logic
│   │   └── useSyncStore.ts      # Sync state (Zustand)
│   ├── stores/
│   │   ├── authStore.ts         # Auth + offline grace period
│   │   └── caseStore.ts         # Case CRUD → SQLite
│   ├── hooks/
│   │   ├── useNetworkStatus.ts  # Real-time online/offline detection
│   │   └── useSync.ts           # Upload/download triggers
│   └── components/
│       ├── SyncButton.tsx       # Upload + Download buttons in header
│       ├── OfflineBanner.tsx    # Amber banner when offline
│       ├── CaseCard.tsx         # Case list item
│       ├── PriorityBadge.tsx    # Priority indicator
│       └── AIInsightCard.tsx    # AI analysis display
```

---

## Sync Architecture

```
Mobile SQLite  ──[UPLOAD]──▶  Django /sync/push/
                                  ↓ AI analysis (background)
Mobile SQLite  ◀──[DOWNLOAD]── Django /sync/pull/
```

- **Upload** is manual — triggered by the user tapping the upload button
- **Download** runs automatically 5 seconds after a successful upload
- Conflicts are detected by comparing `updated_at` timestamps
- The `server_id` field links local records to their server counterparts

---

## Offline Authentication

If a device is offline and the user has previously logged in, they are granted access using the cached session. A field officer in a remote village with no signal is never locked out of their case data.

- Tokens are stored in `expo-secure-store` — never in AsyncStorage
- Cached user profile is used during offline sessions
- When connectivity returns, tokens are silently refreshed

---

## User Roles

| Role | Create Cases | View Sensitive | Broadcast Alerts | Dashboard |
|---|---|---|---|---|
| `super_admin` | ✅ | ✅ | ✅ | ✅ |
| `org_admin` | ✅ | ✅ | ✅ | ✅ |
| `field_officer` | ✅ | Only if assigned | ❌ | ❌ |
| `school_staff` | ✅ | ❌ | ❌ | ❌ |
| `clinic_staff` | ✅ | ❌ | ❌ | ❌ |

---

## Pilot Targets

- **Countries:** Nigeria, Ghana, Senegal
- **Organisations:** 15 NGOs, schools, and clinics
- **Users:** 200+ active field officers
- **Beneficiaries:** 50,000 community members tracked

---

## UNICEF Focus Area Alignment

| Focus Area | Jamaa Feature |
|---|---|
| Early Warning Systems | AI urgency scoring + emergency alert broadcast |
| Health Care Readiness | Clinic case tracking with offline continuity |
| Point-of-Care Support | Zero-connectivity data entry with auto-sync |
| Strategic Planning | Dashboard analytics for org leadership |

---

## License

MIT — Open source, free to deploy by any school, clinic, NGO, or government.

---

## Backend Repository

The Django REST API backend is available at:
**https://github.com/Pheebemi/jamaa-backend**

---

*Jamaa — Because every community deserves a system that works.*
