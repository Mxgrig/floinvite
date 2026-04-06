/**
 * QuickStartWizard Component
 * Onboarding wizard for new users to see demo data and add their first host
 */

import { useState } from 'react';
import { CheckCircle, Play, UserPlus, ArrowRight, DesktopIcon } from 'lucide-react';
import { Host, Guest } from '../types';
import './QuickStartWizard.css';

interface QuickStartWizardProps {
  onComplete: (firstHost: { name: string; email: string }) => void;
  userEmail?: string;
}

export function QuickStartWizard({ onComplete, userEmail = '' }: QuickStartWizardProps) {
  const [step, setStep] = useState(1);
  const [hostName, setHostName] = useState('');
  const [hostEmail, setHostEmail] = useState(userEmail);

  // Demo data (only for visual representation in Step 1)
  const DEMO_HOSTS: Host[] = [
    { 
      id: 'demo-host-1', 
      name: 'Sarah Chen', 
      email: 'sarah@example.com',
      department: 'Operations', 
      notificationMethod: 'email', 
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const DEMO_GUESTS: Guest[] = [
    { 
      id: 'demo-guest-1', 
      name: 'James Okafor', 
      company: 'Acme Ltd',
      hostId: 'demo-host-1', 
      status: 'Checked In',
      checkInTime: new Date(Date.now() - 30 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 'demo-guest-2', 
      name: 'Priya Nair', 
      company: 'TechCorp',
      hostId: 'demo-host-1', 
      status: 'Checked Out',
      checkInTime: new Date(Date.now() - 120 * 60000).toISOString(),
      checkOutTime: new Date(Date.now() - 60 * 60000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    { 
      id: 'demo-guest-3', 
      name: 'Tom Reeves',
      hostId: 'demo-host-1', 
      status: 'Expected',
      checkInTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const handleSubmitHost = (e: React.FormEvent) => {
    e.preventDefault();
    if (hostName && hostEmail) {
      setStep(3);
    }
  };

  const handleFinish = () => {
    onComplete({ name: hostName, email: hostEmail });
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        <div className="wizard-progress">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <span className="step-num">{step > 1 ? <CheckCircle size={16} /> : '1'}</span>
            <span className="step-label">See it live</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <span className="step-num">{step > 2 ? <CheckCircle size={16} /> : '2'}</span>
            <span className="step-label">Add yourself</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Try kiosk</span>
          </div>
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="wizard-step">
              <div className="step-icon">
                <Play size={48} className="icon-pulse" />
              </div>
              <h1>Welcome to Floinvite</h1>
              <p>We've populated your logbook with some demo data so you can see how it works. This is what your front desk will look like.</p>
              
              <div className="demo-preview">
                <div className="demo-header">
                  <span>Live Logbook Preview</span>
                  <span className="demo-badge">DEMO MODE</span>
                </div>
                <div className="demo-table">
                  {DEMO_GUESTS.map(guest => (
                    <div key={guest.id} className="demo-row">
                      <div className="demo-cell"><strong>{guest.name}</strong></div>
                      <div className="demo-cell">{guest.company || '-'}</div>
                      <div className="demo-cell status-badge">{guest.status}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => setStep(2)} className="btn btn-primary btn-lg">
                This is what I need <ArrowRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <div className="step-icon">
                <UserPlus size={48} />
              </div>
              <h1>Add yourself as a host</h1>
              <p>To receive notifications, you need to be in the system as a host. Let's add your details now.</p>
              
              <form onSubmit={handleSubmitHost} className="wizard-form">
                <div className="form-group">
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    value={hostName} 
                    onChange={(e) => setHostName(e.target.value)} 
                    placeholder="e.g., Jane Smith" 
                    required 
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Your Work Email</label>
                  <input 
                    type="email" 
                    value={hostEmail} 
                    onChange={(e) => setHostEmail(e.target.value)} 
                    placeholder="jane@company.com" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-lg">
                  I'm set up <ArrowRight size={18} />
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <div className="step-icon">
                <CheckCircle size={48} color="#10b981" />
              </div>
              <h1>You're all set!</h1>
              <p>Your account is ready. The next step is to open the Site Access (kiosk) screen. This is what your visitors will see when they arrive.</p>
              
              <div className="kiosk-instruction">
                <div className="instruction-icon">
                  <DesktopIcon size={32} />
                </div>
                <div className="instruction-text">
                  <strong>Kiosk Tip</strong>
                  <p>Open the check-in screen on a tablet at your reception for the best experience.</p>
                </div>
              </div>

              <button onClick={handleFinish} className="btn btn-primary btn-lg">
                Open Site Access <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom icon component since DesktopIcon isn't in standard lucide
function DesktopIcon({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}
