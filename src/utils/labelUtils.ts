import { AppSettings } from '../types';

export interface LabelSettings {
  personSingular: string;
  personPlural: string;
  hostSingular: string;
  hostPlural: string;
  checkIn: string;
  logbook: string;
  walkIn: string;
  expected: string;
}

export type LabelPresetKey = 'default' | 'construction' | 'healthcare' | 'events' | 'education' | 'custom';

export const DEFAULT_LABELS: LabelSettings = {
  personSingular: 'Visitor',
  personPlural: 'Visitors',
  hostSingular: 'Host',
  hostPlural: 'Hosts',
  checkIn: 'Check-In',
  logbook: 'Logbook',
  walkIn: 'Walk-in Visitor',
  expected: 'Expected Visitor'
};

export const LABEL_PRESETS: Record<LabelPresetKey, { name: string; labels: LabelSettings }> = {
  default: {
    name: 'Default (Offices)',
    labels: DEFAULT_LABELS
  },
  construction: {
    name: 'Construction',
    labels: {
      personSingular: 'Subcontractor',
      personPlural: 'Subcontractors',
      hostSingular: 'Site Manager',
      hostPlural: 'Site Managers',
      checkIn: 'Site Access',
      logbook: 'Access Log',
      walkIn: 'Walk-in Personnel',
      expected: 'Scheduled Personnel'
    }
  },
  healthcare: {
    name: 'Healthcare',
    labels: {
      personSingular: 'Patient',
      personPlural: 'Patients',
      hostSingular: 'Staff Member',
      hostPlural: 'Staff Members',
      checkIn: 'Check-In',
      logbook: 'Visit Log',
      walkIn: 'Walk-in Patient',
      expected: 'Scheduled Appointment'
    }
  },
  events: {
    name: 'Events',
    labels: {
      personSingular: 'Attendee',
      personPlural: 'Attendees',
      hostSingular: 'Organizer',
      hostPlural: 'Organizers',
      checkIn: 'Entry',
      logbook: 'Entry Log',
      walkIn: 'Walk-in Attendee',
      expected: 'Registered Attendee'
    }
  },
  education: {
    name: 'Education',
    labels: {
      personSingular: 'Visitor',
      personPlural: 'Visitors',
      hostSingular: 'Administrator',
      hostPlural: 'Administrators',
      checkIn: 'Check-In',
      logbook: 'Visitor Log',
      walkIn: 'Walk-in Visitor',
      expected: 'Expected Visitor'
    }
  },
  custom: {
    name: 'Custom',
    labels: DEFAULT_LABELS
  }
};

export function getLabelSettings(settings?: AppSettings): LabelSettings {
  const presetKey = (settings?.labelPreset && LABEL_PRESETS[settings.labelPreset as LabelPresetKey])
    ? (settings.labelPreset as LabelPresetKey)
    : 'default';
  const base = LABEL_PRESETS[presetKey]?.labels || DEFAULT_LABELS;
  const overrides = settings?.labelSettings || {};
  return {
    ...base,
    ...overrides
  };
}

export function getLabel(settings: AppSettings | undefined, key: keyof LabelSettings): string {
  return getLabelSettings(settings)[key];
}
