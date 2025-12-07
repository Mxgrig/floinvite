# Stripe Connect Implementation Plan

**Date**: December 7, 2024
**Status**: 📋 Planned (Work Tomorrow)
**Priority**: High - Revenue Critical

---

## 📌 Overview

Stripe Connect enables Floinvite to:
1. **Accept payments from customers** (SaaS subscription model)
2. **Process recurring billing** (monthly/yearly plans)
3. **Handle payouts** (future: creator/partner revenue sharing)
4. **Manage customer billing portal** (invoices, payment methods)

Current state: Stripe API integrated but Connect flow not implemented.

---

## 🎯 Goals

### Phase 1 (MVP - Tomorrow's Work)
- [ ] Implement Stripe checkout for pricing tiers
- [ ] Handle successful payment webhook
- [ ] Create customer records in database
- [ ] Set up subscription management
- [ ] Redirect to app after successful payment

### Phase 2 (Week 2)
- [ ] Billing portal for customers
- [ ] Manage subscription upgrades/downgrades
- [ ] Subscription cancellation flow
- [ ] Invoice generation and email

### Phase 3 (Future)
- [ ] Revenue sharing for partner program
- [ ] Express accounts for partners
- [ ] Payout dashboard
- [ ] Advanced reporting

---

## 🏗️ Architecture

### Current Setup
```
Frontend (React)
  ↓
PaymentService.ts (exists but incomplete)
  ↓
Stripe API (https://api.stripe.com)
  ↓
Backend handler needed
```

### What Needs to be Built
```
Frontend (React)
  ↓ [Pricing page with Checkout]
  ↓
/api/create-checkout-session (backend endpoint)
  ↓ [Create Stripe checkout session]
  ↓
Stripe Checkout Page (hosted)
  ↓ [Customer enters payment]
  ↓
Stripe → Webhook to /api/webhooks/checkout
  ↓ [Verify payment, create customer record]
  ↓
Redirect to /app/dashboard
```

---

## 📋 Implementation Checklist

### 1. Backend Endpoints Needed

#### POST /api/create-checkout-session
```
Input:
{
  "tierId": "starter|professional|enterprise",
  "billingCycle": "month|year",
  "customerId": "optional (for upgrades)"
}

Output:
{
  "sessionId": "cs_123...",
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

#### POST /api/webhooks/checkout
```
Stripe event: checkout.session.completed
{
  "id": "cs_123...",
  "customer": "cus_123...",
  "subscription": "sub_123...",
  "metadata": {
    "tierId": "starter",
    "customerId": "user_local_id"
  }
}
```

#### GET /api/subscriptions/:customerId
```
Returns: Active subscription details
{
  "id": "sub_123...",
  "tierId": "professional",
  "status": "active",
  "currentPeriodEnd": "2025-01-07",
  "billingCycle": "month"
}
```

### 2. Database Schema Needed

#### customers table
```sql
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  tier_id TEXT (starter|professional|enterprise),
  billing_cycle TEXT (month|year),
  subscription_status TEXT (active|paused|canceled),
  current_period_end DATETIME,
  email TEXT,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### subscriptions table
```sql
CREATE TABLE subscriptions (
  id TEXT PRIMARY KEY,
  stripe_subscription_id TEXT UNIQUE,
  customer_id TEXT FOREIGN KEY,
  tier_id TEXT,
  billing_cycle TEXT,
  status TEXT,
  amount_paid INTEGER (cents),
  current_period_start DATETIME,
  current_period_end DATETIME,
  next_billing_date DATETIME,
  cancellation_date DATETIME,
  created_at DATETIME,
  updated_at DATETIME
);
```

#### invoices table
```sql
CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  stripe_invoice_id TEXT UNIQUE,
  customer_id TEXT FOREIGN KEY,
  subscription_id TEXT FOREIGN KEY,
  amount INTEGER (cents),
  status TEXT (paid|unpaid|void),
  invoice_url TEXT,
  due_date DATETIME,
  paid_at DATETIME,
  created_at DATETIME
);
```

### 3. Environment Variables

#### .env.production
```env
# Stripe Keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51234567890...
STRIPE_SECRET_KEY=sk_live_123456789...

# Webhook Signing
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_123456789...

# URLs
STRIPE_CHECKOUT_SUCCESS_URL=https://floinvite.com/app/dashboard?checkout=success
STRIPE_CHECKOUT_CANCEL_URL=https://floinvite.com/pricing?checkout=canceled
```

#### .env.development
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890...
STRIPE_SECRET_KEY=sk_test_123456789...
STRIPE_WEBHOOK_SIGNING_SECRET=whsec_test_123456789...
```

---

## 💻 Code Files to Update/Create

### Files to Create
```
src/
├── services/
│   └── stripeConnectService.ts (NEW - Checkout session creation)
├── api/
│   ├── create-checkout-session.ts (NEW - Backend endpoint)
│   └── webhooks/
│       └── stripe-checkout.ts (NEW - Webhook handler)
└── types/
    └── stripe.ts (NEW - Type definitions)
```

### Files to Update
```
src/
├── components/
│   └── Pricing.tsx (ADD - Checkout flow instead of Stripe links)
├── App.tsx (ADD - Redirect handling after checkout)
└── services/
    └── paymentService.ts (UPDATE - Use new endpoints)
```

---

## 🔑 Stripe Account Setup

### Prerequisites
- [x] Stripe account created
- [x] Test mode API keys obtained
- [ ] Live mode API keys (when ready)
- [ ] Webhook endpoint configured
- [ ] Customer email notifications enabled
- [ ] Email receipts enabled

### Live Mode Setup (When Ready)
```
1. Go to https://dashboard.stripe.com/settings/account
2. Activate live mode
3. Copy live API keys
4. Update .env.production
5. Configure webhook signing secret
6. Test with small transaction
```

---

## 🔌 Webhook Configuration

### Current Webhook Endpoint
```
https://floinvite.com/api/webhooks/checkout
```

### Events to Listen For
- `checkout.session.completed` - Payment successful
- `customer.subscription.updated` - Plan change
- `customer.subscription.deleted` - Cancellation
- `invoice.paid` - Invoice payment confirmed
- `invoice.payment_failed` - Payment failed

### Webhook Verification
```typescript
// Verify Stripe signature
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  process.env.STRIPE_WEBHOOK_SIGNING_SECRET
);
```

---

## 📊 Pricing Tier Configuration in Stripe

### Stripe Price IDs (From pricingService.ts)
```
Starter Plan:
- Monthly: price_starter_monthly ($5)
- Yearly: price_starter_yearly ($48)

Professional Plan:
- Monthly: price_professional_monthly ($10)
- Yearly: price_professional_yearly ($120)

Enterprise Plan:
- Custom pricing (contact sales)
```

### Create Products in Stripe Dashboard
1. Go to https://dashboard.stripe.com/products
2. Create product: "Floinvite Starter"
   - Price: $5/month, $48/year
3. Create product: "Floinvite Professional"
   - Price: $10/month, $120/year
4. Create product: "Floinvite Enterprise"
   - Custom pricing (one-off)

---

## 🔄 Payment Flow

### Step 1: User Clicks "Upgrade"
```
User on /pricing page clicks "Upgrade to Pro"
  ↓
onClick handler calls PaymentService.createCheckoutSession()
  ↓
POST /api/create-checkout-session
  {
    tierId: "professional",
    billingCycle: "month"
  }
```

### Step 2: Create Checkout Session
```
Backend receives request
  ↓
Create Stripe checkout session
  {
    line_items: [{
      price: "price_professional_monthly",
      quantity: 1
    }],
    mode: "subscription",
    success_url: "https://floinvite.com/app/dashboard?checkout=success",
    cancel_url: "https://floinvite.com/pricing?checkout=canceled",
    metadata: {
      tierId: "professional",
      billingCycle: "month"
    }
  }
  ↓
Return { sessionId, checkoutUrl }
```

### Step 3: Redirect to Checkout
```
Frontend redirects to Stripe Checkout URL
  ↓
Customer fills payment info
  ↓
Stripe processes payment
```

### Step 4: Payment Success Webhook
```
Stripe sends webhook: checkout.session.completed
  ↓
Backend verifies signature
  ↓
Create/update customer record
{
  stripe_customer_id: "cus_123...",
  stripe_subscription_id: "sub_123...",
  tier_id: "professional",
  status: "active"
}
  ↓
Send confirmation email
```

### Step 5: Redirect to App
```
After webhook processed (2-3 seconds)
  ↓
Customer redirected to /app/dashboard
  ↓
Dashboard checks subscription status
  ↓
Features unlocked based on tier
```

---

## 🧪 Testing

### Test Card Numbers (Stripe provides)
```
Successful payment:
4242 4242 4242 4242

Requires authentication:
4000 0027 6000 3184

Declined:
4000 0000 0000 0002
```

### Test Webhook Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:5173/api/webhooks/checkout

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 🚀 Implementation Order (Tomorrow)

### Hour 1: Backend Setup
- [ ] Create database schema
- [ ] Create `/api/create-checkout-session` endpoint
- [ ] Add Stripe secret key handling

### Hour 2: Webhook Handler
- [ ] Create `/api/webhooks/checkout` endpoint
- [ ] Implement signature verification
- [ ] Save customer/subscription to database

### Hour 3: Frontend Integration
- [ ] Update Pricing.tsx checkout handler
- [ ] Redirect to Stripe checkout on button click
- [ ] Handle success/cancel redirects

### Hour 4: Testing & Refinement
- [ ] Test with Stripe test cards
- [ ] Test webhook flow locally
- [ ] Handle error cases
- [ ] Add success message

---

## 🐛 Error Handling

### Scenarios to Handle
```
1. Stripe API errors
   - Network timeout
   - Invalid price ID
   - Customer already exists

2. Webhook failures
   - Missing signature
   - Invalid signature
   - Duplicate event processing

3. Payment failures
   - Card declined
   - Insufficient funds
   - Expired card

4. Database errors
   - Duplicate customer record
   - Connection timeout
```

### Error Responses
```typescript
// Checkout creation failure
{
  error: "Failed to create checkout session",
  message: "Invalid price ID provided"
}

// Webhook verification failure
{
  error: "Webhook signature verification failed"
}

// Payment processing failure
{
  error: "Payment declined",
  code: "card_declined"
}
```

---

## 📈 Future Enhancements (Phase 2+)

### Billing Portal
```
Customer portal URL: https://billing.stripe.com/...
- View invoices
- Download receipts
- Update payment method
- Cancel subscription
- View subscription details
```

### Upgrade/Downgrade Flow
```
Current: Professional monthly
User wants: Professional yearly

Process:
1. Create new subscription (yearly)
2. Pro-rate credit from old subscription
3. Cancel old subscription
4. Update database
5. Send confirmation email
```

### Revenue Sharing
```
When ready for partner program:
- Create Express accounts for partners
- Set up Payout to partner accounts
- Create dashboard showing earnings
- Implement in /api/partners endpoints
```

---

## 📞 Support References

### Stripe Documentation
- https://stripe.com/docs/billing/subscriptions
- https://stripe.com/docs/payments/checkout
- https://stripe.com/docs/webhooks
- https://stripe.com/docs/testing

### Related Files to Review
- `src/services/paymentService.ts` - Existing Stripe integration
- `src/services/pricingService.ts` - Pricing tier definitions
- `src/components/Pricing.tsx` - Current checkout UI
- `.env.production` - Environment variables

---

## ✅ Success Criteria

After implementation, you should be able to:
- [ ] Click "Upgrade" on pricing page
- [ ] Be redirected to Stripe checkout
- [ ] Enter test card (4242 4242 4242 4242)
- [ ] Complete payment successfully
- [ ] Receive webhook confirmation
- [ ] Be redirected to dashboard
- [ ] See "Professional" plan active in settings
- [ ] All app features unlocked for tier

---

## 📝 Notes for Tomorrow

- Start with test mode (no real payments yet)
- Use Stripe CLI for local webhook testing
- Keep webhook secret safe (don't commit to Git)
- Test with both monthly and yearly plans
- Verify database records created correctly
- Check Stripe dashboard for successful charges

---

## 🔗 Quick Links

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Test API Keys**: https://dashboard.stripe.com/test/apikeys
- **Webhook Management**: https://dashboard.stripe.com/test/webhooks
- **Test Card Numbers**: https://stripe.com/docs/testing
- **Documentation**: https://stripe.com/docs

---

**Status**: Ready to implement
**Estimated Time**: 4-6 hours
**Complexity**: Medium
**Dependencies**: Stripe API keys, Backend setup

---

**Created**: December 7, 2024
**Next Work**: December 8, 2024
