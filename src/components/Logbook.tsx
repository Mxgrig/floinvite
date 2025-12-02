/**
 * Logbook Component
 * Visitor history, search, filter, and export
 */

import { useState } from 'react';
import { Guest, Host } from '../types';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { usePersistedState, useDebounce } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import PageLayout from './PageLayout';
import './Logbook.css';

export function Logbook() {
  const [guests] = usePersistedState<Guest[]>(STORAGE_KEYS.guests, []);
  const [hosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const debouncedSearch = useDebounce(searchQuery, 300);

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
    ExportService.exportGuestsToCSV(filteredGuests, `guests-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportJSON = () => {
    ExportService.exportGuestsToJSON(filteredGuests, `guests-${new Date().toISOString().split('T')[0]}.json`);
  };

  const stats = StorageService.getStats();

  const pageStats = [
    { value: String(stats.totalGuests), label: 'Total visitors' },
    { value: String(stats.todayCheckIns), label: 'Today' },
    { value: String(stats.checkedInToday), label: 'Checked in' }
  ];

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

          <button onClick={handleExportCSV} className="btn btn-secondary">
            Export CSV
          </button>
          <button onClick={handleExportJSON} className="btn btn-secondary">
            Export JSON
          </button>
        </div>
      </div>

      <div className="logbook-content">
        {filteredGuests.length > 0 ? (
          <div className="guests-table">
            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr', gap: '1rem', padding: '1rem' }}>
              <div className="col-name">Name</div>
              <div className="col-company">Company</div>
              <div className="col-host">Host</div>
              <div className="col-time">Check-In</div>
              <div className="col-status">Status</div>
            </div>

            {filteredGuests.map(guest => {
              const host = hosts.find(h => h.id === guest.hostId);
              const checkInDate = new Date(guest.checkInTime);

              console.log('DEBUG: Rendering guest row:', {
                guestName: guest.name,
                hostId: guest.hostId,
                hostFound: !!host
              });

              return (
                <div key={guest.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr', gap: '1rem', padding: '1rem', backgroundColor: '#fff3cd', border: '2px solid red' }}>
                  <div className="col-name" data-label="Name" style={{ backgroundColor: '#ffe5e5', border: '1px solid blue' }}>
                    <strong>{guest.name}</strong>
                    {guest.email && <small>{guest.email}</small>}
                  </div>
                  <div className="col-company" data-label="Company" style={{ backgroundColor: '#e5f5ff', border: '1px solid blue' }}>{guest.company || '—'}</div>
                  <div className="col-host" data-label="Host" style={{ backgroundColor: '#e5ffe5', border: '1px solid blue' }}>{host?.name || 'Unknown'}</div>
                  <div className="col-time" data-label="Check-In" style={{ backgroundColor: '#ffe5ff', border: '1px solid blue' }}>
                    {checkInDate.toLocaleDateString()} {checkInDate.toLocaleTimeString()}
                  </div>
                  <div className="col-status" data-label="Status" style={{ backgroundColor: '#fffae5', border: '1px solid blue' }}>
                    <span className={`status-badge status-${guest.status.toLowerCase()}`}>
                      {guest.status}
                    </span>
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
