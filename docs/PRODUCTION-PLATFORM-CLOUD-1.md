# ASKR Production Platform & Cloud 1.0

## Summary
Sprint 11 adds the production foundation without redesigning Workout, Nutrition, Recovery, or AI Coach. The runtime now exposes a Cloud module that demonstrates authentication, profile fields, sync state, offline queue status, storage progress, settings, loading, empty, success, and error states.

## Database schema
The normalized Supabase/PostgreSQL schema lives in `docs/supabase/production-schema.sql`. It covers profiles, goals, programs, workouts, exercises, sessions, sets, recipes, meals, nutrition entries, recovery, muscle status, progress, achievements, coach memory, notifications, settings, and sync changes. Tables use user ownership, timestamps, foreign keys, unique constraints, and RLS preparation.

## Authentication architecture
`src/platform/services.js` centralizes Supabase Auth calls for email/password sign up, login, forgot password, reset password, persistent sessions, logout, and email verification handoff. OAuth buttons for Google, Apple, and GitHub are intentionally placeholders until provider credentials are configured in Supabase.

## Sync architecture
`src/platform/syncEngine.js` provides local-first queueing, conflict detection by timestamps, retry attempts, sync status persistence, online/offline listeners, last-sync timestamps, and background flushing. UI code listens to `atlas:sync-status` instead of polling service internals.

## Offline architecture
When `navigator.onLine` is false, service writes enqueue changes in `atlas-offline-queue-v1`. The queue supports workouts, meals, recovery, coach memory, profiles, goals, and notifications through provider-independent service methods.

## API architecture
UI components must call domain services, not Supabase tables directly. Services are separated into auth, profile, workout, nutrition, recovery, coach, goals, storage, and notifications. The Supabase client is isolated behind `src/platform/supabaseClient.js` so a future API gateway can replace it.

## Storage architecture
Supabase Storage support is centralized in `storageService`. Planned buckets: `profile-images`, `progress-photos`, `exercise-assets`, `exercise-videos`, `coach-attachments`, and `avatars`. Upload progress callbacks are part of the API contract.

## Security architecture
Protected access is represented through the Cloud module and service layer. The database schema defines `user`, `coach`, `admin`, and `team_owner` roles. RLS is enabled for profiles and documented for all user-owned tables using `auth.uid() = user_id` policies.

## Settings, notifications, export, and analytics
Settings sections cover Account, Units, Language, Notifications, Privacy, Coach, Theme, Connected Devices, Connected Apps, Export Data, and Delete Account. Notification and export architecture is schema-ready; analytics consent is stored in settings for GDPR-ready anonymous analytics.

## Remaining production tasks
1. Install and configure `@supabase/supabase-js` when Supabase project variables are available.
2. Apply and review RLS policies for every table before beta launch.
3. Create Storage buckets and signed URL policies.
4. Connect existing Workout, Nutrition, Recovery, and Coach save flows to the new domain services.
5. Add E2E tests against a Supabase staging project.
6. Configure OAuth credentials and redirect URLs.
7. Add hosted preview deployment and crash-reporting provider after consent review.

## Preview URL
No hosted preview URL is available from this local environment. Use `npm run dev` or `npm run preview` after build to review locally.

## Manual review checklist
- Sign up, sign in, forgot password, reset password, remember me, email verification, and logout.
- Verify protected Cloud module behavior with and without Supabase env vars.
- Toggle browser offline mode, create queued changes, restore network, and confirm sync state changes.
- Upload profile/progress image in staging bucket and verify progress state.
- Review all settings sections on desktop and mobile.
- Confirm no direct database calls are introduced in UI components.
- Confirm RLS policies block cross-user access.
- Confirm reduced-motion and keyboard navigation in auth and settings forms.
