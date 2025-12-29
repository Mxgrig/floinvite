# floinvite - Project CLAUDE Configuration

Project-specific instructions and configuration for the floinvite visitor management system.

This file extends the SuperClaude framework with floinvite-specific guidelines.

# ═══════════════════════════════════════════════════
# Global SuperClaude Framework Import
# ═══════════════════════════════════════════════════

Inherits all SuperClaude components from ~/.claude/CLAUDE.md:
- Core Framework (FLAGS, PRINCIPLES, RULES)
- Behavioral Modes (Brainstorming, Task Management, etc.)
- MCP Servers (Context7, Morphllm, Sequential, Serena)

# ═══════════════════════════════════════════════════
# floinvite Project Rules
# ═══════════════════════════════════════════════════

## Email Configuration
**Priority**: 🔴 CRITICAL

- **Approved Email**: admin@floinvite.com (ONLY approved email for all configurations)
- **Rule**: Search and replace all other email addresses with admin@floinvite.com
- **Verification**: Before committing, grep for email patterns and verify no unauthorized emails exist
- **Exception**: User-provided email inputs in guest forms are allowed (validation required)

Detection: `grep -r "@" src/ | grep -v "admin@floinvite.com" | grep -v "@" in forms/comments`

## Chart Implementation
**Priority**: 🟡 IMPORTANT

- **Requirement**: All charts must be JavaScript-generated (Recharts)
- **Prohibition**: ❌ NO PNG charts, image exports, or static graphics
- **Standard**: Use Recharts library for all data visualization
- **Analytics Dashboard**: Currently marked for removal, but if charts are needed, use Recharts only

Rule: `grep -r "\.png\|\.jpg\|<img.*chart" src/ → MUST BE EMPTY`

## TypeScript Strictness
**Priority**: 🟡 IMPORTANT

- Maintain strict mode enabled in tsconfig.json
- All interfaces properly typed (no `any` types)
- Discriminated unions for complex types (GuestStatus, HostNotificationMethod)
- Proper error handling with typed errors

## Component Architecture
**Priority**: 🟡 IMPORTANT

- Keep components focused and single-responsibility
- Use existing Button.tsx and StatsCard.tsx patterns
- Maintain React 19.2.0 and Vite compatibility
- Extract components to separate files (no monolithic App.tsx)

# ═══════════════════════════════════════════════════
# Tech Stack & Dependencies
# ═══════════════════════════════════════════════════

**Core:**
- React 19.2.0
- TypeScript (strict mode)
- Vite
- Tailwind CSS (via CDN)

**UI & Charts:**
- Lucide React (icons)
- Recharts (charts only - NO PNG exports)

**Data & Services:**
- localStorage API (data persistence)
- Template-based notification generation

**Optional (for Phase 2+):**
- xlsx (Excel parsing - only if needed for imports)
- Email service SDK (SendGrid, Resend, etc.) - future phase

**Prohibited:**
- ❌ No charting libraries except Recharts
- ❌ No image-based charts or exports
- ❌ No external AI APIs (Gemini, OpenAI, etc.)
- ❌ No backend dependencies for MVP

# ═══════════════════════════════════════════════════
# Implementation Priorities
# ═══════════════════════════════════════════════════

## Phase 1: Core (MVP Foundation)
1. ✅ SmartTriage component (two-path welcome screen)
2. ✅ Host management with CSV import
3. ✅ localStorage persistence
4. ✅ Simplified 3-field sign-in flow
5. ✅ Template-based notification generation

## Phase 2: Enhancement (Feature Expansion)
1. ✅ Expected guest import
2. ✅ Returning visitor lookup (30-day window)
3. ✅ Email sending integration (real notifications)
4. ✅ Auto-cleanup for archived guests
5. ✅ Evacuation list generation (emergency accountability)

## Phase 3: Polish (Week 5)
1. ✅ Mobile responsive optimization
2. ✅ Error handling & validation
3. ✅ Loading states & animations
4. ✅ Export functionality

## Features to Remove
- ❌ Dashboard/Analytics (too complex for MVP)
- ❌ Subscription management (use Stripe links)
- ❌ Kiosk mode toggle (SmartTriage IS kiosk)
- ❌ QR codes (no hardware needed)
- ❌ Badge printing (not needed)
- ❌ Visitor photos (privacy + hardware)
- ❌ Access control integration (enterprise only)

# ═══════════════════════════════════════════════════
# Feature Descriptions
# ═══════════════════════════════════════════════════

## Evacuation List (Phase 2)
**Purpose:** Generate real-time accountability lists for emergency evacuation procedures.

**What It Does:**
- Displays all currently **checked-in guests** (GuestStatus = 'Checked In')
- Groups guests by their assigned **hosts** for accountability tracking
- Shows host contact information (email, phone)
- Displays guest check-in time for verification
- Provides print-friendly PDF output
- Exports to CSV and JSON formats

**Access:** Settings → Backup & Data → "Create Evacuation List" button (available for all tiers)

**Typical Workflow (Emergency):**
1. Fire alarm or emergency triggered
2. Incident commander accesses evacuation list (printed or phone)
3. Hosts use list to verify their assigned guests are accounted for
4. Host reports: "I have 5 guests, all accounted for" or "Missing 1 guest"
5. Missing guests reported to search & rescue teams

**Data Included:**
- Guest name
- Guest company
- Guest contact (email, phone)
- Check-in time
- Assigned host
- Host contact info

**Future Enhancements (Phase 3+):**
- Special needs indicators (mobility, medical, language)
- Host location status (On-Site / Remote)
- Interactive checklist mode (tap to verify)
- Assembly point information
- Real-time updates if guests check out

# ═══════════════════════════════════════════════════
# Data Structures & Interfaces
# ═══════════════════════════════════════════════════

## Core Types (types.ts)

```typescript
// Host/Employee
interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  notifyByEmail: boolean;
  notifyBySMS: boolean;
  smsCarrier?: string; // vodafone|ee|o2|three|tmobile|att|verizon
}

// Guest
interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  hostId: string;
  checkInTime: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  status: GuestStatus;
  lastVisit?: string; // For returning visitor lookup
  visitCount?: number;
  preRegistered?: boolean;
}

// Expected Guest
interface ExpectedGuest extends Guest {
  expectedDate: string; // ISO date
  expectedTime?: string; // HH:MM
  preRegistered: true;
  magicLink?: string;
}

// Guest Status
enum GuestStatus {
  EXPECTED = 'Expected',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  NO_SHOW = 'No Show'
}

// App Settings
interface AppSettings {
  businessName: string;
  businessAddress?: string;
  logoUrl?: string;
  primaryColor?: string;
  notificationEmail: string; // admin@floinvite.com
}
```

## SMS Gateways (No API keys needed)
```typescript
const SMS_GATEWAYS = {
  'vodafone': '@vodafone.net',
  'ee': '@mms.ee.co.uk',
  'o2': '@o2.co.uk',
  'three': '@three.co.uk',
  'tmobile': '@tmomail.net',
  'att': '@txt.att.net',
  'verizon': '@vtext.com'
};
// Usage: ${phone.replace(/\s/g, '')}${SMS_GATEWAYS[carrier]}
```

# ═══════════════════════════════════════════════════
# File Structure Guidelines
# ═══════════════════════════════════════════════════

```
src/
├── App.tsx                      # Main router & layout
├── types.ts                     # All TypeScript interfaces
├── components/
│   ├── Button.tsx              # ✅ Keep existing
│   ├── StatsCard.tsx           # ✅ Keep existing
│   ├── SmartTriage.tsx         # NEW: Check-in flow
│   ├── HostManagement.tsx      # NEW: Settings
│   ├── Logbook.tsx             # Extract from App.tsx
│   ├── Settings.tsx            # Extract from App.tsx
│   └── SuccessScreen.tsx       # NEW: Post check-in feedback
├── services/
│   ├── notificationService.ts  # NEW: Template-based notifications
│   └── storageService.ts       # NEW: localStorage helpers
└── utils/
    ├── csvParser.ts            # NEW: CSV import/export
    ├── hooks.ts                # NEW: usePersistedState
    ├── validators.ts           # NEW: Input validation
    └── constants.ts            # Constants & configs
```

# ═══════════════════════════════════════════════════
# Development Workflow
# ═══════════════════════════════════════════════════

## Before Starting Work
```bash
git status          # Check branch (feature branch only)
git branch          # Should show feature/*, NOT main/master
npm run build       # Verify no type errors
npm run dev         # Start dev server
```

## Code Quality Gates
- ✅ TypeScript strict mode (no errors)
- ✅ All components properly typed
- ✅ localStorage keys prefixed with `floinvite_`
- ✅ Email validation before sending
- ✅ CSV import with validation
- ✅ Error handling for all async operations

## Testing Before Commit
```bash
npm run build       # Type check
npm run dev         # Manual testing
# Test all flows:
# - Walk-in visitor sign-in
# - Expected visitor lookup
# - Host management (add/edit/delete)
# - CSV import with validation
# - Email notifications
# - Returning visitor lookup
# - localStorage persistence (refresh test)
```

## Commit Message Format
```
[PHASE/FEATURE]: Brief description

Detailed explanation of changes
- Implementation details
- Trade-offs considered
- Testing performed
```

Examples:
- `[PHASE1/SMARTTRIAGE]: Implement welcome screen with two-path flow`
- `[PHASE1/STORAGE]: Add localStorage persistence with usePersistedState hook`
- `[PHASE2/EXPECTED]: Add expected guest import and lookup`

# ═══════════════════════════════════════════════════
# Performance Targets
# ═══════════════════════════════════════════════════

- Check-in flow: <30 seconds from load to success
- CSV import: <2 seconds for 100 rows
- Search/filter: Real-time client-side (instant feedback)
- Logbook load: <1 second with 500+ records
- Mobile responsive: Touch targets minimum 48px
- localStorage limit: Archive guests >90 days old

# ═══════════════════════════════════════════════════
# Validation Rules
# ═══════════════════════════════════════════════════

**Required Fields:**
- Guest name: 2+ characters
- Host selection: Must select from dropdown
- Email (if provided): Valid format
- Phone (if provided): Valid format (regex: `^[0-9\-\+\(\)\s]+$`)

**CSV Import Validation:**
- Must have Name and Email columns
- Maximum 1000 rows per import
- Duplicate emails: Skip or merge (user choice)
- Required format: Name, Email, Phone (optional), Department (optional)

**Error Messages:**
```typescript
const ERRORS = {
  noHost: 'Please select who you are visiting',
  noName: 'Please enter your name (2+ characters)',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  csvMissingColumns: 'CSV must have Name and Email columns',
  csvNoData: 'No valid data found in CSV file',
  networkError: 'Could not send notification. Guest is checked in.',
  emailUnauthorized: 'Only admin@floinvite.com is authorized for this action'
};
```

# ═══════════════════════════════════════════════════
# Testing Scenarios
# ═══════════════════════════════════════════════════

**Test 1: Walk-In Visitor**
1. Click "Walk-In Visit"
2. Select host from dropdown
3. Enter name (required)
4. Enter company (optional, can skip)
5. ✅ Check-in successful
6. ✅ Host receives email notification
7. ✅ Guest appears in logbook

**Test 2: Expected Visitor**
1. Import CSV with expected guests
2. Click "I'm Expected"
3. Search for guest name or phone
4. ✅ Find matching expected guest
5. ✅ One-click check-in
6. ✅ Status changes "Expected" → "Checked In"

**Test 3: Returning Visitor (30-day window)**
1. First visit: Complete walk-in flow
2. Leave and return within 30 days
3. Click "Walk-In Visit"
4. Select same host
5. Enter phone number (lookup trigger)
6. ✅ "Welcome back!" message appears
7. ✅ Skip name entry, quick check-in

**Test 4: Host Management**
1. Go to Settings
2. Click "Import CSV"
3. Select file with 10+ hosts
4. ✅ Preview shows count
5. ✅ All hosts imported and appear in table
6. Edit host inline (notification preferences)
7. Delete host with confirmation
8. ✅ Refresh page - changes persist

**Test 5: Data Persistence**
1. Add hosts via CSV import
2. Check in a guest
3. Refresh page (F5)
4. ✅ All data still present
5. Close browser
6. Reopen
7. ✅ Data still there (localStorage working)

**Test 6: Mobile Responsive**
1. Open on phone (iOS Safari, Chrome Android)
2. ✅ Touch targets 48px minimum
3. ✅ Text readable without zoom
4. ✅ Buttons responsive to touch
5. ✅ No horizontal scrolling needed

# ═══════════════════════════════════════════════════
# Common Patterns & Solutions
# ═══════════════════════════════════════════════════

## usePersistedState Hook
```typescript
// Auto-persists state to localStorage
const [hosts, setHosts] = usePersistedState<Host[]>('floinvite_hosts', []);
const [guests, setGuests] = usePersistedState<Guest[]>('floinvite_guests', []);
```

## CSV Parsing (No Library Needed)
```typescript
const parseCSV = (text: string): string[][] => {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(cell => cell.trim()));
};
```

## Generate Notification Message (Template-Based)
```typescript
const generateVisitorNotification = (guest: Guest, host: Host): string => {
  const time = new Date(guest.checkInTime).toLocaleTimeString();
  const company = guest.company ? ` from ${guest.company}` : '';

  return `${guest.name}${company} has arrived to visit you.

Time: ${time}
Location: Reception area

Please come down to greet your visitor.`;
};
```

## Display Notification (Phase 1)
```typescript
// Phase 1 (MVP): Show in UI for testing
const notification = {
  to: host.email,
  subject: `Visitor: ${guest.name}`,
  body: generateVisitorNotification(guest, host)
};

showToast(`Message ready: "${notification.body}"`);
console.log(notification); // For testing
```

## Send Email (Phase 2+)
```typescript
// Phase 2: Integrate with email service (SendGrid, Resend, etc.)
const sendNotification = async (host: Host, message: string) => {
  try {
    await emailService.send({
      to: host.email,
      subject: `Visitor Arrival Notification`,
      text: message
    });
  } catch (error) {
    console.error('Notification failed:', error);
  }
};
```

# ═══════════════════════════════════════════════════
# Known Constraints & Trade-offs
# ═══════════════════════════════════════════════════

**localStorage Limitations:**
- Max ~5-10MB per domain (varies by browser)
- Action: Archive guests >90 days old
- Warning: Show alert at 80% capacity

**CSV Import Size:**
- Max 1000 rows per import (UI performance)
- Validate in chunks to prevent freezing
- Show progress for files >100 rows

**Notification System:**
- Phase 1 (MVP): Template-based messages, displayed in UI
- Phase 2: Email service integration (SendGrid, Resend, etc.)
- Phase 3+: SMS and multi-channel notifications
- No external APIs required for Phase 1

**Browser Compatibility:**
- Modern browsers required (localStorage, ES6+)
- Target: Chrome, Safari, Firefox, Edge
- Mobile: iOS 12+, Android 5+

# ═══════════════════════════════════════════════════
# Decision Journal
# ═══════════════════════════════════════════════════

Record key architectural decisions made during development:

```markdown
## Decision: SMS via Email Gateway
- Considered: Twilio, AWS SNS, native SMS APIs
- Chosen: Email-to-carrier SMS gateways
- Reason: Free, no API keys, simple implementation
- Trade-off: Delivery not guaranteed, but acceptable for SME use case
- Date: [Implementation date]

## Decision: localStorage for Persistence
- Considered: IndexedDB, Firebase, backend API
- Chosen: localStorage with JSON serialization
- Reason: MVP scope, no backend needed, simple for SME
- Trade-off: 5-10MB limit, single browser/device only
- Date: [Implementation date]
```

# ═══════════════════════════════════════════════════
# Success Criteria
# ═══════════════════════════════════════════════════

MVP is complete when:
- ✅ Check-in takes <30 seconds (timed test)
- ✅ Works on mobile and desktop browsers
- ✅ No hardware or external APIs required
- ✅ Notification templates generate correctly
- ✅ Data persists after browser refresh
- ✅ CSV import works for 100+ rows
- ✅ Clean, professional UI (matches spec)
- ✅ Zero critical bugs in core flows
- ✅ Email address verified: admin@floinvite.com
- ✅ All charts JavaScript-generated (no PNGs)
- ✅ TypeScript strict mode: zero errors
- ✅ No external APIs (Gemini, SendGrid, etc.)
- ✅ Test all 6 scenarios above: PASS

# ═══════════════════════════════════════════════════
# Quick Reference
# ═══════════════════════════════════════════════════

**Start Session:**
```bash
git status && git branch              # Verify feature branch
npm run dev                           # Start dev server
```

**Before Commit:**
```bash
npm run build                         # Type check
git diff                              # Review changes
grep -r "admin@floinvite.com" src/   # Verify email
grep -r "\.png" src/                  # Verify no PNGs
```

**Key Files:**
- `src/types.ts` - All interfaces
- `src/components/SmartTriage.tsx` - Main check-in flow
- `src/utils/hooks.ts` - usePersistedState
- `src/services/notificationService.ts` - Email/SMS

**Important Emails:**
- Only: admin@floinvite.com
- Never: Other addresses

**Important Constraints:**
- Charts: Recharts only, NO PNGs
- TypeScript: Strict mode, NO `any`
- Storage: localStorage only for MVP

---

**Project Status**: Planning/Phase 1 Implementation
**Last Updated**: November 2024
**Target Completion**: 2-3 weeks
**Estimated Effort**: 40-60 hours
