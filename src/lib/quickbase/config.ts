import * as Sentry from '@sentry/nextjs';

/**
 * Quickbase configuration interface
 */
export interface QuickbaseConfig {
  realm: string;
  appId: string;
  userToken: string;
  tableId: string;
  baseUrl: string;
  enabled: boolean;
}

/**
 * Configuration validation result
 */
export interface QuickbaseConfigValidation {
  valid: boolean;
  enabled: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Quickbase configuration
 * 
 * This function checks if all required environment variables are set
 * and validates their format. It also checks if Quickbase is enabled.
 * 
 * @returns Configuration validation result
 */
export function validateQuickbaseConfig(): QuickbaseConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if Quickbase is disabled
  const enabled = process.env.QUICKBASE_ENABLED !== 'false';
  if (!enabled) {
    return {
      valid: true,
      enabled: false,
      errors: [],
      warnings: ['Quickbase integration is disabled via QUICKBASE_ENABLED=false']
    };
  }

  // Check required environment variables
  if (!process.env.QUICKBASE_REALM || process.env.QUICKBASE_REALM.trim() === '') {
    errors.push('QUICKBASE_REALM is required');
  }

  if (!process.env.QUICKBASE_USER_TOKEN || process.env.QUICKBASE_USER_TOKEN.trim() === '') {
    errors.push('QUICKBASE_USER_TOKEN is required');
  }

  if (!process.env.QUICKBASE_APP_ID && !process.env.QUICKBASE_TABLE_ID) {
    errors.push('Either QUICKBASE_APP_ID or QUICKBASE_TABLE_ID is required');
  }

  if (!process.env.QUICKBASE_BASE_URL || !isValidUrl(process.env.QUICKBASE_BASE_URL)) {
    errors.push('QUICKBASE_BASE_URL must be a valid URL');
  }

  // Check optional but recommended variables
  if (!process.env.QUICKBASE_TABLE_COMMUNICATIONS) {
    warnings.push('QUICKBASE_TABLE_COMMUNICATIONS not set - communication logging will be disabled');
  }

  if (!process.env.QUICKBASE_TABLE_PC) {
    warnings.push('QUICKBASE_TABLE_PC not set - project coordinator lookups will be disabled');
  }

  return {
    valid: errors.length === 0,
    enabled,
    errors,
    warnings
  };
}

/**
 * Get validated Quickbase configuration
 * 
 * This function validates the configuration and returns the config object
 * if valid, or null if invalid.
 * 
 * @returns Validated configuration or null if invalid
 */
export function getQuickbaseConfig(): QuickbaseConfig | null {
  const validation = validateQuickbaseConfig();
  
  if (!validation.valid) {
    console.error('Invalid Quickbase configuration:', validation.errors);
    return null;
  }

  if (!validation.enabled) {
    return null;
  }

  return {
    realm: process.env.QUICKBASE_REALM || '',
    appId: process.env.QUICKBASE_APP_ID || '',
    userToken: process.env.QUICKBASE_USER_TOKEN || '',
    tableId: process.env.QUICKBASE_TABLE_ID || '',
    baseUrl: process.env.QUICKBASE_BASE_URL || 'https://api.quickbase.com/v1',
    enabled: validation.enabled
  };
}

/**
 * Log Quickbase configuration status at startup
 * 
 * This function should be called during application startup to validate
 * and log the Quickbase configuration status.
 */
export function logQuickbaseConfigStatus(): void {
  const validation = validateQuickbaseConfig();
  
  if (!validation.enabled) {
    console.log('🔧 Quickbase integration: DISABLED');
    return;
  }

  if (validation.valid) {
    console.log('✅ Quickbase integration: ENABLED and configured');
    if (validation.warnings.length > 0) {
      console.warn('⚠️  Quickbase warnings:', validation.warnings);
    }
  } else {
    console.error('❌ Quickbase integration: ENABLED but misconfigured');
    console.error('Configuration errors:', validation.errors);
  }

  // Add Sentry breadcrumb for configuration status
  Sentry.addBreadcrumb({
    category: 'quickbase',
    message: 'Configuration validated',
    level: validation.valid ? 'info' : 'error',
    data: {
      enabled: validation.enabled,
      valid: validation.valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    }
  });
}

/**
 * Check if a URL is valid
 * 
 * @param url URL string to validate
 * @returns True if URL is valid, false otherwise
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Quickbase field mappings from environment variables
 * 
 * @returns Object containing field ID mappings
 */
export function getQuickbaseFieldMappings() {
  return {
    // Customer fields
    customerPhone: process.env.QUICKBASE_FIELD_PHONE || '148',
    projectCoordinator: process.env.QUICKBASE_FIELD_PROJECT_COORDINATOR || '346',
    projectStatus: process.env.QUICKBASE_FIELD_PROJECT_STATUS || '255',
    
    // Communication logging fields
    communications: {
      customer: process.env.QUICKBASE_FID_CUSTOMER || '1',
      type: process.env.QUICKBASE_FID_TYPE || '2',
      direction: process.env.QUICKBASE_FID_DIRECTION || '3',
      timestamp: process.env.QUICKBASE_FID_TIMESTAMP || '4',
      duration: process.env.QUICKBASE_FID_DURATION || '5',
      agent: process.env.QUICKBASE_FID_AGENT || '6',
      notes: process.env.QUICKBASE_FID_NOTES || '7',
      recording: process.env.QUICKBASE_FID_RECORDING || '8',
      status: process.env.QUICKBASE_FID_STATUS || '9'
    },
    
    // Project coordinator fields
    pc: {
      id: process.env.QUICKBASE_FID_PC_ID || '1',
      name: process.env.QUICKBASE_FID_PC_NAME || '2',
      email: process.env.QUICKBASE_FID_PC_EMAIL || '3',
      phone: process.env.QUICKBASE_FID_PC_PHONE || '4',
      availability: process.env.QUICKBASE_FID_PC_AVAILABILITY || '5',
      assignedCustomers: process.env.QUICKBASE_FID_PC_ASSIGNED_CUSTOMERS || '6',
      workload: process.env.QUICKBASE_FID_PC_WORKLOAD || '7'
    }
  };
}

/**
 * Get Quickbase table IDs from environment variables
 * 
 * @returns Object containing table ID mappings
 */
export function getQuickbaseTableIds() {
  return {
    communications: process.env.QUICKBASE_TABLE_COMMUNICATIONS,
    pc: process.env.QUICKBASE_TABLE_PC,
    projects: process.env.QUICKBASE_TABLE_PROJECTS
  };
}
