export type LayoutMode = 'QUEUE_MANAGEMENT' | 'ACTIVE_CALL' | 'VOICEMAIL_PLAYBACK' | 'MESSAGING';

export type UserRole = 'manager' | 'employee' | 'admin';

export type LayoutAction = 
  | 'switch-to-queue-management'
  | 'switch-to-active-call'
  | 'switch-to-voicemail-playback'
  | 'select-item'
  | 'deselect-item'
  | 'toggle-panel'
  | 'set-preferences';

export type ResponsiveBreakpoint = 'desktop';

export interface LayoutPreferences {
  defaultMode: LayoutMode;
  autoSwitch: boolean;
  showFloatingPanel: boolean;
  panelPosition: 'left' | 'right';
  compactMode: boolean;
  showAnimations: boolean;
  keyboardShortcuts: boolean;
}

export interface LayoutContext {
  mode: LayoutMode;
  selectedItem: QueueItem | null;
  isDesktop: boolean;
  preferences: LayoutPreferences;
  breakpoint: ResponsiveBreakpoint;
}

export interface LayoutState {
  mode: LayoutMode;
  selectedItem: QueueItem | null;
  isTransitioning: boolean;
  lastMode: LayoutMode | null;
  modeHistory: LayoutMode[];
}

export interface QueueItem {
  id: string;
  type: QueueItemType;
  priority: QueueItemPriority;
  status: QueueItemStatus;
  customer: CustomerInfo;
  project?: ProjectInfo;
  assignedTo?: UserInfo;
  sla?: SlaInfo;
  metadata: ItemMetadata;
  actions?: ItemActions;
}

export type QueueItemType = 'call' | 'voicemail' | 'message' | 'task';

export type QueueItemPriority = 'urgent' | 'high' | 'medium' | 'low';

export type QueueItemStatus = 'new' | 'assigned' | 'in-progress' | 'completed' | 'overdue';

export interface CustomerInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  location?: string;
  notes?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  status: 'PRE-PTO' | 'POST-PTO';
  coordinator?: string;
  startDate?: Date;
  endDate?: Date;
  description?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'available' | 'busy' | 'offline' | 'away';
  avatar?: string;
  skills?: string[];
}

export interface SlaInfo {
  deadline: Date;
  type: SlaType;
  warningThreshold: number; // minutes
  escalationLevel: number;
  autoEscalate: boolean;
}

export type SlaType = 'voicemail-callback' | 'text-response' | 'missed-call-followup' | 'custom';

export interface ItemMetadata {
  duration?: number; // seconds for calls/voicemails
  transcript?: string; // for voicemails
  content?: string; // for messages/tasks
  createdAt: Date;
  updatedAt: Date;
  source?: string;
  tags?: string[];
  attachments?: AttachmentInfo[];
}

export interface AttachmentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: Date;
}

export interface ItemActions {
  canCall?: boolean;
  canText?: boolean;
  canCallback?: boolean;
  canAssign?: boolean;
  canComplete?: boolean;
  canPlay?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canEscalate?: boolean;
}

export interface LayoutModeConfig {
  mode: LayoutMode;
  name: string;
  description: string;
  icon: string;
  layout: LayoutConfig;
  allowedRoles: UserRole[];
  keyboardShortcut?: string;
}

export interface LayoutConfig {
  type: 'grid' | 'flex' | 'stack';
  columns?: number;
  rows?: number;
  gap?: number;
  padding?: number;
  responsive?: ResponsiveConfig;
}

// Desktop-only: No responsive config needed

export interface LayoutTransition {
  from: LayoutMode;
  to: LayoutMode;
  duration: number;
  easing: string;
  animation?: string;
}

export interface LayoutEvent {
  type: LayoutAction;
  payload?: any;
  timestamp: Date;
  userId?: string;
}

export interface LayoutMetrics {
  mode: LayoutMode;
  duration: number; // seconds spent in this mode
  interactions: number;
  itemsProcessed: number;
  efficiency: number; // 0-100
}

export interface QueueMetrics {
  totalItems: number;
  itemsByType: Record<QueueItemType, number>;
  itemsByPriority: Record<QueueItemPriority, number>;
  itemsByStatus: Record<QueueItemStatus, number>;
  slaCompliance: number;
  averageHandleTime: number;
  oldestItem: Date | null;
}

export interface PerformanceMetrics {
  handleRate: number;
  averageSpeedOfAnswer: number;
  abandonRate: number;
  agentUtilization: number;
  customerSatisfaction: number;
  firstCallResolution: number;
}

export interface PresenceMetrics {
  totalAgents: number;
  availableAgents: number;
  busyAgents: number;
  offlineAgents: number;
  awayAgents: number;
  averageResponseTime: number;
}

export interface LayoutHookReturn {
  // State
  mode: LayoutMode;
  selectedItem: QueueItem | null;
  isDesktop: boolean;
  preferences: LayoutPreferences;
  breakpoint: ResponsiveBreakpoint;
  
  // Actions
  setMode: (mode: LayoutMode) => void;
  selectItem: (item: QueueItem | null) => void;
  setPreferences: (preferences: Partial<LayoutPreferences>) => void;
  
  // Utilities
  canUseMode: (mode: LayoutMode) => boolean;
  getModeConfig: (mode: LayoutMode) => LayoutModeConfig;
  isTransitioning: boolean;
  
  // Metrics
  metrics: LayoutMetrics;
  updateMetrics: (mode: LayoutMode, duration: number) => void;
}

export interface AdaptiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  initialMode?: LayoutMode;
  userRole?: UserRole;
  onModeChange?: (mode: LayoutMode) => void;
  onItemSelect?: (item: QueueItem | null) => void;
}

export interface QueueManagementLayoutProps {
  queueContent: React.ReactNode;
  customerContext: React.ReactNode;
  className?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  showSorting?: boolean;
}

export interface ActiveCallLayoutProps {
  callInterface: React.ReactNode;
  floatingPanel?: React.ReactNode;
  className?: string;
  showCallControls?: boolean;
  showCustomerInfo?: boolean;
  showCallHistory?: boolean;
}

export interface VoicemailPlaybackLayoutProps {
  player: React.ReactNode;
  transcription: React.ReactNode;
  className?: string;
  showControls?: boolean;
  showTranscript?: boolean;
  showCustomerInfo?: boolean;
}

export interface LayoutModeSwitcherProps {
  className?: string;
  showLabels?: boolean;
  showShortcuts?: boolean;
  compact?: boolean;
  allowedModes?: LayoutMode[];
}

export interface LayoutModeIndicatorProps {
  className?: string;
  showDescription?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface LayoutTransitionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  easing?: string;
  animation?: string;
}

// Utility types
export type LayoutModeKey = keyof typeof LayoutMode;
export type UserRoleKey = keyof typeof UserRole;
export type QueueItemTypeKey = keyof typeof QueueItemType;
export type QueueItemPriorityKey = keyof typeof QueueItemPriority;
export type QueueItemStatusKey = keyof typeof QueueItemStatus;

// Event types
export interface LayoutModeChangeEvent {
  previousMode: LayoutMode;
  newMode: LayoutMode;
  reason: 'user-action' | 'auto-switch' | 'keyboard-shortcut' | 'system';
  timestamp: Date;
}

export interface ItemSelectionEvent {
  item: QueueItem | null;
  previousItem: QueueItem | null;
  timestamp: Date;
}

export interface PreferenceChangeEvent {
  preferences: LayoutPreferences;
  changedKeys: (keyof LayoutPreferences)[];
  timestamp: Date;
}

// API types
export interface LayoutApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface LayoutPreferencesApiResponse extends LayoutApiResponse {
  data?: LayoutPreferences;
}

export interface QueueMetricsApiResponse extends LayoutApiResponse {
  data?: QueueMetrics;
}

export interface PerformanceMetricsApiResponse extends LayoutApiResponse {
  data?: PerformanceMetrics;
}

export interface PresenceMetricsApiResponse extends LayoutApiResponse {
  data?: PresenceMetrics;
}
