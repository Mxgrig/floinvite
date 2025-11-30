# Floinvite Notification System Roadmap

Progressive enhancement of notification capabilities from MVP to production-ready system.

---

## Phase 1: MVP Foundation (Current - No External APIs)

### Overview
**Goal:** Core visitor notification system with zero external dependencies.

**Key Principle:** Template-based message generation, displayed in UI. No actual email/SMS sending yet.

### What's Included ✅

#### 1. Notification Generation
- `generateVisitorArrivalNotification()` - First-time visitor
- `generateReturningVisitorNotification()` - Repeat visitor (30-day window)
- `generateExpectedGuestNotification()` - Pre-registered guest
- `generateNoShowNotification()` - Missing expected guest

#### 2. Template Options
```typescript
// Customizable message tone
tone: 'professional' | 'friendly' | 'casual'

// Include/exclude details
includeCompany: boolean
includeTime: boolean
```

#### 3. Display Mechanisms

**Option A: Toast Notification**
```typescript
showToast(`Message ready: "${notification.body}"`);
```

**Option B: Modal Dialog**
```jsx
<Modal open={true}>
  <h3>Notification for {host.name}</h3>
  <p>{notification.body}</p>
  <button onClick={copyToClipboard}>Copy to Clipboard</button>
</Modal>
```

**Option C: Summary Screen**
```jsx
<SuccessScreen>
  ✅ {guest.name} checked in successfully
  
  Message for {host.name}:
  "{notification.body}"
  
  [Copy] [Download] [Dismiss]
</SuccessScreen>
```

#### 4. User Actions

**Copy to Clipboard**
```typescript
await copyNotificationToClipboard(notification);
// User pastes into email/Teams/Slack
```

**Download as Text File**
```typescript
exportNotificationAsText(notification);
// User manually sends or archives
```

**Manual Email Input**
```jsx
<input 
  type="email" 
  value={notification.to}
  onChange={setRecipient}
/>
<button onClick={sendViaMailto}>
  Open in Email Client
</button>
```

### Implementation Steps

1. **Notification Service** ✅ DONE
   - File: `src/services/notificationService.ts`
   - 6 core functions implemented
   - Fully typed with TypeScript

2. **Type Definitions** ✅ DONE
   - File: `src/types.ts`
   - Guest, Host, GuestStatus enums
   - NotificationLog interface
   - All interfaces documented

3. **SmartTriage Integration** 📝 TODO
   - File: `src/components/SmartTriage.tsx`
   - Show notification after check-in success
   - Offer copy/download/email options
   - Auto-dismiss after 10 seconds

4. **SuccessScreen Component** 📝 TODO
   - File: `src/components/SuccessScreen.tsx`
   - Display post-check-in message
   - Show host notification text
   - Action buttons (copy, download, done)

5. **UI Toast Component** 📝 TODO
   - File: `src/components/Toast.tsx`
   - Success/error/info messages
   - Auto-dismiss logic
   - Stack management for multiple toasts

### Testing Checklist (Phase 1)

```
✓ Walk-in visitor check-in
  - Generate notification ✓
  - Display in UI ✓
  - Copy to clipboard works ✓
  - Download file works ✓

✓ Expected visitor check-in
  - Identify as expected ✓
  - Generate correct message ✓
  - Show different tone/style ✓

✓ Returning visitor (30-day)
  - Detect returning visitor ✓
  - Generate "welcome back" message ✓
  - Include last visit date ✓

✓ Notification content
  - Name, company, time included ✓
  - Professional tone readable ✓
  - No typos or broken formatting ✓

✓ UI/UX
  - Modal appears at right time ✓
  - Touch targets 48px minimum ✓
  - Mobile responsive ✓
```

### Success Criteria (Phase 1)

- ✅ Notification messages generated correctly
- ✅ All tones/styles work
- ✅ Copy to clipboard works on all browsers
- ✅ Download file creates valid text file
- ✅ Zero TypeScript errors
- ✅ No external APIs required
- ✅ User can manually send notifications
- ✅ Messages are professional and clear

### Storage & Data
- Notification logs stored in localStorage (optional)
- Key: `floinvite_notifications`
- Keep last 100 notifications
- Auto-trim older entries

---

## Phase 2: Email Integration (Week 3)

### Overview
**Goal:** Actual email sending via email service provider.

**Timeline:** After Phase 1 is solid and deployed.

### Options Evaluated

| Service | Pros | Cons | Cost |
|---------|------|------|------|
| **SendGrid** | Proven, 100 emails/day free | Need API key | Free-$30/mo |
| **Resend** | Modern, React-focused | Newer service | Free-$20/mo |
| **Mailgun** | Flexible, good docs | Complex setup | Free-$35/mo |
| **AWS SES** | Reliable, scalable | Need AWS account | Pay per email |
| **Nodemailer** | Works with any SMTP | Need backend | Free |

### Recommended: Resend (or SendGrid)

**Why Resend:**
- Modern API, great DX
- React email templates
- Free tier: 100 emails/day
- Good for SME use case
- Easy integration

**Why SendGrid:**
- Battle-tested
- Higher free tier
- Better documentation
- More integrations

### Implementation Steps

1. **Environment Setup**
   ```bash
   # Add to .env.production
   VITE_EMAIL_SERVICE=resend  # or sendgrid
   VITE_EMAIL_API_KEY=re_xxx...
   ```

2. **Email Service Wrapper**
   ```typescript
   // src/services/emailService.ts
   export const sendEmail = async (
     to: string,
     subject: string,
     body: string
   ): Promise<{ success: boolean; messageId?: string }> => {
     const apiKey = import.meta.env.VITE_EMAIL_API_KEY;
     
     if (!apiKey) {
       console.warn('Email service not configured');
       return { success: false };
     }
     
     // Resend API call
     return await fetch('https://api.resend.com/emails', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${apiKey}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         from: 'notifications@floinvite.com',
         to,
         subject,
         text: body
       })
     }).then(r => r.json());
   };
   ```

3. **Update Notification Service**
   ```typescript
   // In notificationService.ts
   export const sendNotificationEmail = async (
     notification: NotificationMessage,
     emailService: EmailService
   ): Promise<void> => {
     const result = await emailService.sendEmail(
       notification.to,
       notification.subject,
       notification.body
     );
     
     if (!result.success) {
       throw new Error(`Email failed: ${result.error}`);
     }
     
     logNotification({
       guestId: guest.id,
       hostId: host.id,
       status: 'sent',
       sentAt: new Date().toISOString()
     });
   };
   ```

4. **Host Notification Preferences**
   ```typescript
   // Update Host interface
   interface Host {
     // ... existing fields
     notifyByEmail: boolean;
     emailPreference: 'always' | 'never' | 'quiet_hours';
     quietHoursStart?: string; // HH:MM
     quietHoursEnd?: string;   // HH:MM
   }
   ```

5. **Backend API Endpoint** (Optional)
   ```typescript
   // If deploying to Vercel/Netlify with serverless functions
   // api/send-notification.ts
   export default async function handler(req, res) {
     const { notification, hostId } = req.body;
     
     try {
       const result = await resend.emails.send({
         from: 'notifications@floinvite.com',
         to: notification.to,
         subject: notification.subject,
         text: notification.body
       });
       
       res.status(200).json({ success: true, messageId: result.id });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   }
   ```

### Testing Checklist (Phase 2)

```
✓ Email Service Integration
  - API key loads correctly
  - Send request succeeds
  - Email arrives in inbox
  - HTML formatting looks good

✓ Error Handling
  - Invalid API key shows error
  - Network failure handled gracefully
  - Retry logic works
  - User sees meaningful message

✓ Notification Logs
  - Sent emails logged
  - Status tracked (sent/failed)
  - Timestamp recorded
  - Email address stored

✓ Performance
  - Email sends <2 seconds
  - Doesn't block UI
  - Loading spinner shows
  - Toast confirms success
```

### Fallback Strategy
```typescript
// If email service fails, fall back to Phase 1
try {
  await sendNotificationEmail(notification, emailService);
} catch (error) {
  console.warn('Email failed, showing copy option:', error);
  showCopyNotificationUI(notification);
}
```

---

## Phase 3: Multi-Channel Notifications (Week 4+)

### Overview
**Goal:** Reach hosts via multiple channels (SMS, Teams, Slack, webhook).

**Timeline:** After email is stable.

### Channels

#### 1. SMS Notifications
```typescript
// Option A: Email-to-SMS gateway (free)
const smsGateway = SMS_GATEWAYS['vodafone']; // @vodafone.net
const smsEmail = `${phoneNumber}${smsGateway}`;

await sendEmail(smsEmail, '', `${guest.name} arrived`);

// Option B: Twilio (paid, more reliable)
const twilio = require('twilio');
await twilio.messages.create({
  to: host.phone,
  from: '+1234567890',
  body: notification.body
});

// Option C: AWS SNS (enterprise)
const sns = new AWS.SNS();
await sns.publish({
  PhoneNumber: host.phone,
  Message: notification.body
}).promise();
```

#### 2. Microsoft Teams Integration
```typescript
// Send to Teams channel webhook
const teamsWebhook = host.teamsWebhook; // User provides

await fetch(teamsWebhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Visitor: ${guest.name}`,
    themeColor: '0078D4',
    sections: [{
      activityTitle: `${guest.name} has arrived`,
      activitySubtitle: `Visiting ${host.name}`,
      facts: [
        { name: 'Company', value: guest.company || 'N/A' },
        { name: 'Time', value: new Date().toLocaleTimeString() },
        { name: 'Location', value: 'Reception' }
      ]
    }]
  })
});
```

#### 3. Slack Integration
```typescript
// Send to Slack channel webhook
const slackWebhook = host.slackWebhook;

await fetch(slackWebhook, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: `New visitor: ${guest.name}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${guest.name}* from *${guest.company}* just arrived!`
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Visiting:*\n${host.name}` },
          { type: 'mrkdwn', text: `*Time:*\n${new Date().toLocaleTimeString()}` }
        ]
      }
    ]
  })
});
```

#### 4. Custom Webhooks
```typescript
// User can define any webhook endpoint
interface NotificationChannel {
  type: 'email' | 'sms' | 'teams' | 'slack' | 'webhook';
  enabled: boolean;
  config: {
    webhookUrl?: string;
    format?: 'json' | 'plain' | 'html';
    headers?: Record<string, string>;
  };
}

// Send to custom webhook
const sendToWebhook = async (
  webhookUrl: string,
  notification: NotificationMessage,
  format: 'json' | 'plain'
): Promise<void> => {
  const payload = format === 'json'
    ? notification
    : { text: notification.body };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
};
```

### Updated Host Interface
```typescript
interface Host {
  // ... existing fields
  
  // Notification preferences
  notifyByEmail: boolean;
  notifyBySMS: boolean;
  notifyBySlack: boolean;
  notifyByTeams: boolean;
  notifyByWebhook: boolean;
  
  // Channel configuration
  smsCarrier?: 'vodafone' | 'ee' | 'o2' | 'three' | 'tmobile' | 'att' | 'verizon';
  slackWebhook?: string;
  teamsWebhook?: string;
  customWebhook?: string;
  
  // Preferences
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string;   // HH:MM
  dailyLimit?: number; // Max notifications per day
}
```

### Notification Dispatch
```typescript
// Route notification to enabled channels
export const dispatchNotification = async (
  notification: NotificationMessage,
  host: Host,
  emailService: EmailService
): Promise<NotificationResult> => {
  const results = {
    email: null,
    sms: null,
    slack: null,
    teams: null,
    webhook: null
  };

  // Check quiet hours
  if (isInQuietHours(host)) {
    return { success: false, reason: 'Quiet hours active' };
  }

  // Check daily limit
  if (exceedsDailyLimit(host)) {
    return { success: false, reason: 'Daily limit exceeded' };
  }

  // Send via enabled channels
  if (host.notifyByEmail) {
    try {
      await sendNotificationEmail(notification, emailService);
      results.email = { success: true };
    } catch (error) {
      results.email = { success: false, error: error.message };
    }
  }

  if (host.notifyBySMS && host.smsCarrier) {
    try {
      await sendSMS(host.phone, notification.body, host.smsCarrier);
      results.sms = { success: true };
    } catch (error) {
      results.sms = { success: false, error: error.message };
    }
  }

  if (host.notifyBySlack && host.slackWebhook) {
    try {
      await sendToSlack(host.slackWebhook, notification);
      results.slack = { success: true };
    } catch (error) {
      results.slack = { success: false, error: error.message };
    }
  }

  // ... Teams and webhook similarly

  return {
    success: Object.values(results).some(r => r?.success),
    results
  };
};
```

### Settings Page (Phase 3)
```jsx
<HostNotificationSettings host={host} onUpdate={updateHost}>
  <h3>Notification Preferences</h3>
  
  <CheckboxGroup>
    <Checkbox label="Email" checked={host.notifyByEmail} />
    <Checkbox label="SMS" checked={host.notifyBySMS} />
    <Checkbox label="Slack" checked={host.notifyBySlack} />
    <Checkbox label="Teams" checked={host.notifyByTeams} />
  </CheckboxGroup>

  {host.notifyBySMS && (
    <SelectField label="SMS Carrier" options={CARRIERS} />
  )}

  {host.notifyBySlack && (
    <TextInput 
      label="Slack Webhook URL" 
      value={host.slackWebhook}
    />
  )}

  {host.notifyByTeams && (
    <TextInput 
      label="Teams Webhook URL" 
      value={host.teamsWebhook}
    />
  )}

  <QuietHours host={host} />
  <DailyLimit host={host} />
</HostNotificationSettings>
```

### Testing Checklist (Phase 3)

```
✓ Email
  - Already tested in Phase 2

✓ SMS (Email Gateway)
  - Message arrives as SMS
  - Phone number formatted correctly
  - Carrier selected properly

✓ SMS (Twilio)
  - API key configured
  - Message sends successfully
  - Cost tracking works

✓ Slack
  - Webhook accepts request
  - Message formats correctly
  - Link previews work

✓ Teams
  - Webhook accepts request
  - Card renders properly
  - Actions work (if included)

✓ Custom Webhook
  - JSON payload valid
  - Webhook receives POST
  - Status codes handled

✓ Multi-channel
  - All enabled channels receive notification
  - Failed channel doesn't block others
  - Log shows which succeeded/failed

✓ Preferences
  - Email toggle works
  - SMS toggle works
  - Quiet hours respected
  - Daily limit enforced
```

---

## Implementation Timeline

```
PHASE 1 (Now - Week 2)
├─ ✅ Notification service complete
├─ ✅ Type definitions complete
├─ 📝 SmartTriage component integration
├─ 📝 SuccessScreen component
├─ 📝 Toast/Modal components
└─ Deploy to Hostinger

PHASE 2 (Week 3-4)
├─ 📝 Choose email service (Resend/SendGrid)
├─ 📝 Email service integration
├─ 📝 Settings UI for email preferences
├─ 📝 Error handling & retries
├─ 📝 Notification log storage
└─ Test email delivery

PHASE 3 (Week 5+)
├─ 📝 SMS integration (optional)
├─ 📝 Slack integration
├─ 📝 Teams integration
├─ 📝 Custom webhook support
├─ 📝 Multi-channel dispatch logic
└─ Test all channels
```

---

## Decision Matrix

| Decision | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|
| Email Sending | Template only | Resend/SendGrid | ✓ Active |
| SMS | Not supported | Not in Phase 2 | Optional |
| Slack/Teams | Not supported | Not in Phase 2 | Optional |
| External APIs | Zero | Minimal (1) | Many |
| Complexity | Low | Medium | High |
| User Experience | Good | Better | Best |
| Cost | $0 | $0-20/mo | $0-50/mo |

---

## Rollback Strategy

If Phase 2 email service fails:
```typescript
if (emailSendFailed) {
  // Fall back to Phase 1
  showCopyNotificationUI(notification);
  logWarning('Email service unavailable, user can copy message');
}
```

If Phase 3 multi-channel breaks:
```typescript
try {
  await dispatchNotification(notification, host);
} catch (error) {
  // Fall back to email only
  await sendNotificationEmail(notification, emailService);
}
```

---

## Success Metrics

### Phase 1
- ✅ Zero external dependencies
- ✅ <30 second check-in flow
- ✅ 100% test coverage on notification generation
- ✅ All tone/style variants work

### Phase 2
- ✅ 99% email delivery rate
- ✅ Email arrives <2 seconds after check-in
- ✅ Notification logs accurate
- ✅ User satisfactionrating ≥4/5

### Phase 3
- ✅ Multi-channel delivery working
- ✅ Respect for user preferences (quiet hours, limits)
- ✅ Zero duplicate notifications
- ✅ Fallback chains working

---

## Notes

- **Security:** Never log API keys in console
- **Privacy:** Only send notifications to configured addresses
- **Compliance:** GDPR - users can opt-out of all notifications
- **Monitoring:** Log all send attempts with timestamps
- **Testing:** Use mock email service in development

---

**Last Updated:** November 2024
**Status:** Phase 1 implementation in progress
**Next Review:** After Phase 1 deployment
