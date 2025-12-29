/**
 * Evacuation List Component
 * Displays all currently checked-in guests for emergency evacuation procedures
 * Provides print and export functionality for quick reference
 */

import { useState } from 'react';
import { AlertTriangle, Printer, Download, Clock, Building2, User } from 'lucide-react';
import { Guest, Host, GuestStatus } from '../types';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import PageLayout from './PageLayout';
import './EvacuationList.css';

interface EvacuationListProps {
  onNavigate?: (page: string) => void;
}

export function EvacuationList({ onNavigate }: EvacuationListProps) {
  const [guests] = usePersistedState<Guest[]>(STORAGE_KEYS.guests, []);
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [groupBy, setGroupBy] = useState<'host' | 'none'>('host');

  // Get all currently checked-in guests
  const checkedInGuests = guests.filter(guest => guest.status === GuestStatus.CHECKED_IN);

  // Create host lookup map
  const hostMap = new Map(hosts.map(host => [host.id, host]));

  // Group guests by host if requested
  const groupedGuests = groupBy === 'host'
    ? Array.from(
        checkedInGuests.reduce((map, guest) => {
          const hostId = guest.hostId;
          if (!map.has(hostId)) map.set(hostId, []);
          map.get(hostId)!.push(guest);
          return map;
        }, new Map<string, Guest[]>())
      ).sort((a, b) => (hostMap.get(a[0])?.name || '').localeCompare(hostMap.get(b[0])?.name || ''))
    : [['all', checkedInGuests]];

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    ExportService.exportGuestsToCSV(
      checkedInGuests,
      `evacuation-list-${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  const handleExportJSON = () => {
    ExportService.exportGuestsToJSON(
      checkedInGuests,
      `evacuation-list-${new Date().toISOString().split('T')[0]}.json`
    );
  };

  return (
    <PageLayout>
      <div className="evacuation-list-container">
        {/* Header */}
        <div className="evacuation-list-header">
          <div className="evacuation-list-title">
            <AlertTriangle className="evacuation-icon" />
            <div>
              <h1>Evacuation List</h1>
              <p className="evacuation-subtitle">All currently checked-in guests</p>
            </div>
          </div>

          {/* Control Bar */}
          <div className="evacuation-controls">
            <div className="evacuation-stats">
              <span className="stat-badge">
                {checkedInGuests.length} {checkedInGuests.length === 1 ? 'guest' : 'guests'} checked in
              </span>
              <span className="stat-timestamp">
                Updated: {formatTime(new Date().toISOString())}
              </span>
            </div>

            <div className="evacuation-actions">
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as 'host' | 'none')}
                className="group-select"
              >
                <option value="none">No grouping</option>
                <option value="host">Group by Host</option>
              </select>

              <button className="action-button print-button" onClick={handlePrint} title="Print evacuation list">
                <Printer size={18} />
                Print
              </button>

              <button className="action-button export-button" onClick={handleExportCSV} title="Export as CSV">
                <Download size={18} />
                CSV
              </button>

              <button className="action-button export-button" onClick={handleExportJSON} title="Export as JSON">
                <Download size={18} />
                JSON
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {checkedInGuests.length === 0 ? (
          <div className="evacuation-empty">
            <AlertTriangle size={48} />
            <h3>No guests currently checked in</h3>
            <p>All guests have been checked out or there are no active check-ins.</p>
          </div>
        ) : (
          <div className="evacuation-content">
            {groupedGuests.map(([groupId, groupGuests]) => (
              <div key={groupId} className="evacuation-group">
                {groupBy === 'host' && groupId !== 'all' && (
                  <div className="evacuation-group-header">
                    <Building2 size={20} />
                    <h2>{hostMap.get(groupId)?.name || 'Unknown Host'}</h2>
                    <span className="group-count">{groupGuests.length} guest{groupGuests.length !== 1 ? 's' : ''}</span>
                  </div>
                )}

                <div className="evacuation-guests">
                  {groupGuests.map((guest, index) => (
                    <div key={guest.id} className="evacuation-guest-row">
                      <div className="guest-number">{index + 1}</div>

                      <div className="guest-details">
                        <div className="guest-name-section">
                          <User size={16} />
                          <span className="guest-name">{guest.name}</span>
                          {guest.company && <span className="guest-company">{guest.company}</span>}
                        </div>

                        {guest.email && (
                          <div className="guest-contact">
                            <span className="contact-label">Email:</span>
                            <span className="contact-value">{guest.email}</span>
                          </div>
                        )}

                        {guest.phone && (
                          <div className="guest-contact">
                            <span className="contact-label">Phone:</span>
                            <span className="contact-value">{guest.phone}</span>
                          </div>
                        )}

                        <div className="guest-checkin-time">
                          <Clock size={14} />
                          <span>Checked in: {formatTime(guest.checkInTime)}</span>
                        </div>
                      </div>

                      {groupBy !== 'host' && (
                        <div className="guest-host">
                          <Building2 size={14} />
                          <span>{hostMap.get(guest.hostId)?.name || 'Unknown'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Footer with timestamp */}
            <div className="evacuation-footer">
              <p>Generated: {formatDate(new Date().toISOString())} at {formatTime(new Date().toISOString())}</p>
              <p className="evacuation-footer-note">This evacuation list contains all guests currently checked in to the building.</p>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
