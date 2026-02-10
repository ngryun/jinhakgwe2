# CLAUDE.md

## Project Overview

Counselor Teacher Application System (상담교사신청) — a Korean-language React app where teachers browse and apply to counseling schedules at schools, and admins manage those schedules and view applications. Supports both Firebase (production) and demo mode (no Firebase).

## Tech Stack

- **React 19** with Vite 8 (beta) + `@vitejs/plugin-react` (Babel/Fast Refresh)
- **Firebase 12** — Auth (Google Sign-In), Firestore, Analytics
- **xlsx** (SheetJS) — Client-side Excel parsing/generation for student bulk upload
- **State management**: React Context API (`AuthProvider`) — no Redux/Zustand
- **Routing**: Custom implementation using `window.location` / `history` API — no React Router
- **Styling**: Inline styles with design tokens object (`t.*`), Pretendard font for Korean text
- **Linting**: ESLint 9 with React hooks and React Refresh plugins

## Commands

```bash
npm run dev       # Vite dev server with HMR
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint on .js/.jsx files
```

Firebase CLI (not in npm scripts):
```bash
firebase deploy              # Deploy Firestore rules/indexes
firebase emulators:start     # Local Firebase emulator
```

## Directory Structure

```
src/
├── config/appConfig.js          # Env var config, Firebase setup validation
├── lib/firebase.js              # Firebase init (auth, db, googleProvider)
├── providers/AuthProvider.jsx   # Auth context, session mgmt, role inference
├── hooks/useAuth.js             # Hook wrapper over AuthProvider context
├── routes/AppRouter.jsx         # Custom path-based router
├── services/
│   ├── userService.js           # User profile CRUD
│   ├── scheduleService.js       # Schedule CRUD
│   ├── applicationService.js    # Application/enrollment operations
│   ├── studentService.js        # Student CRUD + Excel import/export (per schedule)
│   └── mockData.js              # 5 sample schedules + mock students for demo mode
├── features/prototype/
│   └── PrototypeApp.jsx         # Main UI component (all views)
├── pages/ServiceHomePage.jsx    # Currently unused
├── App.jsx                      # Entry point (renders AppRouter)
├── main.jsx                     # React root with AuthProvider wrapper
└── index.css                    # Global styles + Pretendard font
```

## Architecture

### Authentication
- Firebase Google Sign-In via `signInWithPopup` (fallback to `signInWithRedirect` on iOS/mobile)
- Demo mode: sign in as "teacher" or "admin" with mock credentials
- Admin role detected by matching email against `VITE_ADMIN_EMAILS` config
- Session stored in localStorage (key: `app.session.v1`)

### Service Pattern
All services follow the same pattern:
1. Check `isFirebaseEnabled()`
2. If true → Firestore SDK calls
3. If false → In-memory Map/Array fallback
4. All functions are async, return normalized data shapes

### Firestore Collections
- **users** — `{ uid, email, name, school, phone, subject, role, createdAt, updatedAt }`
- **schedules** — `{ id, school, region, date, time, needed, waitlist, applied, createdAt, updatedAt }`
- **applications** — `{ id (scheduleId_teacherUid), scheduleId, teacherUid, teacherEmail, teacherName, status, createdAt }`
- **students** (subcollection of schedules) — `{ id, grade, classNum, number, name, gender, notes, createdAt }`

### Roles
- `'teacher'` — browse schedules, apply/cancel applications
- `'admin'` — create/manage schedules, view applications, manage users

## Code Conventions

- **Components**: PascalCase `.jsx` files, functional components only, hooks-based
- **Services/config**: camelCase `.js` files
- **Styling**: Inline style objects using design tokens (`t.accent`, `t.surface`, `t.bg`)
- **Icons**: `I.*` namespace object
- **Error messages**: Korean language, user-friendly, wrapped in try-catch
- **No TypeScript** — plain JavaScript with JSX

## Environment Variables

All prefixed with `VITE_` (Vite convention):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID          # "jinhakgwe"
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
VITE_USE_FIREBASE                  # true/false — toggles Firebase vs demo mode
VITE_ADMIN_EMAILS                  # Comma-separated admin email list
```

See `.env.example` for template.

## Firestore Security Rules Summary

- **users**: Read by self or admin; create by self; update by admin or self (limited fields)
- **schedules**: Read by authenticated; create/delete by admin; update by admin or any user (applied count only)
- **applications**: Read by authenticated; create by teacher (own uid); delete by teacher (own apps)
- **students** (subcollection of schedules): Read by authenticated; create/update/delete by admin only
