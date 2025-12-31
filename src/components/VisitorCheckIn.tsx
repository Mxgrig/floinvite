/**
 * VisitorCheckIn Component
 * Two-path welcome screen for visitor check-in (Front Desk Mode)
 * This is the guest-facing interface for checking in at reception
 * Path 1: Walk-in visitor
 * Path 2: Expected visitor lookup
 */

import { useState, useEffect, type ReactNode } from 'react';
import { UserCheck, Calendar, Mail, Phone, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { Guest, Host, GuestStatus, AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { emailService } from '../services/emailService';
import { ServerPaymentService } from '../services/serverPaymentService';
import { LoopingVideo } from './LoopingVideo';
import {
  generateVisitorArrivalNotification,
  generateReturningVisitorNotification
} from '../services/notificationService';
import { validateGuestName } from '../utils/validators';
import { usePersistedState } from '../utils/hooks';
import { isEmailReady, getActiveChannels } from '../utils/notificationConfig';
import { GUEST_STATUS, STORAGE_KEYS } from '../utils/constants';
import { hasFeature } from '../utils/featureGating';
import { UsageTracker } from '../utils/usageTracker';
import { FeatureLocked } from './FeatureLocked';
import { dbUtils } from '../db/floinviteDB';
import './VisitorCheckIn.css';

type TriageStep = 'welcome' | 'walk-in' | 'expected' | 'success';

interface NotificationStatus {
  type: 'pending' | 'success' | 'error';
  message: string;
}

export function VisitorCheckIn() {
  const [step, setStep] = useState<TriageStep>('welcome');
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [settings] = usePersistedState<AppSettings>(STORAGE_KEYS.settings, {
    businessName: 'My Company',
    notificationEmail: 'admin@floinvite.com',
    kioskMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [userTier] = usePersistedState<'starter' | 'compliance' | 'enterprise'>('floinvite_user_tier', 'starter');
  const guests = StorageService.getGuests();
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  // Walk-in state
  const [guestName, setGuestName] = useState('');
  const [company, setCompany] = useState('');
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<string>('60'); // minutes
  const [lastGuest, setLastGuest] = useState<Guest | null>(null);

  // Expected visitor state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);

  // Error state
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize notification config on mount
  useEffect(() => {
    const emailReady = isEmailReady();
    console.log('🔧 SmartTriage initialized');
    console.log('📊 Hosts loaded:', hosts.length);
    console.log('📧 Email service status:', emailReady ? 'READY' : 'DISABLED (Phase 1)');
    
    if (hosts.length > 0) {
      console.log('📋 Hosts:', hosts.map(h => ({
        name: h.name,
        email: h.email,
        notificationMethod: h.notificationMethod || 'default'
      })));
    }
  }, [hosts]);


  /**
   * Determine notification method with fallback defaults
   */
  const getNotificationMethod = (host: Host): string => {
    return host.notificationMethod || 'email'; // Default to email if not set
  };

  /**
   * Send email notification
   * Note: Never blocks check-in - guest is saved regardless of notification status
   */
  const sendEmailNotification = async (emailNotification: {
    to: string;
    subject: string;
    body: string;
  }): Promise<void> => {
    console.log('📧 Sending email notification to:', emailNotification.to);

    try {
      const result = await emailService.send({
        ...emailNotification,
        emailType: 'notification'
      });
      if (result.success) {
        setNotificationStatus({
          type: 'success',
          message: `✅ Email notification sent to ${emailNotification.to}`
        });
        console.log('✅ Email sent successfully:', result.messageId);

        // Auto-clear success message after 3 seconds
        setTimeout(() => setNotificationStatus(null), 3000);
      } else {
        // Show error but don't block check-in flow
        setNotificationStatus({
          type: 'error',
          message: `⚠️ Notification warning: ${result.error || 'Email not sent'}`
        });
        console.warn('⚠️ Email notification failed:', result.error);

        // Auto-clear error message after 5 seconds so user can see it
        setTimeout(() => setNotificationStatus(null), 5000);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setNotificationStatus({
        type: 'error',
        message: `⚠️ Notification failed: ${errorMsg}`
      });
      console.warn('⚠️ Email service error:', error);

      // Auto-clear error message after 5 seconds
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  /**
   * Walk-In Path
   */
  const handleWalkIn = () => {
    setStep('walk-in');
    setErrors([]);
    setNotificationStatus(null);
  };

  const handleCheckInWalkIn = async () => {
    const newErrors: string[] = [];

    // Validate name
    const nameValidation = validateGuestName(guestName);
    if (!nameValidation.isValid) {
      newErrors.push(...nameValidation.errors);
    }

    // Validate host selected
    if (!selectedHost) {
      newErrors.push('Please select who you are visiting');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check payment enforcement server-side - prevents exceeding 20-item free tier limit
    // This is enforced by backend and cannot be bypassed
    const userEmail = localStorage.getItem('floinvite_user_email') || settings.notificationEmail || '';
    if (!userEmail) {
      newErrors.push('Account email required to verify subscription status.');
      setErrors(newErrors);
      return;
    }
    if (userEmail) {
      const [currentHosts, currentGuests] = await Promise.all([
        dbUtils.getAllHosts().then(result => result.length),
        dbUtils.getAllGuests().then(result => result.length)
      ]);

      const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
        userEmail,
        'checkin',
        currentHosts,
        currentGuests
      );

      if (!operationCheck.allowed) {
        newErrors.push(
          operationCheck.message || 'You have reached the free tier limit. Continue on Starter for $29/month, or upgrade to Compliance+.'
        );
        setErrors(newErrors);
        return;
      }
    }

    // Find host to notify
    const host = hosts.find(h => h.id === selectedHost);
    if (!host) {
      setErrors(['Host not found']);
      return;
    }

    console.log('✅ Host found:', host.name);
    console.log('📋 Host notification method:', getNotificationMethod(host));

    // Create guest record with estimated departure time
    const now = new Date().toISOString();
    const estimatedDeparture = new Date(Date.now() + parseInt(estimatedDuration) * 60 * 1000).toISOString();

    const guest: Guest = {
      id: crypto.randomUUID(),
      name: guestName.trim(),
      company: company.trim() || undefined,
      hostId: selectedHost,
      checkInTime: now,
      estimatedDepartureTime: estimatedDeparture,
      status: GUEST_STATUS.CHECKED_IN as GuestStatus,
      visitCount: 1,
      createdAt: now,
      updatedAt: now
    };

    // Log estimated departure
    console.log('⏰ Estimated departure:', new Date(estimatedDeparture).toLocaleTimeString());

    // Save to storage
    StorageService.addGuest(guest);
    console.log('💾 Guest saved:', guest.name);

    // Determine notification method (default to email)
    const notificationMethod = getNotificationMethod(host);

    // Send notifications based on host's preference
    if (notificationMethod === 'email' || notificationMethod === 'both') {
      console.log('📧 Triggering email notification...');
      const emailNotification = generateVisitorArrivalNotification(guest, host, {
        includeCompany: true,
        tone: 'compliance'
      });
      console.log('📧 Email notification object:', emailNotification);
      await sendEmailNotification(emailNotification);
    }

    console.log('✨ Check-in complete for:', guest.name);
    setLastGuest(guest);
    setStep('success');

    // Set up auto-checkout timer based on estimated departure
    const estimatedDepartureTime = new Date(estimatedDeparture).getTime();
    const timeUntilDeparture = estimatedDepartureTime - Date.now();

    if (timeUntilDeparture > 0) {
      const autoCheckoutTimer = setTimeout(() => {
        console.log(`✅ Auto-checking out ${guest.name} after ${estimatedDuration} minutes`);
        const updatedGuest: Guest = {
          ...guest,
          checkOutTime: new Date().toISOString(),
          status: GUEST_STATUS.CHECKED_OUT as GuestStatus,
          updatedAt: new Date().toISOString()
        };
        StorageService.updateGuest(guest.id, updatedGuest);
        console.log('📋 Guest auto-checked out:', guest.name);
      }, timeUntilDeparture);

      // Store timer ID for cleanup if needed
      console.log('⏱️ Auto-checkout scheduled for:', new Date(estimatedDepartureTime).toLocaleTimeString());
    }

    // Reset form (only for non-WhatsApp notifications)
    setTimeout(() => {
      setGuestName('');
      setCompany('');
      setSelectedHost('');
      setEstimatedDuration('60');
      setNotificationStatus(null);
      setStep('welcome');
    }, 3000);
  };

  /**
   * Expected Visitor Path
   */
  const handleExpected = () => {
    setStep('expected');
    setErrors([]);
    setSearchQuery('');
    setSearchResults([]);
    setNotificationStatus(null);
  };

  const handleSearchExpected = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const allGuests = StorageService.getGuests();
    const expectedGuests = allGuests.filter(g => g.preRegistered && g.status === GUEST_STATUS.EXPECTED);
    const lowerQuery = query.toLowerCase();

    const results = expectedGuests.filter(g =>
      g.name.toLowerCase().includes(lowerQuery) ||
      g.email?.toLowerCase().includes(lowerQuery) ||
      g.phone?.includes(lowerQuery)
    );

    setSearchResults(results);
  };

  const handleCheckInExpected = async (guestId: string) => {
    // Check payment enforcement server-side - prevents exceeding 20-item free tier limit
    const userEmail = localStorage.getItem('floinvite_user_email') || settings.notificationEmail || '';
    if (!userEmail) {
      setErrors(['Account email required to verify subscription status.']);
      return;
    }
    if (userEmail) {
      const [currentHosts, currentGuests] = await Promise.all([
        dbUtils.getAllHosts().then(result => result.length),
        dbUtils.getAllGuests().then(result => result.length)
      ]);

      const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
        userEmail,
        'checkin',
        currentHosts,
        currentGuests
      );

      if (!operationCheck.allowed) {
        setErrors([
          operationCheck.message || 'You have reached the free tier limit. Continue on Starter for $29/month, or upgrade to Compliance+.'
        ]);
        return;
      }
    }

    const guest = StorageService.getGuest(guestId);
    if (!guest) return;

    // Update guest status to checked in
    const updatedGuest = {
      ...guest,
      status: GUEST_STATUS.CHECKED_IN as GuestStatus,
      checkInTime: new Date().toISOString(),
      visitCount: (guest.visitCount || 0) + 1
    };

    StorageService.updateGuest(guestId, updatedGuest);

    const host = hosts.find(h => h.id === guest.hostId);
    if (host) {
      const notificationMethod = getNotificationMethod(host);

      // Send notifications based on host's preference
      if (notificationMethod === 'email' || notificationMethod === 'both') {
        const emailNotification = generateVisitorArrivalNotification(updatedGuest, host, {
          tone: 'friendly'
        });
        await sendEmailNotification(emailNotification);
      }

    }

    setLastGuest(updatedGuest);
    setStep('success');

    // Reset form
    setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
      setNotificationStatus(null);
      setStep('welcome');
    }, 3000);
  };

  const renderLayout = (content: ReactNode) => (
    <div className="checkin-page">
      <LoopingVideo source="/sessionlogin.mp4" fallbackColor="#0b1220" />
      <div className="checkin-content">
        {content}
      </div>
    </div>
  );

  /**
   * Check if expected guests feature is available
   */
  const canUseExpected = hasFeature(userTier, 'expected_guests');

  /**
   * Render by step
   */
  switch (step) {
    case 'welcome':
      return renderLayout(<WelcomeStep onWalkIn={handleWalkIn} onExpected={handleExpected} canUseExpected={canUseExpected} userTier={userTier} />);

    case 'walk-in':
      return renderLayout(
        <WalkInStep
          guestName={guestName}
          setGuestName={setGuestName}
          company={company}
          setCompany={setCompany}
          selectedHost={selectedHost}
          setSelectedHost={setSelectedHost}
          estimatedDuration={estimatedDuration}
          setEstimatedDuration={setEstimatedDuration}
          hosts={hosts}
          errors={errors}
          onCheckIn={handleCheckInWalkIn}
          onBack={() => setStep('welcome')}
        />
      );

    case 'expected':
      return renderLayout(
        <ExpectedStep
          searchQuery={searchQuery}
          onSearch={handleSearchExpected}
          searchResults={searchResults}
          hosts={hosts}
          onCheckIn={handleCheckInExpected}
          onBack={() => setStep('welcome')}
        />
      );

    case 'success':
      return renderLayout(<SuccessStep guest={lastGuest!} host={hosts.find(h => h.id === lastGuest!.hostId)!} />);
  }
}

/**
 * Welcome Screen - Two Path Options
 */
function WelcomeStep({
  onWalkIn,
  onExpected,
  canUseExpected,
  userTier
}: {
  onWalkIn: () => void;
  onExpected: () => void;
  canUseExpected: boolean;
  userTier: 'starter' | 'compliance' | 'enterprise';
}) {
  return (
    <div className="triage-panel">
      <div className="welcome-header">
        <h1>Welcome to Reception</h1>
        <p className="muted">Sign in to get started</p>
      </div>

      <div className="path-buttons">
        <button className="path-button walk-in" onClick={onWalkIn}>
          <div className="path-icon">
            <UserCheck size={48} strokeWidth={1.5} />
          </div>
          <div className="path-text">
            <h2>I'm a new visitor</h2>
            <p>Visiting without an appointment</p>
          </div>
        </button>

        {canUseExpected ? (
          <button className="path-button expected" onClick={onExpected}>
            <div className="path-icon">
              <Calendar size={48} strokeWidth={1.5} />
            </div>
            <div className="path-text">
              <h2>I'm expected</h2>
              <p>Already scheduled or returning visitor</p>
            </div>
          </button>
        ) : (
          <div className="path-button expected locked" style={{ cursor: 'default', opacity: 0.6 }}>
            <div className="path-icon" style={{ position: 'relative' }}>
              <Calendar size={48} strokeWidth={1.5} />
              <Lock size={20} style={{ position: 'absolute', bottom: -4, right: -4, color: '#dc2626' }} />
            </div>
            <div className="path-text">
              <h2>I'm expected</h2>
              <p style={{ fontSize: '0.85rem', color: '#dc2626' }}>Upgrade to unlock</p>
            </div>
          </div>
        )}
      </div>

      {!canUseExpected && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '24px',
          color: '#92400e'
        }}>
          <strong>Expected Guest Lookup - Upgrade to Unlock</strong>
          <p style={{ fontSize: '0.9rem', marginTop: '8px', marginBottom: 0 }}>
            Unlock expected guest lookup with Starter tier ($29/month after 20 items) or upgrade to Compliance+ ($49/month) for returning visitor tracking and advanced features.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Walk-In Path - New Guest Check-in
 */
function WalkInStep({
  guestName,
  setGuestName,
  company,
  setCompany,
  selectedHost,
  setSelectedHost,
  estimatedDuration,
  setEstimatedDuration,
  hosts,
  errors,
  onCheckIn,
  onBack
}: {
  guestName: string;
  setGuestName: (val: string) => void;
  company: string;
  setCompany: (val: string) => void;
  selectedHost: string;
  setSelectedHost: (val: string) => void;
  estimatedDuration: string;
  setEstimatedDuration: (val: string) => void;
  hosts: Host[];
  errors: string[];
  onCheckIn: () => void;
  onBack: () => void;
}) {
  return (
    <div className="triage-panel">
      <div className="panel-heading">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div>
          <p className="eyebrow">Walk-in lane</p>
          <h2>Capture guest details</h2>
          <p className="muted">Name, company, and host — the fastest way to log a new arrival.</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="error-message">
          {errors.map((error, i) => (
            <p key={i}>• {error}</p>
          ))}
        </div>
      )}

      {hosts.length === 0 && (
        <div style={{ 
          backgroundColor: '#fee2e2', 
          border: '1px solid #fca5a5', 
          borderRadius: '4px', 
          padding: '12px', 
          marginBottom: '16px',
          color: '#991b1b'
        }}>
          <strong>❌ No hosts configured</strong>
          <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
            You need to add hosts first. Go to Settings and import a CSV or add hosts manually.
          </p>
        </div>
      )}

      <form className="triage-form" onSubmit={(e) => { e.preventDefault(); onCheckIn(); }}>
        <div className="form-group">
          <label htmlFor="name">Guest name *</label>
          <input
            id="name"
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="First and last name"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="company">Company (optional)</label>
          <input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="host">Who are you visiting? *</label>
          <select
            id="host"
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
            required
            disabled={hosts.length === 0}
          >
            <option value="">
              {hosts.length === 0 ? 'No hosts available - add hosts first' : 'Select a host'}
            </option>
            {hosts.map(host => (
              <option key={host.id} value={host.id}>
                {host.name} {host.department ? `(${host.department})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="duration">How long will you stay? *</label>
          <select
            id="duration"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
            required
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="240">4 hours</option>
            <option value="480">All day (8 hours)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={hosts.length === 0}>
          Check in and notify
        </button>
      </form>
    </div>
  );
}

/**
 * Expected Visitor Path - Search & Check-In
 */
function ExpectedStep({
  searchQuery,
  onSearch,
  searchResults,
  hosts,
  onCheckIn,
  onBack
}: {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Guest[];
  hosts: Host[];
  onCheckIn: (guestId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="triage-panel">
      <div className="panel-heading">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div>
          <p className="eyebrow">Expected lane</p>
          <h2>Find your appointment</h2>
          <p className="muted">Look up your name, email, or phone. We'll check you in instantly.</p>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search for your name..."
          autoFocus
        />
      </div>

      {searchResults.length > 0 ? (
        <div className="search-results">
          {searchResults.map(guest => (
            <div key={guest.id} className="result-item">
              <div className="result-info">
                <h3>{guest.name}</h3>
                {guest.email && <p className="contact-item"><Mail size={16} /> {guest.email}</p>}
                {guest.phone && <p className="contact-item"><Phone size={16} /> {guest.phone}</p>}
                <p className="host-name">
                  Meeting: {hosts.find(h => h.id === guest.hostId)?.name}
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => onCheckIn(guest.id)}
              >
                Check in now
              </button>
            </div>
          ))}
        </div>
      ) : searchQuery.trim() ? (
        <div className="no-results">
          <p>No matching guests found</p>
          <small>Please double-check the spelling or ask at reception</small>
        </div>
      ) : (
        <div className="search-placeholder">
          <p>Start typing to find your appointment...</p>
        </div>
      )}
    </div>
  );
}

/**
 * Success Screen - Confirmation
 */
function SuccessStep({ guest, host }: { guest: Guest; host: Host }) {
  return (
    <div className="triage-panel success-step">
      <div className="success-container">
        <div className="success-icon">
          <CheckCircle size={64} strokeWidth={1.5} />
        </div>
        <h1>Check-in successful</h1>
        <p>Welcome, <strong>{guest.name}</strong></p>
        {guest.company && <p className="company">from {guest.company}</p>}
        <p className="host-greeting">
          {host.name} has been notified of your arrival
        </p>
        <small className="redirect-notice">
          Redirecting in 3 seconds...
        </small>
      </div>
    </div>
  );
}
