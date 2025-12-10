/**
 * Settings Component
 * System configuration, session management, and host setup
 * This is the main control panel for administrators after login
 */

import { useState } from 'react';
import { Users, Clock, Settings as SettingsIcon, Database, Info, Upload, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { AppSettings, Host } from '../types';
import { StorageService } from '../services/storageService';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import './Settings.css';

type SettingsTab = 'hosts' | 'session' | 'system' | 'backup';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('hosts');
  const now = new Date().toISOString();
  const [settings, setSettings] = usePersistedState<AppSettings>(
    STORAGE_KEYS.settings,
    {
      businessName: 'My Company',
      notificationEmail: 'admin@floinvite.com',
      createdAt: now,
      updatedAt: now,
      sessionTimeout: 15
    }
  );
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = () => {
    const data = StorageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `floinvite-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (StorageService.importAllData(text)) {
        alert('Data imported successfully!');
        window.location.reload();
      } else {
        alert('Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('This will delete ALL data. This action cannot be undone. Are you sure?')) {
      StorageService.clearAllData();
      window.location.reload();
    }
  };

  const storageInfo = StorageService.getStorageInfo();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>System Settings</h1>
        <p>Configure your front-desk system, hosts, and notifications</p>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'hosts' ? 'active' : ''}`}
          onClick={() => setActiveTab('hosts')}
        >
          <Users size={18} />
          Host Management
        </button>
        <button
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          <Clock size={18} />
          Session Settings
        </button>
        <button
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          <SettingsIcon size={18} />
          System Setup
        </button>
        <button
          className={`tab ${activeTab === 'backup' ? 'active' : ''}`}
          onClick={() => setActiveTab('backup')}
        >
          <Database size={18} />
          Backup & Data
        </button>
      </div>

      <div className="settings-content">
        {/* Host Management Tab */}
        {activeTab === 'hosts' && (
          <div className="tab-panel">
            <div className="tab-intro">
              <h2>Host Management</h2>
              <p>Manage the employees, departments, or teams that receive visitor notifications</p>
            </div>

            <div className="info-box">
              <Info size={18} />
              <div>
                <strong>Tip:</strong> Add hosts here, then import guest lists to assign visitors to specific hosts. Navigate to the Host Management page for detailed setup.
              </div>
            </div>

            <div className="quick-actions">
              <button className="btn btn-primary">+ Add New Host</button>
              <button className="btn btn-secondary">
                <Upload size={18} />
                Import Hosts (CSV)
              </button>
            </div>

            <div className="empty-state">
              <h3>No hosts configured yet</h3>
              <p>Start by adding your first host above to begin receiving visitor notifications.</p>
            </div>
          </div>
        )}

        {/* Session Settings Tab */}
        {activeTab === 'session' && (
          <div className="tab-panel">
            <div className="tab-intro">
              <h2>Session & Security</h2>
              <p>Configure session timeout and security preferences</p>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  value={formData.sessionTimeout || 15}
                  onChange={(e) => setFormData({ ...formData, sessionTimeout: parseInt(e.target.value) })}
                  placeholder="15"
                />
                <small>Users will be automatically logged out after this duration of inactivity</small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    defaultChecked
                  />
                  <span>Require password on return</span>
                </label>
                <small>Ask users to re-enter password after session timeout</small>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    defaultChecked
                  />
                  <span>Enable session history logging</span>
                </label>
                <small>Keep records of login/logout times for audit purposes</small>
              </div>

              {saved && (
                <div className="success-message">
                  <CheckCircle size={18} />
                  Settings saved
                </div>
              )}

              <button onClick={handleSave} className="btn btn-primary">
                Save Session Settings
              </button>
            </div>
          </div>
        )}

        {/* System Setup Tab */}
        {activeTab === 'system' && (
          <div className="tab-panel">
            <div className="tab-intro">
              <h2>System Setup</h2>
              <p>Configure your business information and system preferences</p>
            </div>

            <div className="settings-form">
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Your company name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Business Address</label>
                <textarea
                  value={formData.businessAddress || ''}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  placeholder="Street address, city, state"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Notification Email</label>
                <input
                  type="email"
                  value={formData.notificationEmail || 'admin@floinvite.com'}
                  onChange={(e) => setFormData({ ...formData, notificationEmail: e.target.value })}
                  placeholder="admin@floinvite.com"
                />
                <small>Email address used for sending visitor notifications. Must be admin@floinvite.com</small>
              </div>

              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-picker-group">
                  <input
                    type="color"
                    value={formData.primaryColor || '#4f46e5'}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  />
                  <span>{formData.primaryColor || '#4f46e5'}</span>
                </div>
              </div>

              {saved && (
                <div className="success-message">
                  <CheckCircle size={18} />
                  Settings saved
                </div>
              )}

              <button onClick={handleSave} className="btn btn-primary">
                Save System Settings
              </button>
            </div>
          </div>
        )}

        {/* Backup & Data Tab */}
        {activeTab === 'backup' && (
          <div className="tab-panel">
            <div className="tab-intro">
              <h2>Backup & Data Management</h2>
              <p>Export, import, and manage your data</p>
            </div>

            <div className="data-section">
              <div className="storage-info">
                <h3>Storage Usage</h3>
                <div className="storage-bar">
                  <div
                    className="storage-used"
                    style={{ width: `${storageInfo.percentage}%` }}
                  ></div>
                </div>
                <p>
                  {(storageInfo.used / 1024).toFixed(1)} KB / {(storageInfo.limit / 1024 / 1024).toFixed(0)} MB
                </p>
                {storageInfo.percentage > 80 && (
                  <div className="warning-box">
                    <AlertTriangle size={18} />
                    Storage nearly full. Consider exporting and clearing old data.
                  </div>
                )}
              </div>

              <div className="backup-actions">
                <h3>Backup & Restore</h3>

                <button onClick={handleExportData} className="btn btn-secondary">
                  <Download size={18} />
                  Export All Data
                </button>
                <p className="help-text">Download all your data as a JSON file for backup</p>

                <button className="btn btn-secondary" onClick={(e) => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        handleImportData({
                          target: { files: [file] }
                        } as any);
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}>
                  <Upload size={18} />
                  Import Data
                </button>
                <p className="help-text">Restore from a previously exported JSON file</p>
              </div>

              <div className="danger-zone">
                <h3>
                  <AlertTriangle size={18} />
                  Danger Zone
                </h3>
                <button onClick={handleClearAllData} className="btn btn-danger">
                  Delete All Data
                </button>
                <p className="help-text warning-text">
                  Permanently delete all guests, hosts, and settings. This cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
