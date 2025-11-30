# SMS Setup - Floinvite

## Overview
Floinvite includes SMS notification support via **email-to-SMS gateways**. No API keys or external services required!

## How It Works

### SMS Gateway Email Mapping
Each mobile carrier has an email gateway that converts emails to SMS messages:

| Carrier | Gateway | Example |
|---------|---------|---------|
| Vodafone (UK) | `@vodafone.net` | `07700900000@vodafone.net` |
| EE (UK) | `@mms.ee.co.uk` | `07700900000@mms.ee.co.uk` |
| O2 (UK) | `@o2.co.uk` | `07700900000@o2.co.uk` |
| Three (UK) | `@three.co.uk` | `07700900000@three.co.uk` |
| T-Mobile (US) | `@tmomail.net` | `15551234567@tmomail.net` |
| AT&T (US) | `@txt.att.net` | `15551234567@txt.att.net` |
| Verizon (US) | `@vtext.com` | `15551234567@vtext.com` |

### Implementation Details

**File:** `src/services/notificationService.ts`

**New Function:** `sendNotificationSMS()`
```typescript
export const sendNotificationSMS = async (
  host: Host,
  smsMessage: string,
  emailService?: { send: (msg: NotificationMessage) => Promise<void> }
): Promise<void>
```

**Parameters:**
- `host`: Host object with `phone`, `smsCarrier`, and `notifyBySMS` settings
- `smsMessage`: The SMS text (max 160 characters)
- `emailService`: Optional email service for Phase 2+ integration

**SMS Generation Functions (already implemented):**
- `generateVisitorArrivalSMS()` - Walk-in visitor
- `generateReturningVisitorSMS()` - Returning guest
- `generateExpectedGuestSMS()` - Expected guest
- `generateNoShowSMS()` - No-show reminder

## Phase Implementation

### Phase 1 (Current - MVP)
✅ SMS template generation
✅ SMS sending infrastructure (function exists)
❌ Actual email service integration

**Action in Phase 1:** SMS messages are logged to console, ready for manual sending

### Phase 2 (Email Service Integration)
When integrating with SendGrid, Resend, or similar:

```typescript
// Example: Use with Resend
const emailService = {
  send: async (msg: NotificationMessage) => {
    await resend.emails.send({
      from: 'notifications@floinvite.com',
      to: msg.to,
      subject: msg.subject,
      text: msg.body
    });
  }
};

await sendNotificationSMS(host, smsMessage, emailService);
```

### Phase 3 (Multi-Channel)
Extend to support Slack, Teams, and custom webhooks

## Configuration in HostManagement

When adding or editing a host:

1. **Enable SMS:** Check "Send SMS notifications"
2. **Select Carrier:** Choose from dropdown (Vodafone, EE, O2, etc.)
3. **Phone Number:** Enter host's mobile number (will be cleaned for gateway use)

**Validation:**
- Phone number is required for SMS
- Carrier must be selected
- Phone number format: any format accepted (spaces, dashes removed automatically)

## Usage Example

```typescript
import {
  generateVisitorArrivalSMS,
  sendNotificationSMS
} from '../services/notificationService';

// Generate SMS message (160 chars max)
const smsMessage = generateVisitorArrivalSMS(guest);

// Send via email-to-SMS gateway
await sendNotificationSMS(host, smsMessage);

// With email service (Phase 2+)
await sendNotificationSMS(host, smsMessage, emailService);
```

## Important Notes

### Character Limit
SMS messages are limited to 160 characters. The generation functions automatically:
- Prioritize essential information (name + company)
- Remove non-essential details if needed
- Use abbreviations (e.g., "5d ago" instead of "5 days ago")

### Phone Number Format
Accepted formats (all cleaned automatically):
- `07700 900000` → `07700900000`
- `+44 (0)7700 900000` → `447700900000`
- `07700-900000` → `07700900000`

### Delivery Guarantees
- **Email-to-SMS:** Gateway delivery depends on carrier
- **No guarantee:** Carrier gateways are best-effort
- **Alternative:** For production, use Twilio/Vonage API with guaranteed delivery

## Testing SMS (Phase 1)

To test SMS functionality in Phase 1:

1. Add a host with SMS enabled
2. Check in a guest
3. Open browser console
4. Look for log: `📱 SMS ready to send:`
5. Copy the `to` address and test with any email client

## Future Enhancements

- [ ] Integrate with Twilio/Vonage for guaranteed delivery
- [ ] Add delivery status tracking
- [ ] Support SMS on behalf of user (branded sender)
- [ ] Bulk SMS import/export
- [ ] Carrier failover (backup if primary fails)

## Files Involved

- `src/services/notificationService.ts` - SMS functions
- `src/components/HostManagement.tsx` - SMS configuration UI
- `src/types.ts` - SMS_GATEWAYS constant & SMSCarrier type
- `src/components/SmartTriage.tsx` - Integration point (to be implemented)

---

**Status:** SMS infrastructure complete, integration pending Phase 2 email service setup
