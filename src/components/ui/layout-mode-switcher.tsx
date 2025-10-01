"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLayout } from "@/lib/hooks/use-layout";
import { LayoutMode } from "@/types/layout";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  Phone, 
  Volume2, 
  Monitor,
  Smartphone,
  Tablet
} from "lucide-react";

interface LayoutModeSwitcherProps {
  className?: string;
  showLabels?: boolean;
  showShortcuts?: boolean;
  compact?: boolean;
  allowedModes?: LayoutMode[];
}

const modeConfigs = {
  QUEUE_MANAGEMENT: {
    icon: LayoutGrid,
    label: 'Queue Management',
    description: 'Two-Column Layout',
    shortcut: 'Ctrl+1',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200'
  },
  ACTIVE_CALL: {
    icon: Phone,
    label: 'Active Call',
    description: 'Full-Width Layout',
    shortcut: 'Ctrl+2',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200'
  },
  VOICEMAIL_PLAYBACK: {
    icon: Volume2,
    label: 'Voicemail Playback',
    description: 'Split-View Layout',
    shortcut: 'Ctrl+3',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200'
  }
};

export function LayoutModeSwitcher({
  className,
  showLabels = true,
  showShortcuts = true,
  compact = false,
  allowedModes
}: LayoutModeSwitcherProps) {
  const { mode, setMode } = useLayout();

  const modes = allowedModes || (Object.keys(modeConfigs) as LayoutMode[]);

  const handleModeChange = (newMode: LayoutMode) => {
    setMode(newMode);
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {modes.map((modeKey) => {
          const config = modeConfigs[modeKey];
          const Icon = config.icon;
          const isActive = mode === modeKey;
          
          return (
            <Button
              key={modeKey}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange(modeKey)}
              className={cn(
                "h-8 w-8 p-0",
                isActive && "bg-primary text-primary-foreground"
              )}
              title={config.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Layout Mode</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="h-3 w-3" />
              <span>Desktop</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {modes.map((modeKey) => {
              const config = modeConfigs[modeKey];
              const Icon = config.icon;
              const isActive = mode === modeKey;
              
              return (
                <Button
                  key={modeKey}
                  variant="ghost"
                  onClick={() => handleModeChange(modeKey)}
                  className={cn(
                    "h-auto p-3 justify-start",
                    isActive && config.bgColor,
                    isActive && config.borderColor,
                    isActive && "border"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "p-2 rounded-full",
                      isActive ? config.bgColor : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "h-4 w-4",
                        isActive ? config.color : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          isActive && "text-foreground"
                        )}>
                          {config.label}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Active
                          </Badge>
                        )}
                      </div>
                      {showLabels && (
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                    </div>
                    
                    {showShortcuts && (
                      <div className="text-xs text-muted-foreground">
                        {config.shortcut}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for headers
export function LayoutModeSwitcherCompact({
  className,
  allowedModes
}: {
  className?: string;
  allowedModes?: LayoutMode[];
}) {
  return (
    <LayoutModeSwitcher
      className={className}
      compact={true}
      showLabels={false}
      showShortcuts={false}
      allowedModes={allowedModes}
    />
  );
}

// Full version for settings panels
export function LayoutModeSwitcherFull({
  className,
  allowedModes
}: {
  className?: string;
  allowedModes?: LayoutMode[];
}) {
  return (
    <LayoutModeSwitcher
      className={className}
      compact={false}
      showLabels={true}
      showShortcuts={true}
      allowedModes={allowedModes}
    />
  );
}
