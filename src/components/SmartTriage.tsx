/**
 * SmartTriage Component
 * Two-path welcome screen for visitor check-in
 * Path 1: Walk-in visitor
 * Path 2: Expected visitor lookup
 */

import { useState, useEffect, type ReactNode } from 'react';
import { UserCheck, Calendar, Mail, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Guest, Host, GuestStatus } from '../types';
import { StorageService } from '../services/storageService';
import { emailService } from '../services/emailService';
import {
  generateVisitorArrivalNotification,
  generateWhatsAppVisitorMessage,
  generateReturningVisitorNotification,
  generateWhatsAppReturningMessage,
  openWhatsAppChat
} from '../services/notificationService';
import { validateGuestName } from '../utils/validators';
import { usePersistedState } from '../utils/hooks';
import { isEmailReady, getActiveChannels } from '../utils/notificationConfig';
import { GUEST_STATUS, STORAGE_KEYS } from '../utils/constants';
import './SmartTriage.css';

type TriageStep = 'welcome' | 'walk-in' | 'expected' | 'success';

interface NotificationStatus {
  type: 'pending' | 'success' | 'error';
  message: string;
}

export function SmartTriage() {
  const [step, setStep] = useState<TriageStep>('welcome');
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const guests = StorageService.getGuests();
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);

  // Walk-in state
  const [guestName, setGuestName] = useState('');
  const [company, setCompany] = useState('');
  const [selectedHost, setSelectedHost] = useState<string>('');
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

  const today = new Date().toDateString();
  const checkedInToday = guests.filter(g => new Date(g.checkInTime).toDateString() === today).length;
  const expectedToday = guests.filter(g => g.status === GUEST_STATUS.EXPECTED).length;

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
   * Send WhatsApp notification
   */
  const sendWhatsAppNotification = (host: Host, message: string): void => {
    if (!host.whatsappNumber) {
      console.warn('⚠️ WhatsApp number not configured for host:', host.name);
      setNotificationStatus({
        type: 'error',
        message: `WhatsApp not configured for ${host.name}`
      });
      return;
    }

    console.log('📱 Opening WhatsApp for:', host.whatsappNumber);
    setNotificationStatus({
      type: 'success',
      message: `📱 WhatsApp link opened for ${host.name}`
    });
    
    // Open WhatsApp with pre-filled message
    openWhatsAppChat(host.whatsappNumber, message);
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

    // Find host to notify
    const host = hosts.find(h => h.id === selectedHost);
    if (!host) {
      setErrors(['Host not found']);
      return;
    }

    console.log('✅ Host found:', host.name);
    console.log('📋 Host notification method:', getNotificationMethod(host));

    // Create guest record
    const now = new Date().toISOString();
    const guest: Guest = {
      id: crypto.randomUUID(),
      name: guestName.trim(),
      company: company.trim() || undefined,
      hostId: selectedHost,
      checkInTime: now,
      status: GUEST_STATUS.CHECKED_IN as GuestStatus,
      visitCount: 1,
      createdAt: now,
      updatedAt: now
    };

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
        tone: 'professional'
      });
      console.log('📧 Email notification object:', emailNotification);
      await sendEmailNotification(emailNotification);
    }

    // Temporarily disabled for testing email
    // if (notificationMethod === 'whatsapp' || notificationMethod === 'both') {
    //   console.log('📱 Triggering WhatsApp notification...');
    //   const whatsappMessage = generateWhatsAppVisitorMessage(guest, host);
    //   console.log('📱 WhatsApp message:', whatsappMessage);
    //   sendWhatsAppNotification(host, whatsappMessage);
    // }

    console.log('✨ Check-in complete for:', guest.name);
    setLastGuest(guest);
    setStep('success');

    // Reset form
    setTimeout(() => {
      setGuestName('');
      setCompany('');
      setSelectedHost('');
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

      // Temporarily disabled for testing email
      // if (notificationMethod === 'whatsapp' || notificationMethod === 'both') {
      //   const whatsappMessage = generateWhatsAppVisitorMessage(updatedGuest, host);
      //   sendWhatsAppNotification(host, whatsappMessage);
      // }
    }

    setLastGuest(updatedGuest);
    setStep('success');

    setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
      setNotificationStatus(null);
      setStep('welcome');
    }, 3000);
  };

  const renderLayout = (content: ReactNode) => (
    <div className="smart-triage">
      <div className="triage-shell">
        <div className="triage-main">
          {content}
        </div>
        <aside className="triage-sidebar">
          <div className="sidebar-card">
            <p className="eyebrow">Quick stats</p>
            <div className="sidebar-stats">
              <div className="stat-block">
                <span>Arrivals today</span>
                <strong>{checkedInToday}</strong>
              </div>
              <div className="stat-block">
                <span>Expected</span>
                <strong>{expectedToday}</strong>
              </div>
              <div className="stat-block">
                <span>Hosts</span>
                <strong>{hosts.length}</strong>
              </div>
            </div>
          </div>

          <div className="sidebar-card">
            <p className="eyebrow">Arrival steps</p>
            <div className="timeline">
              <div className="timeline-row">
                <span className="dot" />
                <div>
                  <strong>Choose lane</strong>
                  <p className="muted">Walk-in or expected visitor with lookup.</p>
                </div>
              </div>
              <div className="timeline-row">
                <span className="dot" />
                <div>
                  <strong>Capture essentials</strong>
                  <p className="muted">Name, company, host, and contact details.</p>
                </div>
              </div>
              <div className="timeline-row">
                <span className="dot" />
                <div>
                  <strong>Notify + log</strong>
                  <p className="muted">Instant notification preview, saved to logbook.</p>
                </div>
              </div>
            </div>
          </div>

          {lastGuest && (
            <div className="sidebar-card">
              <p className="eyebrow">Most recent</p>
              <h4>{lastGuest.name}</h4>
              {lastGuest.company && <p className="muted">From {lastGuest.company}</p>}
              <p className="muted">Visiting {hosts.find(h => h.id === lastGuest.hostId)?.name || 'Host'}</p>
              <small className="muted">Checked in just now</small>
            </div>
          )}

          {notificationStatus && (
            <div className={`notification-status ${notificationStatus.type}`}>
              <div className="notification-icon">
                {notificationStatus.type === 'success' ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertCircle size={14} />
                )}
              </div>
              <p className="notification-message">{notificationStatus.message}</p>
            </div>
          )}

          {hosts.length === 0 && (
            <div className="sidebar-card" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
              <p className="eyebrow">⚠️ No hosts</p>
              <p className="muted">
                You need to create hosts first! Go to Settings and add hosts via CSV or manually.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );

  /**
   * Render by step
   */
  switch (step) {
    case 'welcome':
      return renderLayout(<WelcomeStep onWalkIn={handleWalkIn} onExpected={handleExpected} />);

    case 'walk-in':
      return renderLayout(
        <WalkInStep
          guestName={guestName}
          setGuestName={setGuestName}
          company={company}
          setCompany={setCompany}
          selectedHost={selectedHost}
          setSelectedHost={setSelectedHost}
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
  onExpected
}: {
  onWalkIn: () => void;
  onExpected: () => void;
}) {
  return (
    <div className="triage-panel">
      <div className="welcome-header">
        <p className="eyebrow">Front desk mode</p>
        <h1>Who are we welcoming?</h1>
        <p className="muted">Choose the right lane. Both paths take under a minute.</p>
      </div>

      <div className="path-buttons">
        <button className="path-button walk-in" onClick={onWalkIn}>
          <div className="path-icon">
            <UserCheck size={48} strokeWidth={1.5} />
          </div>
          <div className="path-text">
            <h2>Walk-in</h2>
            <p>New visitor without an appointment</p>
          </div>
        </button>

        <button className="path-button expected" onClick={onExpected}>
          <div className="path-icon">
            <Calendar size={48} strokeWidth={1.5} />
          </div>
          <div className="path-text">
            <h2>Expected</h2>
            <p>Pre-registered guest or repeat visit</p>
          </div>
        </button>
      </div>
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
