/**
 * Settings Component
 * System configuration, session management, and host setup
 * This is the main control panel for administrators after login
 */

import { useState } from 'react';
import { Users, Clock, Settings as SettingsIcon, Database, Info, Upload, Download, AlertTriangle, CheckCircle, Lock, Shield } from 'lucide-react';
import { AppSettings, Host } from '../types';
import { StorageService } from '../services/storageService';
import { usePersistedState } from '../utils/hooks';
import { STORAGE_KEYS } from '../utils/constants';
import { hasFeature } from '../utils/featureGating';
import { FeatureLocked } from './FeatureLocked';
import { DEFAULT_LABELS, LABEL_PRESETS, LabelPresetKey, getLabelSettings } from '../utils/labelUtils';
import './Settings.css';

type SettingsTab = 'hosts' | 'session' | 'system' | 'backup';

interface SettingsProps {
  onNavigate?: (page: string) => void;
}

export function Settings({ onNavigate }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('hosts');
  const [userTier] = usePersistedState<'starter' | 'compliance' | 'enterprise'>('floinvite_user_tier', 'starter');
  const now = new Date().toISOString();
  const [settings, setSettings] = usePersistedState<AppSettings>(
    STORAGE_KEYS.settings,
    {
      businessName: 'My Company',
      notificationEmail: 'admin@floinvite.com',
      labelPreset: 'default',
      labelSettings: DEFAULT_LABELS,
      createdAt: now,
      updatedAt: now,
      sessionTimeout: 15
    }
  );
  const [formData, setFormData] = useState(settings);
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const labelSettings = getLabelSettings(formData);

  const handlePresetChange = (preset: LabelPresetKey) => {
    const presetLabels = LABEL_PRESETS[preset]?.labels || DEFAULT_LABELS;
    setFormData({
      ...formData,
      labelPreset: preset,
      labelSettings: presetLabels
    });
  };

  const handleLabelChange = (key: keyof typeof labelSettings, value: string) => {
    setFormData({
      ...formData,
      labelPreset: 'custom',
      labelSettings: {
        ...labelSettings,
        [key]: value
      }
    });
  };

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

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (StorageService.importAllData(text)) {
        setImportStatus({ type: 'success', message: 'Data imported successfully. Reloading...' });
        setTimeout(() => window.location.reload(), 800);
      } else {
        setImportStatus({ type: 'error', message: 'Failed to import data.' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImportFile(file);
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
              <h2>{labelSettings.hostSingular} Management</h2>
              <p>Manage the {labelSettings.hostPlural.toLowerCase()} who receive arrival notifications</p>
            </div>

            <div className="info-box">
              <Info size={18} />
              <div>
                <strong>Tip:</strong> Add {labelSettings.hostPlural.toLowerCase()} here, then import {labelSettings.personPlural.toLowerCase()} lists to assign {labelSettings.personPlural.toLowerCase()} to specific {labelSettings.hostPlural.toLowerCase()}. Navigate to the Host Management page for detailed setup.
              </div>
            </div>

            <div className="quick-actions">
              <button className="btn btn-primary">+ Add New {labelSettings.hostSingular}</button>
              <button className="btn btn-secondary">
                <Upload size={18} />
                Import {labelSettings.hostPlural} (CSV)
              </button>
            </div>

            <div className="empty-state">
              <h3>No {labelSettings.hostPlural.toLowerCase()} configured yet</h3>
              <p>Start by adding your first {labelSettings.hostSingular.toLowerCase()} above to begin receiving arrival notifications.</p>
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
                <small>Email address used for sending arrival notifications. Must be admin@floinvite.com</small>
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
                <label>Industry Customization</label>
                <select
                  value={(formData.labelPreset || 'default') as LabelPresetKey}
                  onChange={(e) => handlePresetChange(e.target.value as LabelPresetKey)}
                >
                  {Object.entries(LABEL_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>{preset.name}</option>
                  ))}
                </select>
                <small>Pick a preset to match your industry or customize labels below.</small>
              </div>

              <div className="form-group">
                <label>Label Customization</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                  <div>
                    <label>Person (singular)</label>
                    <input
                      type="text"
                      value={labelSettings.personSingular}
                      onChange={(e) => handleLabelChange('personSingular', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Person (plural)</label>
                    <input
                      type="text"
                      value={labelSettings.personPlural}
                      onChange={(e) => handleLabelChange('personPlural', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Host (singular)</label>
                    <input
                      type="text"
                      value={labelSettings.hostSingular}
                      onChange={(e) => handleLabelChange('hostSingular', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Host (plural)</label>
                    <input
                      type="text"
                      value={labelSettings.hostPlural}
                      onChange={(e) => handleLabelChange('hostPlural', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Check-in term</label>
                    <input
                      type="text"
                      value={labelSettings.checkIn}
                      onChange={(e) => handleLabelChange('checkIn', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Logbook term</label>
                    <input
                      type="text"
                      value={labelSettings.logbook}
                      onChange={(e) => handleLabelChange('logbook', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Walk-in term</label>
                    <input
                      type="text"
                      value={labelSettings.walkIn}
                      onChange={(e) => handleLabelChange('walkIn', e.target.value)}
                    />
                  </div>
                  <div>
                    <label>Expected term</label>
                    <input
                      type="text"
                      value={labelSettings.expected}
                      onChange={(e) => handleLabelChange('expected', e.target.value)}
                    />
                  </div>
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

            {hasFeature(userTier, 'cloud_backup') ? (
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

              <div className="info-box">
                <Info size={18} />
                <div>
                  <strong>Your data lives in this browser.</strong> Clearing site data or switching devices will remove your guests, hosts, and settings.
                  Upgrade to Compliance+ for cloud backup and safer retention.
                </div>
              </div>

              <div className="backup-actions">
                <h3>Backup, Restore & Emergency</h3>
                {importStatus && (
                  <div className={`import-status ${importStatus.type}`}>
                    {importStatus.message}
                  </div>
                )}

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
                      handleImportFile(file);
                    }
                  };
                  input.click();
                }}>
                  <Upload size={18} />
                  Import Data
                </button>
                <p className="help-text">Restore from a previously exported JSON file</p>

                <button
                  type="button"
                  onClick={() => onNavigate?.('evacuation-list')}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginTop: '1rem',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                >
                  <AlertTriangle size={16} />
                  Create Evacuation List
                </button>
                <p className="help-text">Generate emergency evacuation accountability list with all checked-in guests</p>
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
            ) : (
            <div style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <Lock size={48} style={{ color: '#dc2626', marginBottom: '16px', opacity: 0.6 }} />
              <h3 style={{ margin: '16px 0', color: '#1f2937' }}>Cloud Backup - Compliance+ Feature</h3>
              <p style={{ color: '#6b7280', marginBottom: '20px' }}>
                Export and backup your data to protect against data loss. This feature is available in the Compliance+ tier and above.
              </p>
              <div className="info-box" style={{ margin: '0 auto 16px', textAlign: 'left', maxWidth: '520px' }}>
                <Info size={18} />
                <div>
                  <strong>Your data lives in this browser.</strong> Clearing site data or switching devices will remove your guests, hosts, and settings.
                  Upgrade to Compliance+ for cloud backup and safer retention.
                </div>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #d1d5db' }}>
                <strong>Starter tier:</strong> All data is stored locally in your browser<br />
                <strong>Compliance+ tier:</strong> Enable cloud backup and export capabilities
              </div>

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #d1d5db', textAlign: 'center' }}>
                <h3 style={{ color: '#1f2937', marginBottom: '12px', fontSize: '16px' }}>Emergency & Safety</h3>
                <p style={{ color: '#6b7280', marginBottom: '16px' }}>Available on all tiers:</p>
                <button
                  type="button"
                  onClick={() => onNavigate?.('evacuation-list')}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1rem',
                    fontSize: '14px',
                    fontWeight: '700',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textDecoration: 'none',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                >
                  <AlertTriangle size={16} />
                  Create Evacuation List
                </button>
              </div>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('pricing')}
                  style={{
                    marginTop: '24px',
                    background: '#4f46e5',
                    border: 'none',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4338ca';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#4f46e5';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  View Pricing & Upgrade
                </button>
              )}
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
