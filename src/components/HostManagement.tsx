/**
 * HostManagement Component
 * Add, edit, delete hosts and manage notification preferences
 */

import { useState } from 'react';
import { Host } from '../types';
import { StorageService } from '../services/storageService';
import { usePersistedState } from '../utils/hooks';
import { validateHostName, validateHostEmail, isValidCSVFile, parseCSVText } from '../utils/validators';
import { SMS_GATEWAYS, STORAGE_KEYS } from '../utils/constants';
import './HostManagement.css';

type HostStep = 'list' | 'add' | 'import';

export function HostManagement() {
  const [hosts, setHosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [step, setStep] = useState<HostStep>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Host>>({
    name: '',
    email: '',
    phone: '',
    department: '',
    notifyByEmail: true,
    notifyBySMS: false
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleAdd = () => {
    setStep('add');
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      notifyByEmail: true,
      notifyBySMS: false
    });
    setErrors([]);
  };

  const handleEdit = (host: Host) => {
    setStep('add');
    setEditingId(host.id);
    setFormData(host);
    setErrors([]);
  };

  const handleSave = () => {
    const newErrors: string[] = [];

    // Validate name
    const nameValidation = validateHostName(formData.name || '');
    if (!nameValidation.isValid) {
      newErrors.push(...nameValidation.errors);
    }

    // Validate email
    const emailValidation = validateHostEmail(formData.email || '');
    if (!emailValidation.isValid) {
      newErrors.push(...emailValidation.errors);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    if (editingId) {
      // Update existing
      const updated = hosts.map(h =>
        h.id === editingId ? { ...h, ...formData } : h
      ) as Host[];
      setHosts(updated);
    } else {
      // Add new
      const newHost: Host = {
        id: crypto.randomUUID(),
        name: formData.name!,
        email: formData.email!,
        phone: formData.phone,
        department: formData.department,
        notifyByEmail: formData.notifyByEmail ?? true,
        notifyBySMS: formData.notifyBySMS ?? false,
        smsCarrier: formData.smsCarrier as any
      };
      setHosts([...hosts, newHost]);
    }

    setStep('list');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this host?')) {
      setHosts(hosts.filter(h => h.id !== id));
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isValidCSVFile(file)) {
      setErrors(['Please select a valid CSV file']);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setErrors(['No data found in CSV']);
          return;
        }

        const newHosts = rows.map(row => ({
          id: crypto.randomUUID(),
          name: row.Name || '',
          email: row.Email || '',
          phone: row.Phone,
          department: row.Department,
          notifyByEmail: true,
          notifyBySMS: false
        })).filter(h => h.name && h.email) as Host[];

        const result = StorageService.importHosts(newHosts, false);
        setHosts(StorageService.getHosts());
        
        alert(`Imported ${result.added} hosts${result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : ''}`);
        setStep('list');
        setErrors([]);
      } catch (error) {
        setErrors(['Failed to parse CSV file']);
      }
    };
    reader.readAsText(file);
  };

  switch (step) {
    case 'list':
      return (
        <div className="host-management">
          <h1>Host Management</h1>
          <p className="subtitle">Manage employees and their notification preferences</p>

          <div className="host-controls">
            <button onClick={handleAdd} className="btn btn-primary">
              + Add Host
            </button>
            <button onClick={() => setStep('import')} className="btn btn-secondary">
              Import CSV
            </button>
          </div>

          {hosts.length > 0 ? (
            <div className="hosts-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-email">Email</div>
                <div className="col-phone">Phone</div>
                <div className="col-notifications">Notifications</div>
                <div className="col-actions">Actions</div>
              </div>

              {hosts.map(host => (
                <div key={host.id} className="table-row">
                  <div className="col-name">
                    <strong>{host.name}</strong>
                    {host.department && <small>{host.department}</small>}
                  </div>
                  <div className="col-email">{host.email}</div>
                  <div className="col-phone">{host.phone || '—'}</div>
                  <div className="col-notifications">
                    {host.notifyByEmail && <span className="badge email">✉️ Email</span>}
                    {host.notifyBySMS && <span className="badge sms">📱 SMS</span>}
                  </div>
                  <div className="col-actions">
                    <button onClick={() => handleEdit(host)} className="btn-action edit">Edit</button>
                    <button onClick={() => handleDelete(host.id)} className="btn-action delete">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hosts yet</p>
              <small>Add hosts to get started</small>
            </div>
          )}
        </div>
      );

    case 'add':
      return (
        <div className="host-form-container">
          <div className="host-form">
            <button className="back-button" onClick={() => setStep('list')}>
              ← Back
            </button>
            
            <h1>{editingId ? 'Edit Host' : 'Add New Host'}</h1>

            {errors.length > 0 && (
              <div className="error-message">
                {errors.map((error, i) => (
                  <p key={i}>• {error}</p>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>

              <div className="notification-section">
                <h3>Notification Preferences</h3>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifyByEmail ?? true}
                      onChange={(e) => setFormData({ ...formData, notifyByEmail: e.target.checked })}
                    />
                    <span>Send email notifications</span>
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifyBySMS ?? false}
                      onChange={(e) => setFormData({ ...formData, notifyBySMS: e.target.checked })}
                    />
                    <span>Send SMS notifications</span>
                  </label>
                  
                  {formData.notifyBySMS && (
                    <select
                      value={formData.smsCarrier || ''}
                      onChange={(e) => setFormData({ ...formData, smsCarrier: e.target.value as any })}
                      className="sms-carrier"
                    >
                      <option value="">Select carrier</option>
                      {Object.keys(SMS_GATEWAYS).map(carrier => (
                        <option key={carrier} value={carrier}>{carrier.toUpperCase()}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg">
                {editingId ? 'Save Changes' : 'Add Host'}
              </button>
            </form>
          </div>
        </div>
      );

    case 'import':
      return (
        <div className="host-import-container">
          <div className="import-box">
            <button className="back-button" onClick={() => setStep('list')}>
              ← Back
            </button>

            <h1>Import Hosts from CSV</h1>
            <p>Upload a CSV file with columns: Name, Email, Phone, Department</p>

            {errors.length > 0 && (
              <div className="error-message">
                {errors.map((error, i) => (
                  <p key={i}>• {error}</p>
                ))}
              </div>
            )}

            <div className="file-upload">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="upload-label">
                📁 Choose CSV File
              </label>
            </div>

            <div className="import-example">
              <h4>Example CSV Format:</h4>
              <pre>Name,Email,Phone,Department
John Doe,john@example.com,+1234567890,Engineering
Jane Smith,jane@example.com,+1234567891,Sales</pre>
            </div>
          </div>
        </div>
      );
  }
}
