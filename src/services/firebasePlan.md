# Firebase Migration Plan

Implemented:
1. Install package: `firebase`
2. Initialize Firebase app/auth/firestore in `src/lib/firebase.js`
3. Auth state wired in `src/providers/AuthProvider.jsx`
4. Firestore service layer:
   - `src/services/scheduleService.js`
   - `src/services/applicationService.js`
   - `src/services/userService.js`
5. Security artifacts:
   - `firestore.rules`
   - `firestore.indexes.json`

Next:
1. Deploy rules/indexes with Firebase CLI
2. Replace prototype local state actions with service calls
3. Add admin UI for role management in `users` collection
