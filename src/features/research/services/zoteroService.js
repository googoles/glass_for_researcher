const settingsService = require('../../settings/settingsService');

/**
 * ZoteroService handles integration with Zotero API
 * for academic paper management and research tracking
 */
class ZoteroService {
  constructor() {
    this.apiKey = null;
    this.userId = null;
    this.baseUrl = 'https://api.zotero.org';
    this.apiVersion = '3';
    this.isConnected = false;
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async initialize() {
    console.log('[Zotero Service] Initializing...');
    
    try {
      // Load credentials from settings
      await this.loadCredentials();
      
      if (this.apiKey && this.userId) {
        // Test connection
        const isValid = await this.testConnection();
        if (isValid) {
          this.isConnected = true;
          console.log('[Zotero Service] Connected successfully');
        } else {
          console.warn('[Zotero Service] Invalid credentials');
        }
      } else {
        console.log('[Zotero Service] No credentials found, Zotero integration disabled');
      }

      // Setup cache cleanup
      setInterval(() => this.cleanupCache(), 60000); // Clean every minute
      
    } catch (error) {
      console.error('[Zotero Service] Initialization failed:', error);
    }
  }

  /**
   * Load Zotero credentials from settings
   * @private
   */
  async loadCredentials() {
    try {
      const settings = await settingsService.getSettings();
      const zoteroSettings = settings.zotero || {};
      
      this.apiKey = zoteroSettings.apiKey;
      this.userId = zoteroSettings.userId;
      
      return { apiKey: this.apiKey, userId: this.userId };
    } catch (error) {
      console.error('[Zotero Service] Failed to load credentials:', error);
      return { apiKey: null, userId: null };
    }
  }

  /**
   * Test connection to Zotero API
   * @private
   */
  async testConnection() {
    if (!this.apiKey || !this.userId) {
      return false;
    }

    try {
      const response = await this.makeRequest(`/users/${this.userId}/items?limit=1`);
      return response.ok;
    } catch (error) {
      console.error('[Zotero Service] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Update credentials and reconnect
   * @param {string} apiKey - Zotero API key
   * @param {string} userId - Zotero user ID
   * @returns {Promise<boolean>} Success status
   */
  async updateCredentials(apiKey, userId) {
    try {
      this.apiKey = apiKey;
      this.userId = userId;
      
      // Test new credentials
      const isValid = await this.testConnection();
      
      if (isValid) {
        // Save to settings
        const settings = await settingsService.getSettings();
        await settingsService.updateSettings({
          ...settings,
          zotero: {
            apiKey,
            userId,
            connectedAt: new Date().toISOString()
          }
        });
        
        this.isConnected = true;
        
        // Clear cache since credentials changed
        this.cache.clear();
        
        console.log('[Zotero Service] Credentials updated successfully');
        return true;
      } else {
        console.error('[Zotero Service] Invalid credentials provided');
        return false;
      }
    } catch (error) {
      console.error('[Zotero Service] Failed to update credentials:', error);
      return false;
    }
  }

  /**
   * Make authenticated request to Zotero API
   * @private
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isConnected) {
      throw new Error('Zotero not connected');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Zotero-API-Key': this.apiKey,
      'Zotero-API-Version': this.apiVersion,
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`Zotero API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.error(`[Zotero Service] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get papers from Zotero library
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of Zotero items
   */
  async getPapers(options = {}) {
    const {
      limit = 50,
      start = 0,
      itemType = 'journalArticle',
      sort = 'dateModified',
      direction = 'desc',
      tag = null,
      q = null // Search query
    } = options;

    const cacheKey = `papers:${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let endpoint = `/users/${this.userId}/items?limit=${limit}&start=${start}&sort=${sort}&direction=${direction}`;
      
      if (itemType) {
        endpoint += `&itemType=${itemType}`;
      }
      
      if (tag) {
        endpoint += `&tag=${encodeURIComponent(tag)}`;
      }
      
      if (q) {
        endpoint += `&q=${encodeURIComponent(q)}`;
      }

      const response = await this.makeRequest(endpoint);
      const data = await response.json();
      
      const papers = data.map(item => this.formatZoteroItem(item));
      
      // Cache the results
      this.setCache(cacheKey, papers);
      
      return papers;
    } catch (error) {
      console.error('[Zotero Service] Failed to get papers:', error);
      return [];
    }
  }

  /**
   * Get specific paper by key
   * @param {string} key - Zotero item key
   * @returns {Promise<Object|null>} Zotero item or null
   */
  async getPaperByKey(key) {
    const cacheKey = `paper:${key}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/users/${this.userId}/items/${key}`);
      const data = await response.json();
      
      const paper = this.formatZoteroItem(data);
      
      // Cache the result
      this.setCache(cacheKey, paper);
      
      return paper;
    } catch (error) {
      console.error(`[Zotero Service] Failed to get paper ${key}:`, error);
      return null;
    }
  }

  /**
   * Find paper by title (fuzzy matching)
   * @param {string} title - Paper title to search for
   * @returns {Promise<Object|null>} Best matching paper or null
   */
  async findPaperByTitle(title) {
    if (!title || title.length < 10) {
      return null;
    }

    try {
      // First try exact search
      const exactMatch = await this.getPapers({
        q: `"${title}"`,
        limit: 5
      });

      if (exactMatch.length > 0) {
        return exactMatch[0];
      }

      // Try fuzzy search with key terms
      const titleWords = title.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 5); // Use first 5 significant words

      if (titleWords.length > 0) {
        const fuzzyMatch = await this.getPapers({
          q: titleWords.join(' '),
          limit: 10
        });

        // Find best match using similarity scoring
        const bestMatch = this.findBestTitleMatch(title, fuzzyMatch);
        return bestMatch;
      }

      return null;
    } catch (error) {
      console.error('[Zotero Service] Failed to find paper by title:', error);
      return null;
    }
  }

  /**
   * Get paper attachments (PDFs, etc.)
   * @param {string} key - Zotero item key
   * @returns {Promise<Array>} Array of attachments
   */
  async getPaperAttachments(key) {
    const cacheKey = `attachments:${key}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/users/${this.userId}/items/${key}/children`);
      const data = await response.json();
      
      const attachments = data
        .filter(item => item.data.itemType === 'attachment')
        .map(item => ({
          key: item.key,
          title: item.data.title,
          filename: item.data.filename,
          contentType: item.data.contentType,
          url: item.data.url,
          dateAdded: item.data.dateAdded,
          dateModified: item.data.dateModified
        }));
      
      // Cache the results
      this.setCache(cacheKey, attachments);
      
      return attachments;
    } catch (error) {
      console.error(`[Zotero Service] Failed to get attachments for ${key}:`, error);
      return [];
    }
  }

  /**
   * Get collections (folders) from Zotero
   * @returns {Promise<Array>} Array of collections
   */
  async getCollections() {
    const cacheKey = 'collections';
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(`/users/${this.userId}/collections`);
      const data = await response.json();
      
      const collections = data.map(item => ({
        key: item.key,
        name: item.data.name,
        parentCollection: item.data.parentCollection,
        relations: item.data.relations
      }));
      
      // Cache the results
      this.setCache(cacheKey, collections, 600000); // Cache for 10 minutes
      
      return collections;
    } catch (error) {
      console.error('[Zotero Service] Failed to get collections:', error);
      return [];
    }
  }

  /**
   * Get papers from specific collection
   * @param {string} collectionKey - Collection key
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of papers in collection
   */
  async getCollectionPapers(collectionKey, options = {}) {
    const { limit = 50, start = 0 } = options;
    
    const cacheKey = `collection:${collectionKey}:${limit}:${start}`;
    
    // Check cache first
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.makeRequest(
        `/users/${this.userId}/collections/${collectionKey}/items?limit=${limit}&start=${start}`
      );
      const data = await response.json();
      
      const papers = data.map(item => this.formatZoteroItem(item));
      
      // Cache the results
      this.setCache(cacheKey, papers);
      
      return papers;
    } catch (error) {
      console.error(`[Zotero Service] Failed to get collection papers for ${collectionKey}:`, error);
      return [];
    }
  }

  /**
   * Format Zotero item for consistent usage
   * @private
   */
  formatZoteroItem(item) {
    return {
      key: item.key,
      version: item.version,
      title: item.data.title || 'Untitled',
      creators: item.data.creators || [],
      abstractNote: item.data.abstractNote || '',
      date: item.data.date || '',
      dateAdded: item.data.dateAdded,
      dateModified: item.data.dateModified,
      itemType: item.data.itemType,
      publicationTitle: item.data.publicationTitle || '',
      DOI: item.data.DOI || '',
      url: item.data.url || '',
      tags: (item.data.tags || []).map(tag => tag.tag),
      collections: item.data.collections || [],
      relations: item.data.relations || {},
      extra: item.data.extra || '',
      // Computed fields
      authorNames: (item.data.creators || [])
        .filter(c => c.creatorType === 'author')
        .map(c => `${c.firstName || ''} ${c.lastName || ''}`.trim()),
      year: this.extractYear(item.data.date),
      formattedCitation: this.formatCitation(item.data)
    };
  }

  /**
   * Extract year from date string
   * @private
   */
  extractYear(dateString) {
    if (!dateString) return null;
    const match = dateString.match(/\d{4}/);
    return match ? parseInt(match[0]) : null;
  }

  /**
   * Format basic citation
   * @private
   */
  formatCitation(data) {
    const authors = (data.creators || [])
      .filter(c => c.creatorType === 'author')
      .map(c => c.lastName || c.name)
      .slice(0, 3);
    
    const authorString = authors.length === 0 ? 'Unknown' :
      authors.length === 1 ? authors[0] :
      authors.length === 2 ? authors.join(' & ') :
      `${authors[0]} et al.`;
    
    const year = this.extractYear(data.date) || 'n.d.';
    const title = data.title || 'Untitled';
    
    return `${authorString} (${year}). ${title}`;
  }

  /**
   * Find best title match using similarity scoring
   * @private
   */
  findBestTitleMatch(targetTitle, papers) {
    if (!papers || papers.length === 0) {
      return null;
    }

    let bestMatch = null;
    let bestScore = 0;

    papers.forEach(paper => {
      const score = this.calculateTitleSimilarity(targetTitle, paper.title);
      if (score > bestScore && score > 0.6) { // Minimum 60% similarity
        bestScore = score;
        bestMatch = paper;
      }
    });

    return bestMatch;
  }

  /**
   * Calculate title similarity using simple string matching
   * @private
   */
  calculateTitleSimilarity(title1, title2) {
    if (!title1 || !title2) return 0;

    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const norm1 = normalize(title1);
    const norm2 = normalize(title2);

    if (norm1 === norm2) return 1;

    const words1 = new Set(norm1.split(/\s+/));
    const words2 = new Set(norm2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Cache management methods
   * @private
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data, timeout = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      timeout: timeout || this.cacheTimeout
    });
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > (value.timeout || this.cacheTimeout)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status and info
   */
  getStatus() {
    return {
      connected: this.isConnected,
      hasCredentials: !!(this.apiKey && this.userId),
      userId: this.userId,
      cacheSize: this.cache.size
    };
  }

  /**
   * Disconnect from Zotero
   * @returns {Promise<void>}
   */
  async disconnect() {
    try {
      // Clear credentials from settings
      const settings = await settingsService.getSettings();
      delete settings.zotero;
      await settingsService.updateSettings(settings);
      
      // Reset state
      this.apiKey = null;
      this.userId = null;
      this.isConnected = false;
      this.cache.clear();
      
      console.log('[Zotero Service] Disconnected');
    } catch (error) {
      console.error('[Zotero Service] Failed to disconnect:', error);
    }
  }
}

module.exports = ZoteroService;