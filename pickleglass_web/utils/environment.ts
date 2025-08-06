/**
 * Environment detection utilities for Pickle Glass
 * Helps distinguish between Electron desktop app and web browser
 */

export interface RuntimeConfig {
  API_URL: string;
  MODE: string;
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
    (window as any).require ||
    (typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron'))
  );
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