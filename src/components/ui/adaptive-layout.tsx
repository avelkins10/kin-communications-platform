"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { useLayout as useLayoutHook } from "@/lib/hooks/use-layout";
import { LayoutMode, UserRole, LayoutPreferences, QueueItem } from "@/types/layout";

// Re-export the unified hook
export { useLayout } from "@/lib/hooks/use-layout";

// Create a context for the adaptive layout components
const AdaptiveLayoutContext = React.createContext<{
  selectedItem: QueueItem | null;
  setSelectedItem: (item: QueueItem | null) => void;
} | undefined>(undefined);

export function useAdaptiveLayout() {
  const context = React.useContext(AdaptiveLayoutContext);
  if (!context) {
    throw new Error('useAdaptiveLayout must be used within a LayoutProvider');
  }
  return context;
}

interface LayoutProviderProps {
  children: React.ReactNode;
  initialMode?: LayoutMode;
  userRole?: UserRole;
}

export function LayoutProvider({ 
  children, 
  initialMode = 'QUEUE_MANAGEMENT',
  userRole = 'employee'
}: LayoutProviderProps) {
  const [selectedItem, setSelectedItem] = React.useState<QueueItem | null>(null);

  const adaptiveLayoutValue = React.useMemo(() => ({
    selectedItem,
    setSelectedItem
  }), [selectedItem]);

  return (
    <AdaptiveLayoutContext.Provider value={adaptiveLayoutValue}>
      {children}
    </AdaptiveLayoutContext.Provider>
  );
}

interface AdaptiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AdaptiveLayout({ children, className }: AdaptiveLayoutProps) {
  const { mode } = useLayoutHook();

  const getLayoutClasses = () => {
    const baseClasses = "min-h-screen transition-all duration-300 ease-in-out";
    
    switch (mode) {
      case 'QUEUE_MANAGEMENT':
        return cn(baseClasses, "grid grid-cols-3 gap-8"); // Desktop: 3 columns with generous spacing
      case 'ACTIVE_CALL':
        return cn(baseClasses, "flex flex-row gap-8"); // Desktop: horizontal layout with generous spacing
      case 'VOICEMAIL_PLAYBACK':
        return cn(baseClasses, "grid grid-cols-2 gap-8"); // Desktop: 2 columns with generous spacing
      default:
        return baseClasses;
    }
  };

  return (
    <div className={cn(getLayoutClasses(), className)}>
      {children}
    </div>
  );
}

interface QueueManagementLayoutProps {
  queueContent: React.ReactNode;
  customerContext: React.ReactNode;
  className?: string;
}

export function QueueManagementLayout({ 
  queueContent, 
  customerContext, 
  className 
}: QueueManagementLayoutProps) {
  // Desktop-only layout: 3 columns with queue taking 2, context taking 1
  return (
    <div className={cn("grid grid-cols-3 gap-8", className)}>
      <div className="col-span-2">
        {queueContent}
      </div>
      <div className="col-span-1">
        {customerContext}
      </div>
    </div>
  );
}

interface ActiveCallLayoutProps {
  callInterface: React.ReactNode;
  floatingPanel?: React.ReactNode;
  className?: string;
}

export function ActiveCallLayout({ 
  callInterface, 
  floatingPanel, 
  className 
}: ActiveCallLayoutProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <div className="w-full">
        {callInterface}
      </div>
      {floatingPanel && (
        <div className="absolute top-6 right-6 w-96 z-10">
          {floatingPanel}
        </div>
      )}
    </div>
  );
}

interface VoicemailPlaybackLayoutProps {
  player: React.ReactNode;
  transcription: React.ReactNode;
  className?: string;
}

export function VoicemailPlaybackLayout({ 
  player, 
  transcription, 
  className 
}: VoicemailPlaybackLayoutProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-8", className)}>
      <div>
        {player}
      </div>
      <div>
        {transcription}
      </div>
    </div>
  );
}

interface LayoutModeIndicatorProps {
  className?: string;
}

export function LayoutModeIndicator({ className }: LayoutModeIndicatorProps) {
  const { mode } = useLayoutHook();

  const getModeInfo = () => {
    switch (mode) {
      case 'QUEUE_MANAGEMENT':
        return { label: 'Queue Management', icon: '📋', description: 'Two-Column Layout' };
      case 'ACTIVE_CALL':
        return { label: 'Active Call', icon: '📞', description: 'Full-Width Layout' };
      case 'VOICEMAIL_PLAYBACK':
        return { label: 'Voicemail Playback', icon: '🎵', description: 'Split-View Layout' };
      default:
        return { label: 'Unknown', icon: '❓', description: '' };
    }
  };

  const modeInfo = getModeInfo();

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-sm",
      className
    )}>
      <span>{modeInfo.icon}</span>
      <span className="font-medium">{modeInfo.label}</span>
      <span className="text-muted-foreground text-xs">{modeInfo.description}</span>
    </div>
  );
}

interface LayoutTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function LayoutTransition({ children, className }: LayoutTransitionProps) {
  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out transform",
      className
    )}>
      {children}
    </div>
  );
}
