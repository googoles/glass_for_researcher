/**
 * Secure Credentials Service
 * Handles secure storage of sensitive credentials using Electron's safeStorage
 */

const { safeStorage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

class SecureCredentialsService {
  constructor() {
    this.credentialsDir = path.join(os.homedir(), '.pickleglass', 'credentials');
    this.ensureCredentialsDir();
  }

  async ensureCredentialsDir() {
    try {
      await fs.mkdir(this.credentialsDir, { recursive: true });
    } catch (error) {
      console.error('[SecureCredentialsService] Failed to create credentials directory:', error);
    }
  }

  /**
   * Store encrypted credentials
   * @param {string} service - Service name (e.g., 'zotero')
   * @param {string} userId - User identifier
   * @param {Object} credentials - Credentials object to encrypt
   */
  async storeCredentials(service, userId, credentials) {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this system');
      }

      const credentialsJson = JSON.stringify(credentials);
      const encryptedBuffer = safeStorage.encryptString(credentialsJson);
      
      const filePath = path.join(this.credentialsDir, `${service}_${userId}.enc`);
      await fs.writeFile(filePath, encryptedBuffer);
      
      console.log(`[SecureCredentialsService] Stored encrypted credentials for ${service}:${userId}`);
      return { success: true };
    } catch (error) {
      console.error('[SecureCredentialsService] Failed to store credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve and decrypt credentials
   * @param {string} service - Service name
   * @param {string} userId - User identifier
   */
  async getCredentials(service, userId) {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption not available on this system');
      }

      const filePath = path.join(this.credentialsDir, `${service}_${userId}.enc`);
      
      try {
        const encryptedBuffer = await fs.readFile(filePath);
        const decryptedString = safeStorage.decryptString(encryptedBuffer);
        const credentials = JSON.parse(decryptedString);
        
        return { success: true, credentials };
      } catch (error) {
        if (error.code === 'ENOENT') {
          return { success: false, error: 'No credentials found' };
        }
        throw error;
      }
    } catch (error) {
      console.error('[SecureCredentialsService] Failed to retrieve credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove stored credentials
   * @param {string} service - Service name
   * @param {string} userId - User identifier
   */
  async removeCredentials(service, userId) {
    try {
      const filePath = path.join(this.credentialsDir, `${service}_${userId}.enc`);
      await fs.unlink(filePath);
      
      console.log(`[SecureCredentialsService] Removed credentials for ${service}:${userId}`);
      return { success: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { success: true }; // Already doesn't exist
      }
      console.error('[SecureCredentialsService] Failed to remove credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all stored credential services for a user
   * @param {string} userId - User identifier
   */
  async listUserCredentials(userId) {
    try {
      const files = await fs.readdir(this.credentialsDir);
      const userCredentials = files
        .filter(file => file.endsWith(`_${userId}.enc`))
        .map(file => file.replace(`_${userId}.enc`, ''));
      
      return { success: true, services: userCredentials };
    } catch (error) {
      console.error('[SecureCredentialsService] Failed to list credentials:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store Zotero credentials specifically
   * @param {string} userId - Current user ID
   * @param {string} apiKey - Zotero API key
   * @param {string} zoteroUserId - Zotero user ID
   */
  async storeZoteroCredentials(userId, apiKey, zoteroUserId) {
    const credentials = {
      apiKey,
      zoteroUserId,
      timestamp: Date.now()
    };
    
    return await this.storeCredentials('zotero', userId, credentials);
  }

  /**
   * Get Zotero credentials specifically
   * @param {string} userId - Current user ID
   */
  async getZoteroCredentials(userId) {
    return await this.getCredentials('zotero', userId);
  }

  /**
   * Remove Zotero credentials specifically
   * @param {string} userId - Current user ID
   */
  async removeZoteroCredentials(userId) {
    return await this.removeCredentials('zotero', userId);
  }
}

// Export singleton instance
const secureCredentialsService = new SecureCredentialsService();
module.exports = secureCredentialsService;