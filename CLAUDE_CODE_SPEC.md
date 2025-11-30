# floinvite - Visitor Management System
## Specification for Implementation

---

## PROJECT OVERVIEW

**Product Name:** floinvite  
**Target Market:** SME businesses (5-30 employees) - offices, coworking spaces, small multi-tenant buildings  
**Core Problem:** Replace paper logbooks and WhatsApp messages with professional digital visitor management  
**Pricing Philosophy:** Coffee price - Free tier + £7/month Pro tier  

---

## CURRENT STATE

The project exists as a React/TypeScript app with:
- Basic sign-in modal (too complex, needs simplification)
- Logbook view with visitor table
- Mock data and Gemini AI integration
- Settings page with tenant list
- Dashboard with analytics
- Kiosk mode (needs replacement)

**Tech Stack:**
- React 19.2.0
- TypeScript
- Vite
- Tailwind CSS (via CDN)
- Lucide React icons
- Recharts for charts
- Google Gemini AI (@google/genai)

---

## REQUIRED CHANGES

### 1. SMART TRIAGE INTERFACE (Priority 1)

Replace the current sign-in modal and kiosk mode with a conversational, two-path interface.

**Welcome Screen:**
```
┌─────────────────────────────────────────┐
│                                         │
│      [Building Icon]                    │
│                                         │
│      Welcome to Metro Tower             │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  📅  I'm Expected               │    │
│  │  (You received an invitation)   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │  🚶  Walk-In Visit              │    │
│  │  (No appointment)               │    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Path A: Expected Visitor (Pre-registered)**
1. Screen: "Enter your name or phone number"
2. Search through expectedGuests array
3. If found: Show visit details + one-click check-in
4. If not found: Fall back to walk-in flow

**Path B: Walk-In Visitor**
1. Screen: Select host from dropdown (from hosts array)
2. Screen: Enter your name (required)
3. Screen: Enter company (optional, with skip button)
4. Success screen with auto-redirect

**Success Screen:**
```
┌─────────────────────────────────────────┐
│            ✅                           │
│       You're all checked in!            │
│   Sarah Connor has been notified        │
│   Please take a seat in reception.      │
│  (Auto-return to welcome in 5 seconds)  │
└─────────────────────────────────────────┘
```

---

### 2. HOST MANAGEMENT SYSTEM (Priority 2)

Create a full host/employee management interface in Settings.

**Data Structure:**
```typescript
interface Host {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  notifyByEmail: boolean;
  notifyBySMS: boolean;
}
```

**Features Required:**
- Manual add/edit/delete hosts (inline table editing)
- Bulk import from CSV/Excel
- Download CSV template button
- Notification preferences per host (email/SMS checkboxes)
- Search/filter hosts
- Department/team grouping (optional field)

**CSV Template Format:**
```csv
Name,Email,Phone,Department
Sarah Connor,sarah@tech.com,07700123456,Sales
Mike Ross,mike@tech.com,07700789012,Legal
Rachel Green,rachel@tech.com,,HR
```

**Import Flow:**
1. User clicks "Import CSV/Excel"
2. File picker accepts .csv, .xlsx, .xls
3. Parse file (use FileReader for CSV, optionally XLSX library for Excel)
4. Validate: Name and Email are required
5. Show preview with count: "Found 15 hosts. Import?"
6. Add to hosts array (merge, don't replace)
7. Success message: "✅ Imported 15 hosts"

---

### 3. EXPECTED GUEST PRE-REGISTRATION (Priority 3)

Allow bulk import of expected visitors for meetings/events.

**Data Structure:**
```typescript
interface ExpectedGuest extends Guest {
  expectedDate: string; // ISO date
  expectedTime?: string; // HH:MM format
  preRegistered: true;
  magicLink?: string; // Optional: unique check-in URL
}

// Extend GuestStatus enum
enum GuestStatus {
  EXPECTED = 'Expected',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  NO_SHOW = 'No Show'
}
```

**CSV Template Format:**
```csv
Guest Name,Email,Company,Host Name,Expected Date,Expected Time
John Smith,john@client.com,Client Corp,Sarah Connor,2024-11-26,14:00
Jane Doe,jane@vendor.com,Vendor Ltd,Mike Ross,2024-11-26,15:30
```

**Features:**
- Import expected guests from CSV
- Show expected guests in logbook with "Expected" badge
- When they arrive: Quick search by name/phone → one-click check-in
- Mark as "No Show" if they don't arrive
- Auto-cleanup: Archive expected guests after 7 days

---

### 4. SIMPLIFIED SIGN-IN FORM (Priority 2)

When using walk-in flow, reduce friction:

**Current (Too Complex):**
- Name (required)
- Email (optional)
- Company (optional)
- Visiting Office (dropdown)
- Host Name (text input)

**New (Streamlined):**
- Host (dropdown with search, required) ← From hosts array
- Your Name (required)
- Company (optional, with "Skip" button)

**Auto-fill Logic:**
- If guest visited in last 30 days, show: "Welcome back, John! Visiting Sarah again?"
- Store phone number for returning visitor lookup

---

### 5. RETURNING VISITOR FAST-TRACK

**Implementation:**
```typescript
// Add to Guest interface
interface Guest {
  // ... existing fields
  phone?: string; // Store for lookup
  lastVisit?: string; // ISO timestamp
  visitCount?: number; // Track frequency
}

// Fast-track function
const checkReturningVisitor = (phone: string): Guest | null => {
  const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
  return guests.find(g => 
    g.phone === phone && 
    new Date(g.checkInTime).getTime() > cutoff
  ) || null;
};
```

**UX Flow:**
1. In walk-in flow, after selecting host, show: "Visited before? Enter phone:"
2. If match found: "Welcome back, John! Check in now?" → Skip name entry
3. If no match: Continue with name entry

---

### 6. NOTIFICATION SYSTEM

**Current:** Uses Gemini AI to generate notification text (good, keep this)

**Enhancement Needed:**
```typescript
const sendHostNotification = async (guest: Guest, host: Host) => {
  // 1. Generate AI message
  const message = await generateHostNotification(guest, settings.businessName);
  
  // 2. Send via email (existing)
  if (host.notifyByEmail) {
    await sendEmail(host.email, `Visitor Arrived: ${guest.name}`, message);
  }
  
  // 3. Send via SMS using email-to-SMS gateway (FREE method)
  if (host.notifyBySMS && host.phone) {
    const carrier = host.smsCarrier || 'vodafone'; // User selects in settings
    const smsGateways = {
      'vodafone': '@vodafone.net',
      'ee': '@mms.ee.co.uk',
      'o2': '@o2.co.uk',
      'three': '@three.co.uk'
    };
    const smsEmail = host.phone.replace(/\s/g, '') + smsGateways[carrier];
    await sendEmail(smsEmail, '', message); // Arrives as SMS
  }
  
  // 4. Show toast notification
  showToast(`${host.name} notified: "${message}"`);
};
```

---

### 7. DATA PERSISTENCE

**Current:** Uses React state (lost on refresh)

**Required:** localStorage persistence

```typescript
// Create a persistence hook
const usePersistedState = <T,>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue] as const;
};

// Use in App.tsx
const [hosts, setHosts] = usePersistedState<Host[]>('floinvite_hosts', []);
const [guests, setGuests] = usePersistedState<Guest[]>('floinvite_guests', MOCK_GUESTS);
const [settings, setSettings] = usePersistedState<AppSettings>('floinvite_settings', defaultSettings);
```

---

### 8. UI/UX REQUIREMENTS

**Design Language:**
- Modern, minimal, fast
- Large touch targets (mobile-friendly)
- High contrast text
- Clear visual hierarchy
- Smooth transitions
- Auto-return to welcome after success

**Color Palette:**
- Primary: Indigo (#4f46e5)
- Success: Green (#10b981)
- Background: Slate gradients
- Text: Slate-900 (dark) / White (on dark backgrounds)

**Typography:**
- Large headings (text-3xl to text-5xl)
- Clear labels (text-sm, uppercase, text-slate-500)
- Sans-serif (Inter, system fonts)

**Accessibility:**
- WCAG AA contrast ratios
- Keyboard navigation
- Focus states on all interactive elements
- aria-labels where needed

---

### 9. REMOVED/DEPRECATED FEATURES

**Remove these to simplify:**
- ❌ Dashboard/Analytics view (too complex for SME)
- ❌ Subscription management page (use Stripe checkout links)
- ❌ Kiosk mode toggle (the smart triage IS the kiosk)
- ❌ QR code system (no hardware needed)
- ❌ Badge printing (not needed)
- ❌ Visitor photos (privacy concerns, hardware needed)
- ❌ Access control integration (enterprise feature)

**Keep only:**
- ✅ Logbook (main view)
- ✅ Settings (hosts, business info)
- ✅ Smart Triage Interface (replaces kiosk)

---

### 10. FILE STRUCTURE

```
src/
├── App.tsx                    # Main app with routing
├── types.ts                   # All TypeScript interfaces
├── components/
│   ├── Button.tsx             # Keep existing
│   ├── StatsCard.tsx          # Keep existing
│   ├── SmartTriage.tsx        # NEW: Main check-in flow
│   ├── HostManagement.tsx     # NEW: Host settings page
│   ├── Logbook.tsx            # Extract from App.tsx
│   └── Settings.tsx           # Extract from App.tsx
├── services/
│   ├── geminiService.ts       # Keep existing
│   ├── notificationService.ts # NEW: Email/SMS sending
│   └── storageService.ts      # NEW: localStorage helpers
└── utils/
    ├── csvParser.ts           # NEW: CSV import/export
    └── hooks.ts               # NEW: usePersistedState, etc.
```

---

### 11. IMPLEMENTATION PRIORITY

**Phase 1 (Week 1) - Core Functionality:**
1. Create SmartTriage component with two-path flow
2. Implement host management with CSV import
3. Add localStorage persistence
4. Simplify sign-in to 3 fields

**Phase 2 (Week 2) - Enhanced Features:**
1. Expected guest import
2. Returning visitor lookup
3. SMS notifications via email gateway
4. Auto-cleanup and data management

**Phase 3 (Week 3) - Polish:**
1. Mobile responsive design
2. Error handling and validation
3. Loading states and animations
4. Export functionality improvements

---

### 12. TECHNICAL NOTES

**CSV Parsing (No external library needed):**
```typescript
const parseCSV = (text: string): string[][] => {
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split(',').map(cell => cell.trim()));
};
```

**For Excel support (optional):**
```bash
npm install xlsx
```

**Email-to-SMS Gateway (Free):**
```typescript
// No API keys needed - sends email that arrives as SMS
const smsGateways = {
  'vodafone': '@vodafone.net',
  'ee': '@mms.ee.co.uk',
  'o2': '@o2.co.uk',
  'three': '@three.co.uk',
  'tmobile': '@tmomail.net',
  'att': '@txt.att.net',
  'verizon': '@vtext.com'
};

// Send to: phonenumber@gateway
// Example: 07700123456@vodafone.net
```

---

### 13. TESTING SCENARIOS

**Test Case 1: Walk-In Visitor**
1. Click "Walk-In Visit"
2. Select "Sarah Connor" from host dropdown
3. Enter name "John Smith"
4. Enter company "Client Corp" (or skip)
5. Check in successfully
6. Verify Sarah gets notification
7. Verify guest appears in logbook

**Test Case 2: Expected Visitor**
1. Import CSV with expected guests
2. Click "I'm Expected"
3. Search for "John Smith"
4. Find matching visit
5. One-click check in
6. Verify status changes from "Expected" to "Checked In"

**Test Case 3: Returning Visitor**
1. Visitor checks in once
2. Leave app
3. Return within 30 days
4. Enter same phone number
5. Verify "Welcome back" message
6. Quick check-in without re-entering details

**Test Case 4: Host Management**
1. Go to Settings
2. Download CSV template
3. Fill with 10 hosts
4. Import CSV
5. Verify all 10 appear in table
6. Edit one host inline
7. Delete one host
8. Verify changes persist after refresh

---

### 14. ERROR HANDLING

**Required validation:**
- Host selection: Must select a host (required)
- Guest name: Must be at least 2 characters
- Email: Must be valid format if provided
- Phone: Must be valid UK format if provided
- CSV import: Must have Name and Email columns

**Error messages:**
```typescript
const errorMessages = {
  noHost: 'Please select who you are visiting',
  noName: 'Please enter your name',
  invalidEmail: 'Please enter a valid email address',
  invalidPhone: 'Please enter a valid phone number',
  csvMissingColumns: 'CSV must have Name and Email columns',
  csvNoData: 'No valid rows found in CSV',
  networkError: 'Could not send notification. Guest is still checked in.'
};
```

---

### 15. PERFORMANCE CONSIDERATIONS

**Large guest lists:**
- Paginate logbook after 100 entries
- Lazy load historical data
- Search/filter should be instant (client-side)

**CSV imports:**
- Show progress indicator for files >100 rows
- Validate in chunks to avoid UI freeze
- Maximum 1000 rows per import

**localStorage limits:**
- Archive guests older than 90 days
- Export before archiving
- Show warning at 80% capacity

---

### 16. DEPLOYMENT

**Build command:**
```bash
npm run build
```

**Hosting recommendations:**
- Vercel (free tier, auto-deploy from Git)
- Netlify (free tier, drag-and-drop)
- Cloudflare Pages (free tier, fast CDN)

**Environment variables needed:**
```
VITE_GEMINI_API_KEY=your_key_here
VITE_APP_NAME=Metro Tower
```

---

### 17. FUTURE ENHANCEMENTS (Not Now)

**For later versions:**
- Slack/Teams integration (webhooks)
- WhatsApp Business API notifications
- Multi-location support
- Stripe payment integration
- Custom branding per tenant
- Analytics dashboard
- Mobile app (React Native)
- Contractor induction module
- Meeting room booking integration

---

### 18. SUCCESS METRICS

**MVP is successful if:**
- ✅ Check-in takes <30 seconds
- ✅ Works on mobile and desktop
- ✅ No hardware required (just a browser)
- ✅ Hosts get instant notifications
- ✅ Data persists between sessions
- ✅ CSV import works for 100+ rows
- ✅ Clean, professional appearance
- ✅ Zero bugs in core flow

---

## IMPLEMENTATION CHECKLIST

### Must Have (MVP):
- [ ] Smart Triage welcome screen
- [ ] Two-path flow (Expected/Walk-in)
- [ ] Host management with CSV import
- [ ] Simplified 3-field sign-in
- [ ] Email notifications
- [ ] localStorage persistence
- [ ] Logbook with search/filter
- [ ] CSV export
- [ ] Mobile responsive

### Should Have (Launch):
- [ ] Expected guest import
- [ ] Returning visitor lookup
- [ ] SMS notifications (email gateway)
- [ ] Success screen with auto-return
- [ ] Loading states
- [ ] Error handling

### Nice to Have (Post-launch):
- [ ] Auto-archive old guests
- [ ] Guest visit history
- [ ] Host analytics (visits per host)
- [ ] Custom branding upload
- [ ] Multi-language support

---

## DESIGN MOCKUP REFERENCES

**Smart Triage Interface:**
- Large, centered cards
- High contrast buttons
- Gradient backgrounds (indigo to slate)
- Icons: Building, Calendar, User
- Touch-friendly (minimum 48px tap targets)

**Host Management:**
- Clean table layout
- Inline editing
- Prominent "Import CSV" button
- Search box at top
- Add/Delete icons clearly visible

**Logbook:**
- Spreadsheet-style table
- Alternating row colors
- Fixed header
- Status badges (color-coded)
- Quick action buttons

---

## GETTING STARTED

**To begin implementation:**
1. Review current App.tsx structure
2. Extract Logbook into separate component
3. Create SmartTriage.tsx with welcome screen
4. Create HostManagement.tsx in Settings
5. Add localStorage persistence
6. Test core flows
7. Iterate based on feedback

**Questions to resolve during development:**
- Should expected guests auto-create from imports or require manual approval?
- Should returning visitor lookup be automatic or opt-in?
- Should SMS carrier be auto-detected or user-selected?
- Should logbook archive automatically or require manual trigger?

---

## NOTES FOR CLAUDE CODE

- Keep existing design patterns (Button, StatsCard components)
- Maintain TypeScript strict typing
- Use existing Gemini AI integration (don't rebuild)
- Preserve current file structure where possible
- Add new features as separate components
- Test each phase before moving to next
- Focus on simplicity over features
- Mobile-first responsive design
- Comment complex logic
- Use meaningful variable names

---

**End of Specification**

*Last updated: November 2024*
*Target completion: 2-3 weeks*
*Estimated effort: 40-60 hours*
