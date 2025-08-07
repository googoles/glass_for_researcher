/**
 * Environment detection utilities for Pickle Glass
 * Helps distinguish between Electron desktop app and web browser
 */

export interface RuntimeConfig {
  API_URL: string;
  MODE: string;
  ENVIRONMENT?: string;
  WEB_URL?: string;
  timestamp?: number;
}

/**
 * Check if the app is running in Electron environment
 */
export function isElectronEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for electron-specific globals
  return !!(
    (window as any).process?.type ||
    (window as any).electronAPI ||
    (window as any).api ||
    (window as any).require ||
    (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron')) ||
    // Check if we're being served from localhost with a specific pattern that indicates Electron
    (typeof location !== 'undefined' && location.hostname === 'localhost' && isServedByElectron())
  );
}

/**
 * Additional check to see if we're being served by Electron's static server
 */
function isServedByElectron(): boolean {
  try {
    // Check if runtime-config.json is accessible (only available in Electron context)
    return typeof fetch !== 'undefined' && location.hostname === 'localhost';
  } catch {
    return false;
  }
}

/**
 * Check if the app is running in web browser
 */
export function isWebEnvironment(): boolean {
  return !isElectronEnvironment();
}

/**
 * Get runtime configuration
 */
export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  try {
    const response = await fetch('/runtime-config.json');
    if (!response.ok) {
      throw new Error('Failed to load runtime config');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to load runtime config, using defaults:', error);
    // If we're in Electron but can't load config, use Electron-specific defaults
    if (isElectronEnvironment()) {
      return {
        API_URL: 'http://localhost:9001',
        MODE: 'electron'
      };
    }
    return {
      API_URL: 'http://localhost:9001',
      MODE: 'development_frontend_only'
    };
  }
}

/**
 * Check if activity tracking is available in current environment
 */
export function isActivityTrackingAvailable(): boolean {
  return isElectronEnvironment();
}

/**
 * Check runtime config to determine environment
 */
export async function isElectronEnvironmentAsync(): Promise<boolean> {
  try {
    const config = await getRuntimeConfig();
    return config.MODE === 'electron' || config.ENVIRONMENT === 'desktop';
  } catch {
    return isElectronEnvironment();
  }
}

/**
 * Get environment-specific features
 */
export function getEnvironmentFeatures() {
  const isElectron = isElectronEnvironment();
  
  return {
    isElectron,
    isWeb: !isElectron,
    activityTracking: isElectron,
    screenCapture: isElectron,
    fileSystem: isElectron,
    notifications: isElectron,
    systemIntegration: isElectron,
    webOnlyFeatures: !isElectron
  };
}

/**
 * Get environment name for debugging
 */
export function getEnvironmentName(): string {
  return isElectronEnvironment() ? 'electron' : 'web';
}

/**
 * Check if IPC bridge is available (Electron only)
 */
export function isIPCBridgeAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any).api && typeof (window as any).api.invoke === 'function';
}

/**
 * Force environment detection refresh (useful for debugging)
 */
export function debugEnvironmentDetection() {
  const checks = {
    hasWindow: typeof window !== 'undefined',
    hasProcessType: typeof window !== 'undefined' && !!(window as any).process?.type,
    hasElectronAPI: typeof window !== 'undefined' && !!(window as any).electronAPI,
    hasAPI: typeof window !== 'undefined' && !!(window as any).api,
    hasRequire: typeof window !== 'undefined' && !!(window as any).require,
    userAgentElectron: typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron'),
    isLocalhost: typeof location !== 'undefined' && location.hostname === 'localhost',
    canFetchRuntimeConfig: typeof fetch !== 'undefined'
  };
  
  console.log('Environment Detection Debug:', {
    checks,
    isElectron: isElectronEnvironment(),
    isWeb: isWebEnvironment(),
    features: getEnvironmentFeatures()
  });
  
  return checks;
}