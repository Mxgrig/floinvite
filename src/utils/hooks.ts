/**
 * Custom React Hooks
 * usePersistedState: State that automatically syncs with IndexedDB or localStorage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { db, dbUtils } from '../db/floinviteDB';
import { Host, Guest, AppSettings } from '../types';

/**
 * usePersistedState Hook
 * Syncs state with IndexedDB (for user data) or localStorage (for simple data)
 *
 * Uses IndexedDB for:
 * - 'hosts' -> db.hosts
 * - 'guests' -> db.guests
 * - 'settings' -> db.settings
 *
 * Uses localStorage for:
 * - auth tokens, emails, simple preferences
 *
 * @example
 * const [hosts, setHosts] = usePersistedState<Host[]>('hosts', []);
 * setHosts([...hosts, newHost]); // Automatically saved to IndexedDB
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        let data: T | null = defaultValue;

        // Load from IndexedDB for user data
        if (key === 'hosts') {
          data = await dbUtils.getAllHosts();
        } else if (key === 'guests') {
          data = await dbUtils.getAllGuests();
        } else if (key === 'settings') {
          data = await dbUtils.getSettings();
        } else {
          // Fall back to localStorage for other data
          const item = localStorage.getItem(key);
          data = item ? JSON.parse(item) : defaultValue;
        }

        setState(data ?? defaultValue);
      } catch (error) {
        console.error(`Failed to load persisted state (${key}):`, error);
        setState(defaultValue);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [key, defaultValue]);

  // Save state changes to appropriate storage
  const setPersistentState = useCallback(
    (value: T | ((val: T) => T)) => {
      setState(prevState => {
        const newValue = value instanceof Function ? value(prevState) : value;

        // Save to appropriate storage
        if (key === 'hosts') {
          if (Array.isArray(newValue)) {
            dbUtils.bulkUpsertHosts(newValue as Host[]).catch(error =>
              console.error('Failed to save hosts to IndexedDB:', error)
            );
          }
        } else if (key === 'guests') {
          if (Array.isArray(newValue)) {
            dbUtils.bulkUpsertGuests(newValue as Guest[]).catch(error =>
              console.error('Failed to save guests to IndexedDB:', error)
            );
          }
        } else if (key === 'settings') {
          dbUtils.updateSettings(newValue as AppSettings).catch(error =>
            console.error('Failed to save settings to IndexedDB:', error)
          );
        } else {
          // Save to localStorage for non-user-data
          try {
            localStorage.setItem(key, JSON.stringify(newValue));
          } catch (error) {
            console.error(`Failed to write to localStorage (${key}):`, error);
          }
        }

        return newValue;
      });
    },
    [key]
  );

  return [state, setPersistentState];
}

/**
 * useLocalStorage Hook (alternative to usePersistedState)
 * Lower-level access for direct localStorage manipulation
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const setStorageValue = useCallback((newValue: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
      setValue(newValue);
    } catch (error) {
      console.error('Failed to set localStorage value:', error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setValue(defaultValue);
    } catch (error) {
      console.error('Failed to remove localStorage value:', error);
    }
  }, [key, defaultValue]);

  return [value, setStorageValue, removeValue];
}

/**
 * useDebounce Hook
 * Debounces a value with specified delay
 * Useful for: search input, auto-save
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 * useEffect(() => {
 *   // This runs after user stops typing for 300ms
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * usePrevious Hook
 * Gets the previous value of a variable
 * Useful for: comparing old vs new state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useAsync Hook
 * Handles async operations with loading/error states
 * Useful for: API calls, data fetching
 *
 * @example
 * const { data, loading, error } = useAsync(() => fetchHosts(), []);
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [state, setState] = useState<{
    loading: boolean;
    data: T | null;
    error: Error | null;
  }>({
    loading: immediate,
    data: null,
    error: null
  });

  const execute = useCallback(async () => {
    setState({ loading: true, data: null, error: null });
    try {
      const response = await asyncFunction();
      setState({ loading: false, data: response, error: null });
      return response;
    } catch (error) {
      setState({ loading: false, data: null, error: error as Error });
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

/**
 * useToggle Hook
 * Manages boolean state with toggle function
 * Useful for: modals, dropdowns, visibility toggles
 *
 * @example
 * const [isOpen, toggle] = useToggle(false);
 * <button onClick={() => toggle()}>Toggle</button>
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, (value?: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback((val?: boolean) => {
    setValue(prev => (typeof val === 'boolean' ? val : !prev));
  }, []);

  return [value, toggle];
}

/**
 * useWindowSize Hook
 * Tracks window size changes
 * Useful for: responsive UI, media queries
 */
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * useIsMobile Hook
 * Returns true if screen width <= 640px (mobile breakpoint)
 */
export function useIsMobile(breakpoint: number = 640): boolean {
  const { width } = useWindowSize();
  return width <= breakpoint;
}

/**
 * useIsTablet Hook
 * Returns true if screen width >= 600px (tablet minimum)
 */
export function useIsTablet(breakpoint: number = 600): boolean {
  const { width } = useWindowSize();
  return width >= breakpoint;
}

/**
 * useClickOutside Hook
 * Detects clicks outside of a ref element
 * Useful for: closing modals, dropdowns
 *
 * @example
 * const ref = useRef(null);
 * useClickOutside(ref, () => setIsOpen(false));
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  callback: () => void
): void {
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
}

/**
 * useFormState Hook
 * Manages form state with validation
 * Useful for: form handling, validation feedback
 */
export function useFormState<T extends Record<string, unknown>>(
  initialValues: T
) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setValues(prev => ({ ...prev, [name]: value }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched(prev => ({ ...prev, [name]: true }));
    },
    []
  );

  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    setFieldError,
    touched,
    handleChange,
    handleBlur,
    reset
  };
}

/**
 * useInactivityLogout Hook
 * Automatically logs out user after specified inactivity period
 * Tracks: mouse movement, keyboard, clicks, scrolling, touch
 *
 * @param onLogout - Callback function to execute on logout
 * @param timeoutMinutes - Inactivity timeout in minutes (default: 15)
 *
 * @example
 * const [isAuthenticated, setIsAuthenticated] = usePersistedState('auth_token', false);
 * useInactivityLogout(() => setIsAuthenticated(false), 15);
 */
export function useInactivityLogout(
  onLogout: () => void,
  timeoutMinutes: number = 15
): void {
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onLogout();
    }, timeoutMs);
  }, [timeoutMs, onLogout, timeoutMinutes]);

  // Track user activity
  useEffect(() => {
    // List of activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'wheel'
    ];

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only reset timer if at least 1 second has passed since last activity
      // This prevents excessive timer resets from rapid events
      if (timeSinceLastActivity > 1000) {
        resetTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);
}
