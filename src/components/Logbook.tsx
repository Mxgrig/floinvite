/**
 * Logbook Component
 * Visitor history, search, filter, and export
 */

import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Guest, Host } from '../types';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { usePersistedState, useDebounce } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import { hasFeature } from '../utils/featureGating';
import { FeatureLocked } from './FeatureLocked';
import PageLayout from './PageLayout';
import './Logbook.css';

interface LogbookProps {
  onNavigate?: (page: string) => void;
}

export function Logbook({ onNavigate }: LogbookProps) {
  const [guests, setGuests] = usePersistedState<Guest[]>(STORAGE_KEYS.guests, []);
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [userTier] = usePersistedState<'starter' | 'compliance' | 'enterprise'>('floinvite_user_tier', 'starter');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Check if export is available
  const canExport = hasFeature(userTier, 'csv_export');

  // Search and filter guests
  const filteredGuests = guests.filter(guest => {
    const matchesSearch = !debouncedSearch ||
      guest.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      guest.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      guest.company?.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesStatus = filterStatus === 'all' || guest.status === filterStatus;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  const handleExportCSV = () => {
    if (!canExport) {
      return;
    }
    ExportService.exportGuestsToCSV(filteredGuests, `guests-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJSON = () => {
    if (!canExport) {
      return;
    }
    ExportService.exportGuestsToJSON(filteredGuests, `guests-${new Date().toISOString().split('T')[0]}.json`);
  };

  const stats = StorageService.getStats();

  const pageStats = [
    { value: String(stats.totalGuests), label: 'Total visitors' },
    { value: String(stats.todayCheckIns), label: 'Today' },
    { value: String(stats.checkedInToday), label: 'Checked in' }
  ];

  const handleEarlyCheckout = (guest: Guest) => {
    const confirmed = window.confirm(`Check out ${guest.name} now?`);
    if (confirmed) {
      const updatedGuest: Guest = {
        ...guest,
        checkOutTime: new Date().toISOString(),
        status: 'Checked Out' as any,
        updatedAt: new Date().toISOString()
      };
      StorageService.updateGuest(guest.id, updatedGuest);
      // Update local state to trigger re-render
      const updatedGuests = guests.map(g => g.id === guest.id ? updatedGuest : g);
      setGuests(updatedGuests);
    }
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Auto-checkout remaining guests at end of day (6 PM / 18:00)
  useEffect(() => {
    const now = new Date();
    const endOfDayHour = 18; // 6 PM

    if (now.getHours() >= endOfDayHour) {
      const updatedGuests = guests.map(guest => {
        if (guest.status === 'Checked In') {
          const checkedOutGuest = {
            ...guest,
            checkOutTime: new Date().toISOString(),
            status: 'Checked Out' as any,
            updatedAt: new Date().toISOString()
          };
          StorageService.updateGuest(guest.id, checkedOutGuest);
          return checkedOutGuest;
        }
        return guest;
      });

      if (updatedGuests.some(g => g.status === 'Checked Out' && guests.find(og => og.id === g.id)?.status === 'Checked In')) {
        setGuests(updatedGuests);
      }
    }
  }, [guests, setGuests]);

  return (
    <PageLayout
      eyebrow="Visitor history"
      title="Live logbook & exports"
      subtitle="Search everything, slice by status, and hand compliance a clean export."
      stats={pageStats}
    >
      <div className="logbook-controls">
        <div className="search-area">
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-export">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="Checked In">Checked In</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Expected">Expected</option>
            <option value="No Show">No Show</option>
          </select>

          <button
            onClick={handleExportCSV}
            className={`btn btn-secondary ${!canExport ? 'btn-disabled' : ''}`}
            disabled={!canExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Export CSV {!canExport && <Lock size={16} />}
          </button>
          <button
            onClick={handleExportJSON}
            className={`btn btn-secondary ${!canExport ? 'btn-disabled' : ''}`}
            disabled={!canExport}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            Export JSON {!canExport && <Lock size={16} />}
          </button>
        </div>

        {!canExport && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: '#92400e',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} />
              <span><strong>Export features available in Compliance+ tier.</strong> Upgrade to unlock CSV/JSON export and cloud backup.</span>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('pricing')}
                style={{
                  background: '#fcd34d',
                  border: 'none',
                  color: '#92400e',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.4rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fbbf24';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fcd34d';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                View Pricing
              </button>
            )}
          </div>
        )}
      </div>

      <div className="logbook-content">
        {filteredGuests.length > 0 ? (
          <div className="guests-compact">
            <div className="compact-header">
              <div className="header-name">Name</div>
              <div className="header-company">Company</div>
              <div className="header-host">Visiting</div>
              <div className="header-time">Check-in</div>
              <div className="header-departure">Departure</div>
              <div className="header-status">Status</div>
            </div>
            {filteredGuests.map(guest => {
              const host = hosts.find(h => h.id === guest.hostId);
              const checkInDate = new Date(guest.checkInTime);
              const estimatedDeparture = guest.estimatedDepartureTime ? new Date(guest.estimatedDepartureTime) : null;
              const isCheckedIn = guest.status === 'Checked In';
              const statusClass = guest.status.replace(/\s+/g, '-').toLowerCase();

              return (
                <div key={guest.id} className="compact-row">
                  <div className="row-main">
                    <div className="guest-info">
                      <div className="guest-name">{guest.name}</div>
                      {guest.email && <div className="guest-email">{guest.email}</div>}
                    </div>
                    <div className="guest-company">{guest.company || '—'}</div>
                    <div className="guest-host">{host?.name || 'Unknown'}</div>
                    <div className="guest-times">
                      <div className="time-label">Check-in</div>
                      <div className="time-value">{formatTime(checkInDate)}</div>
                    </div>
                    <div className="guest-departure">
                      {estimatedDeparture ? (
                        <>
                          <div className="time-label">Depart</div>
                          <div className="time-value">
                            {formatTime(estimatedDeparture)}
                            {isCheckedIn && (
                              <div className="time-remaining">
                                ⏰ {estimatedDeparture > new Date()
                                  ? `${Math.round((estimatedDeparture.getTime() - Date.now()) / 60000)}m`
                                  : 'exp'}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="time-label" style={{ marginTop: '0.5rem' }}>—</div>
                      )}
                    </div>
                    <div className="row-status">
                      {isCheckedIn ? (
                        <button
                          onClick={() => handleEarlyCheckout(guest)}
                          className={`status-badge status-${statusClass} status-clickable`}
                          title="Click to checkout"
                        >
                          {guest.status}
                        </button>
                      ) : (
                        <span className={`status-badge status-${statusClass}`}>
                          {guest.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No visitors found</p>
            {debouncedSearch && <small>Try adjusting your search</small>}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
