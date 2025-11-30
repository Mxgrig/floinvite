/**
 * Custom React Hooks
 * usePersistedState: State that automatically syncs with localStorage
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * usePersistedState Hook
 * Syncs state with localStorage automatically
 * Useful for: hosts, guests, settings, preferences
 *
 * @example
 * const [hosts, setHosts] = usePersistedState<Host[]>('floinvite_hosts', []);
 * setHosts([...hosts, newHost]); // Automatically saved to localStorage
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to read from localStorage (${key}):`, error);
      return defaultValue;
    }
  });

  // Update localStorage when state changes
  const setPersistentState = useCallback(
    (value: T | ((val: T) => T)) => {
      setState(prevState => {
        const newValue = value instanceof Function ? value(prevState) : value;
        try {
          localStorage.setItem(key, JSON.stringify(newValue));
        } catch (error) {
          console.error(`Failed to write to localStorage (${key}):`, error);
        }
        return newValue;
      });
    },
    [key]
  );

  // Sync across tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          setState(JSON.parse(event.newValue));
        } catch (error) {
          console.error(`Failed to sync from storage event (${key}):`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

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
export function useFormState<T extends Record<string, any>>(
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
