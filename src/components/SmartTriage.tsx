/**
 * SmartTriage Component
 * Two-path welcome screen for visitor check-in
 * Path 1: Walk-in visitor
 * Path 2: Expected visitor lookup
 */

import { useState } from 'react';
import { Guest, Host, GuestStatus } from '../types';
import { StorageService } from '../services/storageService';
import { generateVisitorArrivalNotification } from '../services/notificationService';
import { validateGuestName } from '../utils/validators';
import { usePersistedState } from '../utils/hooks';
import { GUEST_STATUS, STORAGE_KEYS } from '../utils/constants';
import './SmartTriage.css';

type TriageStep = 'welcome' | 'walk-in' | 'expected' | 'success';

export function SmartTriage() {
  const [step, setStep] = useState<TriageStep>('welcome');
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);

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

  /**
   * Walk-In Path
   */
  const handleWalkIn = () => {
    setStep('walk-in');
    setErrors([]);
  };

  const handleCheckInWalkIn = () => {
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

    // Generate notification (Phase 1: display only, Phase 2: send via email)
    const notification = generateVisitorArrivalNotification(guest, host, {
      includeCompany: true,
      tone: 'professional'
    });

    // For Phase 1, just log and display
    console.log('Notification would be sent:', notification);

    setLastGuest(guest);
    setStep('success');

    // Reset form
    setTimeout(() => {
      setGuestName('');
      setCompany('');
      setSelectedHost('');
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

  const handleCheckInExpected = (guestId: string) => {
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
      const notification = generateVisitorArrivalNotification(updatedGuest, host, {
        tone: 'friendly'
      });
      console.log('Notification would be sent:', notification);
    }

    setLastGuest(updatedGuest);
    setStep('success');

    setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
      setStep('welcome');
    }, 3000);
  };

  /**
   * Render by step
   */
  switch (step) {
    case 'welcome':
      return <WelcomeStep onWalkIn={handleWalkIn} onExpected={handleExpected} />;

    case 'walk-in':
      return (
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
      return (
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
      return <SuccessStep guest={lastGuest!} host={hosts.find(h => h.id === lastGuest!.hostId)!} />;
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
    <div className="smart-triage welcome-step">
      <div className="triage-container">
        <div className="welcome-header">
          <h1>Welcome to Floinvite</h1>
          <p>Are you an expected guest or walking in?</p>
        </div>

        <div className="path-buttons">
          <button className="path-button walk-in" onClick={onWalkIn}>
            <div className="path-icon">🚶</div>
            <h2>Walk-In Visit</h2>
            <p>First time here or just dropping by</p>
          </button>

          <button className="path-button expected" onClick={onExpected}>
            <div className="path-icon">✓</div>
            <h2>I'm Expected</h2>
            <p>I have an appointment or meeting</p>
          </button>
        </div>
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
    <div className="smart-triage walk-in-step">
      <div className="triage-container">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <h1>Check-In Information</h1>

        {errors.length > 0 && (
          <div className="error-message">
            {errors.map((error, i) => (
              <p key={i}>• {error}</p>
            ))}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onCheckIn(); }}>
          <div className="form-group">
            <label htmlFor="name">Your Name *</label>
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
            <label htmlFor="company">Company (Optional)</label>
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
            >
              <option value="">-- Select a person --</option>
              {hosts.map(host => (
                <option key={host.id} value={host.id}>
                  {host.name} {host.department ? `(${host.department})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            Check In
          </button>
        </form>
      </div>
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
    <div className="smart-triage expected-step">
      <div className="triage-container">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <h1>Find Your Check-In</h1>
        <p>Search by name, email, or phone number</p>

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
                  {guest.email && <p>📧 {guest.email}</p>}
                  {guest.phone && <p>📱 {guest.phone}</p>}
                  <p className="host-name">
                    Meeting: {hosts.find(h => h.id === guest.hostId)?.name}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => onCheckIn(guest.id)}
                >
                  Check In
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
    </div>
  );
}

/**
 * Success Screen - Confirmation
 */
function SuccessStep({ guest, host }: { guest: Guest; host: Host }) {
  return (
    <div className="smart-triage success-step">
      <div className="success-container">
        <div className="success-icon">✓</div>
        <h1>Check-In Successful!</h1>
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
