/**
 * Settings Component
 * App configuration and preferences
 */

import { useState } from 'react';
import { AppSettings } from '../types';
import { StorageService } from '../services/storageService';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import './Settings.css';

type SettingsTab = 'general' | 'notifications' | 'data' | 'about';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const now = new Date().toISOString();
  const [settings, setSettings] = usePersistedState<AppSettings>(
    STORAGE_KEYS.settings,
    {
      businessName: 'My Company',
      notificationEmail: 'admin@floinvite.com',
      createdAt: now,
      updatedAt: now
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
    <div className="settings-container">
      <h1>Settings</h1>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          General
        </button>
        <button
          className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notifications
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          Data & Backup
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="settings-content">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="tab-panel">
            <h2>General Settings</h2>

            <div className="settings-form">
              <div className="form-group">
                <label>Business Name</label>
                <input
                  type="text"
                  value={formData.businessName || ''}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="Your company name"
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

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    defaultChecked
                  />
                  <span>Enable dark mode</span>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.kioskMode ?? false}
                    onChange={(e) => setFormData({ ...formData, kioskMode: e.target.checked })}
                  />
                  <span>Enable Kiosk Mode</span>
                </label>
                <small>Fullscreen mode with hidden navbar, optimized for tablet/kiosk displays</small>
              </div>

              {formData.kioskMode && (
                <div className="info-box">
                  <strong>💡 Kiosk Mode Active:</strong> Press F11 or use the fullscreen button below to enter fullscreen. Press ESC to exit.
                </div>
              )}

              <button
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(err =>
                      alert(`Error attempting to enable fullscreen: ${err.message}`)
                    );
                  }
                }}
                className="btn btn-secondary"
              >
                Enter Fullscreen
              </button>

              {saved && <div className="success-message">✓ Settings saved</div>}

              <button onClick={handleSave} className="btn btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="tab-panel">
            <h2>Notification Settings</h2>

            <div className="notification-settings">
              <div className="setting-item">
                <h3>Email Notifications</h3>
                <p>From: {formData.notificationEmail}</p>
                <p className="help-text">
                  Emails will be sent from this address when guests check in
                </p>
              </div>

              <div className="setting-item">
                <h3>Notification Tones</h3>
                <p>Choose how formal or casual your visitor notifications are</p>
                <select>
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Casual</option>
                </select>
              </div>

              <div className="setting-item">
                <h3>Quiet Hours</h3>
                <p>Set a time window when notifications are not sent</p>
                <div className="time-inputs">
                  <input type="time" placeholder="Start time" />
                  <span>to</span>
                  <input type="time" placeholder="End time" />
                </div>
              </div>

              <div className="info-box">
                <strong>💡 Pro Tip:</strong> Configure per-host notification preferences in Host Management
              </div>
            </div>
          </div>
        )}

        {/* Data & Backup Tab */}
        {activeTab === 'data' && (
          <div className="tab-panel">
            <h2>Data & Backup</h2>

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
                    ⚠️ Storage nearly full. Consider exporting and clearing old data.
                  </div>
                )}
              </div>

              <div className="backup-actions">
                <h3>Backup & Restore</h3>
                
                <button onClick={handleExportData} className="btn btn-secondary">
                  📥 Export All Data
                </button>
                <p className="help-text">Download all your data as a JSON file</p>

                <button className="btn btn-secondary" onClick={(e) => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const text = e.target?.result as string;
                        handleImportData({
                          target: { files: [file] }
                        } as any);
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}>
                  📤 Import Data
                </button>
                <p className="help-text">Restore from a previously exported JSON file</p>
              </div>

              <div className="danger-zone">
                <h3>⚠️ Danger Zone</h3>
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

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="tab-panel">
            <h2>About Floinvite</h2>

            <div className="about-section">
              <div className="about-box">
                <h3>🎯 Version</h3>
                <p>Floinvite v1.0.0</p>
              </div>

              <div className="about-box">
                <h3>📖 What is Floinvite?</h3>
                <p>
                  Floinvite is a modern visitor management system designed for small to medium-sized offices.
                  It helps you track guest arrivals, send instant notifications, and maintain professional records.
                </p>
              </div>

              <div className="about-box">
                <h3>🔒 Privacy & Security</h3>
                <p>
                  Your data stays on your device. We don't store anything on our servers unless you upgrade
                  to a paid plan with cloud backup.
                </p>
              </div>

              <div className="about-box">
                <h3>📱 Offline Support</h3>
                <p>
                  Floinvite works completely offline. Check in guests, manage hosts, and generate reports
                  without an internet connection.
                </p>
              </div>

              <div className="about-box">
                <h3>💬 Support</h3>
                <p>
                  Questions? Contact us at{' '}
                  <strong>admin@floinvite.com</strong>
                </p>
              </div>

              <div className="about-box">
                <h3>🌐 Links</h3>
                <ul>
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#terms">Terms of Service</a></li>
                  <li><a href="#status">System Status</a></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
