/**
 * HostManagement Component
 * Add, edit, delete hosts and manage notification preferences
 */

import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { AppSettings, Host } from '../types';
import { StorageService } from '../services/storageService';
import { ServerPaymentService } from '../services/serverPaymentService';
import { usePersistedState } from '../utils/hooks';
import { validateHostName, validateHostEmail, isValidCSVFile, parseCSVText } from '../utils/validators';
import { STORAGE_KEYS } from '../utils/constants';
import { hasFeature } from '../utils/featureGating';
import { UsageTracker } from '../utils/usageTracker';
import PageLayout from './PageLayout';
import './HostManagement.css';

type HostStep = 'list' | 'add' | 'import';

export function HostManagement() {
  const [hosts, setHosts] = usePersistedState<Host[]>(STORAGE_KEYS.hosts, []);
  const [settings] = usePersistedState<AppSettings>(STORAGE_KEYS.settings, {
    businessName: 'My Company',
    notificationEmail: 'admin@floinvite.com',
    kioskMode: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [userTier] = usePersistedState<'starter' | 'compliance' | 'enterprise'>('floinvite_user_tier', 'starter');
  const [step, setStep] = useState<HostStep>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Host>>({
    name: '',
    email: '',
    phone: '',
    department: '',
    notificationMethod: 'email'
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
      notificationMethod: 'email'
    });
    setErrors([]);
  };

  const handleEdit = (host: Host) => {
    setStep('add');
    setEditingId(host.id);
    setFormData(host);
    setErrors([]);
  };

  const handleSave = async () => {
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

    // Check payment enforcement server-side - prevents exceeding 20-item free tier limit
    // Only check when adding new host, not when editing
    if (!editingId) {
      const userEmail = localStorage.getItem('floinvite_user_email') || settings.notificationEmail || '';
      if (!userEmail) {
        newErrors.push('Account email required to verify subscription status.');
        setErrors(newErrors);
        return;
      }
      if (userEmail) {
        const currentHosts = hosts.length;
        const currentGuests = StorageService.getGuests().length;

        const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
          userEmail,
          'add_host',
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
    }

    const now = new Date().toISOString();

    if (editingId) {
      // Update existing
      const updated = hosts.map(h =>
        h.id === editingId ? { ...h, ...formData, updatedAt: now } : h
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
        notificationMethod: formData.notificationMethod || 'email',
        createdAt: now,
        updatedAt: now
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
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      try {
        const rows = parseCSVText(text);
        if (rows.length === 0) {
          setErrors(['No data found in CSV']);
          return;
        }

        // Check payment enforcement server-side - prevents exceeding 20-item free tier limit
        const userEmail = localStorage.getItem('floinvite_user_email') || settings.notificationEmail || '';
        if (!userEmail) {
          setErrors(['Account email required to verify subscription status.']);
          return;
        }
        if (userEmail) {
          const currentHosts = hosts.length;
          const currentGuests = StorageService.getGuests().length;

          const operationCheck = await ServerPaymentService.checkIfOperationAllowed(
            userEmail,
            'import_hosts',
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

        const now = new Date().toISOString();
        const newHosts = rows.map(row => ({
          id: crypto.randomUUID(),
          name: row.Name || '',
          email: row.Email || '',
          phone: row.Phone,
          department: row.Department,
          notificationMethod: (row.NotificationMethod as any) || 'email',
          createdAt: now,
          updatedAt: now
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

  // Render list view
  if (step === 'list') {
    const hostStats = [
      { value: String(hosts.length), label: 'Hosts' }
    ];

    return (
      <PageLayout
        eyebrow="Hosts & notifications"
        title="Keep the right people in the loop"
        subtitle="Assign hosts, set their channels, and keep the front desk in sync."
        stats={hostStats}
      >
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
            <div className="table-header" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.5fr 1fr', gap: '1rem', padding: '1rem' }}>
              <div className="col-name">Name</div>
              <div className="col-email">Email</div>
              <div className="col-phone">Phone</div>
              <div className="col-notifications">Notifications</div>
              <div className="col-actions">Actions</div>
            </div>

            {hosts.map(host => (
              <div key={host.id} className="table-row" style={{ display: 'grid', gridTemplateColumns: '1.5fr 2fr 1.2fr 1.5fr 1fr', gap: '1rem', padding: '1rem' }}>
                <div className="col-name" data-label="Name">
                  <strong>{host.name}</strong>
                  {host.department && <small>{host.department}</small>}
                </div>
                <div className="col-email" data-label="Email">{host.email}</div>
                <div className="col-phone" data-label="Phone">{host.phone || '—'}</div>
                <div className="col-notifications" data-label="Notifications">
                  <span className="badge email">
                    <Mail size={12} /> Email
                  </span>
                </div>
                <div className="col-actions" data-label="Actions">
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
      </PageLayout>
    );
  }

  // Render add/edit form
  if (step === 'add') {
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

              <div className="form-group">
                <label>Primary Notification Method</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="notificationMethod"
                      value="email"
                      checked={formData.notificationMethod === 'email'}
                      onChange={(e) => setFormData({ ...formData, notificationMethod: e.target.value as any })}
                    />
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={16} /> Email only
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg">
              {editingId ? 'Save Changes' : 'Add Host'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render import view
  if (step === 'import') {
    return (
      <div className="host-import-container">
        <div className="import-box">
          <button className="back-button" onClick={() => setStep('list')}>
            ← Back
          </button>

          <h1>Import Hosts from CSV</h1>
          <p>Upload a CSV file with columns: Name, Email, Phone, Department, NotificationMethod(optional)</p>

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
            <pre>Name,Email,Phone,Department,NotificationMethod
John Doe,john@example.com,+1234567890,Engineering,email
Jane Smith,jane@example.com,+1234567891,Sales,email
Bob Wilson,bob@example.com,+1234567892,HR,email</pre>
            <p><small>NotificationMethod options: email (default: email)</small></p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
