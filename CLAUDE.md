# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build to dist/
npm run lint         # ESLint check
npm run test         # Run Vitest once
npm run test:watch   # Watch mode
```

## Environment Variables

Copy `.env.example` to `.env`:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Supabase project credentials
- `VITE_PUBLIC_SITE_URL` — Production domain (used for OG/Twitter image URLs, defaults to https://keddmat.com)
- `VITE_CLIQ_ALIAS` — CliQ bank payment alias (Jordan-specific payment gateway)

Supabase Edge Functions also require `ULTRAMSG_INSTANCE_ID` and `ULTRAMSG_TOKEN` set in the Supabase project's function secrets.

## Architecture Overview

**Keddmat** (خدمات) is a PWA that lets users create mini online stores and receive orders via WhatsApp.

### Frontend (`src/`)

- **Pages** (`src/pages/`): Index (landing), Auth, Dashboard (store management), StorePage (public storefront), Admin, Terms
- **Routing**: React Router v6 in `App.tsx`; protected routes check `useAuth()` before rendering
- **State**: React Query for server state; Auth context (`useAuth`) for session; React Hook Form + Zod for forms
- **Path alias**: `@/*` → `src/*`

### Backend (Supabase)

Database tables in `supabase/schema.sql`:
- `profiles` — one per user; holds store slug, WhatsApp number, subscription status
- `products` — belong to a profile; have price, image, delivery options
- `store_analytics` — event log (link clicks, WhatsApp clicks, product views); fire-and-forget
- `payment_receipts` — subscription payment proof; admin approves/rejects
- `phone_verifications` — OTP codes for registration
- `user_roles` — marks admin users

RLS policies on all tables: users manage only their own rows; public can read active stores/products.

Deno edge functions in `supabase/functions/`:
- `send-otp` / `verify-otp` — login OTP via WhatsApp (UltraMsg)
- `send-registration-otp` / `verify-registration-otp` — registration OTP
- `send-whatsapp` — generic WhatsApp message delivery
- `reset-password`, `delete-account`, `admin-data`, `complete-emergency`

### Authentication Pattern

Phone numbers are converted to fake emails for Supabase auth:
```
"962791234567" → "962791234567@keddmat.com"
```
Email confirmation is disabled in the Supabase project. The trigger `on_auth_user_created` creates a stub `profiles` row on signup. Admin phones are listed in `src/lib/adminPhones.ts` and are auto-assigned the admin role.

### Key Conventions

- **Store slugs** are auto-generated from the store name with a short timestamp suffix (see `src/lib/`)
- **Image uploads** go to the `user-uploads` Supabase storage bucket under `{user_id}/{filename}`; the `useImageUpload` hook handles this
- **Admin checks**: use `useAdmin()` hook; admin panel is at `/admin`
- **RTL / Arabic**: the app ships Arabic UI; `useLanguage()` hook controls direction; fonts are Cairo and Tajawal
- **Theming**: Tailwind `class` strategy; brand cyan `#00AEEF`, brand purple `#7B2CBF`
- **UI components**: shadcn-ui lives in `src/components/ui/`; prefer extending existing components over adding new libraries

### Deployment

- Hosted on Vercel; `vercel.json` rewrites all routes to `index.html` for SPA routing
- Capacitor wraps the production build for Android (app ID: `app.lovable.816fe739788d412a87c6d6c070d8d772`)
- PWA manifest and service worker registration are in `public/` and `index.html`
