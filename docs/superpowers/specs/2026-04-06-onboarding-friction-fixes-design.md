# Onboarding Friction Fixes — Design Spec
**Date:** 2026-04-06
**Status:** Approved

## Problem

30 users did not convert during trial. Root cause: six friction points prevent new users from experiencing core value before hitting setup walls or payment gates.

## Goals

1. New user sees a populated, working UI within 60 seconds of first login
2. First check-in is completable without any prior data entry
3. No lock icons visible during the first meaningful interaction with the app
4. Admin screens work on mobile; kiosk screen retains size enforcement
5. Notification failures are communicated clearly, not silently

---

## Fix 1: Quick-Start Wizard

**Trigger:** On login, if `hosts.length === 0` AND localStorage key `floinvite_wizard_complete` is absent.

**Component:** `src/components/QuickStartWizard.tsx` (new)

**Flow:**

### Step 1 — "See it live"
- Inject 3 demo `Guest` records and 1 demo `Host` record into local state (NOT persisted to IndexedDB)
- Records carry `isDemo: true` flag
- User sees a fully populated Logbook and check-in screen
- CTA button: "This is what I need →"

### Step 2 — "Add yourself as a host"
- Single form: Name (required) + Email (pre-filled from `floinvite_user_email` localStorage)
- On submit: saves real host to IndexedDB, clears all `isDemo` records from state
- CTA button: "I'm set up →"

### Step 3 — "Try the kiosk"
- Explanation: "Open the check-in screen on a tablet at reception"
- CTA button: "Open Site Access →" → navigates to `check-in`
- Sets `floinvite_wizard_complete = true` in localStorage
- Wizard never shown again after this point

**Demo data spec:**
```typescript
// Injected into component state only — never written to IndexedDB
const DEMO_HOSTS: Host[] = [
  { id: 'demo-host-1', name: 'Sarah Chen', email: 'sarah@example.com',
    department: 'Operations', notificationMethod: 'email', isDemo: true }
];

const DEMO_GUESTS: Guest[] = [
  { id: 'demo-guest-1', name: 'James Okafor', company: 'Acme Ltd',
    hostId: 'demo-host-1', status: 'Checked In',
    checkInTime: <30 mins ago>, isDemo: true },
  { id: 'demo-guest-2', name: 'Priya Nair', company: 'TechCorp',
    hostId: 'demo-host-1', status: 'Checked Out',
    checkInTime: <2 hrs ago>, checkOutTime: <1 hr ago>, isDemo: true },
  { id: 'demo-guest-3', name: 'Tom Reeves',
    hostId: 'demo-host-1', status: 'Expected',
    checkInTime: <now>, isDemo: true }
]
```

**Integration in App.tsx:**
- After successful login/account creation, check wizard trigger condition
- If triggered, render `<QuickStartWizard>` as a full-screen overlay before normal app routing

---

## Fix 2: Empty States

### HostManagement
- When `hosts.length === 0` (post-wizard), replace empty table with:
  - Heading: "No hosts added yet"
  - Body: "Add the people your visitors come to see. They'll receive an email when their guest arrives."
  - CTA: "Add first host" button (same as existing Add flow)
- File: `src/components/HostManagement.tsx`

### Logbook
- When `guests.length === 0`, replace empty table with:
  - Heading: "No visits recorded yet"
  - Body: "Head to Site Access to check in your first visitor."
  - CTA: Link to `check-in` page (uses `onNavigate` prop already available)
- File: `src/components/Logbook.tsx`

---

## Fix 3: Unlock CSV Export for Starter

**File:** `src/utils/featureGating.ts`

Change:
```typescript
'csv_export': { starter: false, compliance: true, enterprise: true }
```
To:
```typescript
'csv_export': { starter: true, compliance: true, enterprise: true }
```

**File:** `src/components/Logbook.tsx`
- Remove the `disabled` attribute and lock icon from the Export CSV button
- Export JSON and PDF remain locked (meaningful Pro differentiator)

**Rationale:** CSV export is a baseline utility. Locking it on first interaction signals restriction before trust is established.

---

## Fix 4: Mobile Wall Scoped to Kiosk Only

**File:** `src/App.tsx` — line ~384

Change condition from:
```typescript
{isMobile && isAuthenticated && !publicPages.includes(currentPage) && (
```
To:
```typescript
{isMobile && isAuthenticated && currentPage === 'check-in' && (
```

**Rationale:** The kiosk legitimately requires a large screen. Admin screens (logbook, hosts, settings) do not. Blocking admins from managing their account on a phone is unnecessary friction.

---

## Fix 5: Notification Status Clarity

**File:** `src/components/VisitorCheckIn.tsx`

Current behavior: notification error auto-clears after 5 seconds, leaving no trace.

Change: On notification error, replace the auto-clearing error with a persistent soft message:
- "Your guest is checked in. Host notification may be delayed — check your email settings if this persists."
- This message persists on the success screen (does not auto-clear)
- On notification success: keep existing 3-second auto-clear behavior

**Rationale:** A tester whose SMTP is misconfigured currently sees a check-in "succeed" with no feedback about the missing notification. They conclude the product is broken.

---

## Fix 6: Logo Upload — Build the Missing UI

`logoUrl` exists in `AppSettings` (types.ts:87) but has no upload UI. `getLogoPath()` in `logoHelper.ts` always returns the Floinvite logo and never reads `settings.logoUrl`. This feature is not gated — it simply doesn't exist yet.

**Files:**

- `src/components/Settings.tsx` — add a logo upload field to the System Setup tab:
  - File input (accepts PNG, JPG, SVG, max 2MB)
  - Converts to base64 and saves to `settings.logoUrl`
  - Shows a preview of the uploaded logo

- `src/utils/logoHelper.ts` — update `getLogoPath()` to accept optional `logoUrl` param:
  ```typescript
  export function getLogoPath(customLogoUrl?: string): string {
    if (customLogoUrl) return customLogoUrl;
    return isYuletideSeason() ? '/xmas-logo.png' : '/mainflologo.png';
  }
  ```

- `src/App.tsx` — pass `settings.logoUrl` to `getLogoPath()` in the header (line ~357)

- `src/components/VisitorCheckIn.tsx` — display `settings.logoUrl` (or fallback) on the kiosk welcome screen

**No feature gating** — available to all tiers immediately. This is the highest-impact "aha moment": the user sees their own brand on the kiosk screen.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/QuickStartWizard.tsx` | NEW — full wizard component |
| `src/App.tsx` | Add wizard trigger; scope mobile wall to check-in only |
| `src/components/HostManagement.tsx` | Add empty state |
| `src/components/Logbook.tsx` | Add empty state; remove CSV export lock |
| `src/utils/featureGating.ts` | Unlock csv_export for starter; verify logo gating |
| `src/components/Settings.tsx` | Add logo upload UI to System Setup tab |
| `src/utils/logoHelper.ts` | Accept custom logoUrl param, fallback to Floinvite logo |
| `src/components/VisitorCheckIn.tsx` | Improve notification error persistence |

---

## Out of Scope

- Redesigning the pricing/tier model
- Backend SMTP configuration changes
- Any changes to the landing page or marketing flows
- Adding new notification channels
