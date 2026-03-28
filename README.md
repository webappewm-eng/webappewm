# Engineer With Me - Next.js + Firebase Blog

This project now fully replaces the old static templates with a Next.js + Firebase architecture.

## Current status

- Legacy static files `homepage.html` and `postpage.html` have been removed.
- Dependencies installed (`node_modules` + `package-lock.json` created).
- Production build passes successfully.

## Implemented from your requirements

- Homepage and post page converted to Next.js routes.
- Maintained the same visual direction (brand orange, typography style, layout sections).
- Header includes logo, navigation, and search.
- Hero includes video slider and image slider.
- Categories and subtopics are data-driven (from Firebase collections or local fallback).
- User flow:
  - select category
  - browse subtopics
  - open post
  - read only first 20% without login
  - login popup appears at preview limit
  - full content unlocks after login
- Users cannot create posts.
- Users can submit feedback on posts.
- Admin-only CMS supports create/update/delete:
  - categories
  - subtopics
  - posts (with SEO fields)
  - custom pages (Terms, Privacy, any page)
- Post-wise feedback visible in admin.
- Topic and website subscriptions enabled.
- Notification workflow (admin can publish update messages).
- Third-party script management from admin.
- Analytics and live-user dashboard:
  - active users
  - post views
  - downloads
  - feedback count
  - live tracking enable/disable
- PWA manifest and service worker starter included.
- Live HTML/CSS/JS post editor intentionally removed (per your instruction).

## Routes

- `/` home page
- `/post/[slug]` post detail with 20% gate
- `/admin` admin CMS + analytics + notifications + subscriptions
- `/pages/[slug]` custom public pages

## Firebase collections expected

- `categories`
- `subtopics`
- `posts`
- `feedback`
- `subscriptions`
- `custom_pages`
- `third_party_scripts`
- `notifications`
- `analytics_events`
- `live_presence`
- `site_settings`

## Security

- `firestore.rules` includes admin-only content management and authenticated feedback submission.
- Mark admin accounts with Firebase custom claim: `admin: true`.

## Env setup

Copy `.env.example` to `.env.local` and fill values:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_ADMIN_EMAILS=admin1@example.com,admin2@example.com`

## Run

```bash
npm run dev
```

If Firebase env is not set, the app uses local mock data so frontend work stays unblocked.
