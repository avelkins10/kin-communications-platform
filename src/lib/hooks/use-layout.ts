"use client";
import * as React from "react";
import { 
  LayoutMode, 
  UserRole, 
  LayoutPreferences, 
  ResponsiveBreakpoint,
  LayoutHookReturn,
  LayoutModeConfig,
  LayoutMetrics,
  QueueItem
} from "@/types/layout";

const LAYOUT_PREFERENCES_KEY = 'layout-preferences';
const LAYOUT_METRICS_KEY = 'layout-metrics';

const defaultPreferences: LayoutPreferences = {
  defaultMode: 'QUEUE_MANAGEMENT',
  autoSwitch: true,
  showFloatingPanel: true,
  panelPosition: 'right',
  compactMode: false,
  showAnimations: true,
  keyboardShortcuts: true
};

const modeConfigs: Record<LayoutMode, LayoutModeConfig> = {
  QUEUE_MANAGEMENT: {
    mode: 'QUEUE_MANAGEMENT',
    name: 'Queue Management',
    description: 'Two-Column Layout: Queue List | Customer Context',
    icon: '📋',
    layout: {
      type: 'grid',
      columns: 3,
      gap: 4
    },
    allowedRoles: ['manager', 'employee', 'admin'],
    keyboardShortcut: 'Ctrl+1'
  },
  ACTIVE_CALL: {
    mode: 'ACTIVE_CALL',
    name: 'Active Call',
    description: 'Full-Width Layout with floating customer panel',
    icon: '📞',
    layout: {
      type: 'flex',
      gap: 4
    },
    allowedRoles: ['manager', 'employee', 'admin'],
    keyboardShortcut: 'Ctrl+2'
  },
  VOICEMAIL_PLAYBACK: {
    mode: 'VOICEMAIL_PLAYBACK',
    name: 'Voicemail Playback',
    description: 'Split-View Layout: Player | Transcription',
    icon: '🎵',
    layout: {
      type: 'grid',
      columns: 2,
      gap: 4
    },
    allowedRoles: ['manager', 'employee', 'admin'],
    keyboardShortcut: 'Ctrl+3'
  },
  MESSAGING: {
    mode: 'MESSAGING',
    name: 'Messaging',
    description: 'Three-Column Layout: Conversations | Thread | Customer Context',
    icon: '💬',
    layout: {
      type: 'grid',
      columns: 3,
      gap: 4
    },
    allowedRoles: ['manager', 'employee', 'admin'],
    keyboardShortcut: 'Ctrl+4'
  }
};

export function useLayout(userRole: UserRole = 'employee'): LayoutHookReturn {
  const [mode, setModeState] = React.useState<LayoutMode>('QUEUE_MANAGEMENT');
  const [selectedItem, setSelectedItem] = React.useState<QueueItem | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(true);
  const [preferences, setPreferencesState] = React.useState<LayoutPreferences>(defaultPreferences);
  const [breakpoint, setBreakpoint] = React.useState<ResponsiveBreakpoint>('desktop');
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const [metrics, setMetrics] = React.useState<LayoutMetrics>({
    mode: 'QUEUE_MANAGEMENT',
    duration: 0,
    interactions: 0,
    itemsProcessed: 0,
    efficiency: 0
  });
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Hydration effect
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Load preferences from localStorage (only after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    
    const saved = localStorage.getItem(LAYOUT_PREFERENCES_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferencesState(prev => ({ ...prev, ...parsed }));
        if (parsed.defaultMode) {
          setModeState(parsed.defaultMode);
        }
      } catch (error) {
        console.error('Failed to load layout preferences:', error);
      }
    }
  }, [isHydrated]);

  // Load metrics from localStorage (only after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    
    const saved = localStorage.getItem(LAYOUT_METRICS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMetrics(parsed);
      } catch (error) {
        console.error('Failed to load layout metrics:', error);
      }
    }
  }, [isHydrated]);

  // Save preferences to localStorage (only after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LAYOUT_PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences, isHydrated]);

  // Save metrics to localStorage (only after hydration)
  React.useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(LAYOUT_METRICS_KEY, JSON.stringify(metrics));
  }, [metrics, isHydrated]);

  // Desktop-only: No responsive logic needed

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!preferences.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            event.preventDefault();
            setMode('QUEUE_MANAGEMENT');
            break;
          case '2':
            event.preventDefault();
            setMode('ACTIVE_CALL');
            break;
          case '3':
            event.preventDefault();
            setMode('VOICEMAIL_PLAYBACK');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [preferences.keyboardShortcuts]);

  // Track mode duration
  React.useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      updateMetrics(mode, duration);
    };
  }, [mode]);

  // Cross-tab synchronization
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === LAYOUT_PREFERENCES_KEY && event.newValue) {
        try {
          const newPreferences = JSON.parse(event.newValue);
          setPreferencesState(newPreferences);
        } catch (error) {
          console.error('Failed to sync layout preferences:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setMode = React.useCallback((newMode: LayoutMode) => {
    if (!canUseMode(newMode)) {
      console.warn(`User role ${userRole} cannot use mode ${newMode}`);
      return;
    }

    if (preferences.autoSwitch || newMode !== mode) {
      setIsTransitioning(true);
      setModeState(newMode);
      
      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [mode, preferences.autoSwitch, userRole]);

  const selectItem = React.useCallback((item: QueueItem | null) => {
    setSelectedItem(item);
    
    // Auto-switch to appropriate mode based on item type
    if (preferences.autoSwitch && item) {
      switch (item.type) {
        case 'voicemail':
          setMode('VOICEMAIL_PLAYBACK');
          break;
        case 'call':
          setMode('ACTIVE_CALL');
          break;
        default:
          setMode('QUEUE_MANAGEMENT');
          break;
      }
    }
  }, [preferences.autoSwitch, setMode]);

  const setPreferences = React.useCallback((newPreferences: Partial<LayoutPreferences>) => {
    setPreferencesState(prev => ({ ...prev, ...newPreferences }));
  }, []);

  const canUseMode = React.useCallback((mode: LayoutMode) => {
    const config = modeConfigs[mode];
    return config.allowedRoles.includes(userRole);
  }, [userRole]);

  const getModeConfig = React.useCallback((mode: LayoutMode) => {
    return modeConfigs[mode];
  }, []);

  const updateMetrics = React.useCallback((mode: LayoutMode, duration: number) => {
    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        mode,
        duration: prev.mode === mode ? prev.duration + duration : duration,
        interactions: prev.interactions + 1,
        itemsProcessed: selectedItem ? prev.itemsProcessed + 1 : prev.itemsProcessed,
        efficiency: calculateEfficiency(prev.itemsProcessed, prev.duration)
      };
      return newMetrics;
    });
  }, [selectedItem]);

  const calculateEfficiency = (itemsProcessed: number, duration: number): number => {
    if (duration === 0) return 0;
    const itemsPerMinute = (itemsProcessed / duration) * 60;
    // Normalize to 0-100 scale (assuming 10 items per minute is 100% efficiency)
    return Math.min(100, (itemsPerMinute / 10) * 100);
  };

  return {
    // State
    mode,
    selectedItem,
    isMobile,
    isTablet,
    isDesktop,
    preferences,
    breakpoint,
    
    // Actions
    setMode,
    selectItem,
    setPreferences,
    
    // Utilities
    canUseMode,
    getModeConfig,
    isTransitioning,
    
    // Metrics
    metrics,
    updateMetrics
  };
}

// Utility hook for layout mode switching
export function useLayoutModeSwitching() {
  const [modeHistory, setModeHistory] = React.useState<LayoutMode[]>(['QUEUE_MANAGEMENT']);
  const [lastMode, setLastMode] = React.useState<LayoutMode | null>(null);

  const switchMode = React.useCallback((newMode: LayoutMode, currentMode: LayoutMode) => {
    setLastMode(currentMode);
    setModeHistory(prev => [...prev, newMode].slice(-10)); // Keep last 10 modes
  }, []);

  const goBack = React.useCallback(() => {
    if (modeHistory.length > 1) {
      const previousMode = modeHistory[modeHistory.length - 2];
      setModeHistory(prev => prev.slice(0, -1));
      return previousMode;
    }
    return null;
  }, [modeHistory]);

  const canGoBack = modeHistory.length > 1;

  return {
    modeHistory,
    lastMode,
    switchMode,
    goBack,
    canGoBack
  };
}

// Desktop-only: No responsive layout needed

// Utility hook for layout persistence
export function useLayoutPersistence() {
  const saveLayoutState = React.useCallback((state: any) => {
    try {
      localStorage.setItem('layout-state', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save layout state:', error);
    }
  }, []);

  const loadLayoutState = React.useCallback(() => {
    try {
      const saved = localStorage.getItem('layout-state');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Failed to load layout state:', error);
      return null;
    }
  }, []);

  const clearLayoutState = React.useCallback(() => {
    try {
      localStorage.removeItem('layout-state');
    } catch (error) {
      console.error('Failed to clear layout state:', error);
    }
  }, []);

  return {
    saveLayoutState,
    loadLayoutState,
    clearLayoutState
  };
}
