/**
 * Tile Cache Service
 * Uses IndexedDB to cache map tiles for offline use
 * 
 * This service is designed to be embedded in the WebView's HTML
 * and provides methods for storing and retrieving tiles locally.
 */

// Configuration for the tile cache
export const TILE_CACHE_CONFIG = {
  // Database name for IndexedDB
  dbName: 'SemanaSantaTileCache',
  dbVersion: 1,
  storeName: 'tiles',
  
  // Huelva city bounds for pre-loading
  huelvaBounds: {
    north: 37.28,
    south: 37.24,
    east: -6.92,
    west: -6.97,
  },
  
  // Zoom levels to cache
  zoomLevels: [14, 15, 16, 17, 18],
  
  // Fast CDN URL (CartoDB via Fastly - much faster in Europe)
  cdnUrl: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png',
  
  // Fallback to original OSM
  fallbackUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  
  // Subdomains for load balancing
  subdomains: ['a', 'b', 'c', 'd'],
};

/**
 * Generates the JavaScript code for the tile cache to be embedded in the WebView
 * This code runs inside the Leaflet map's HTML context
 */
export function generateTileCacheJS(): string {
  return `
    // ============================================
    // Tile Cache Implementation for IndexedDB
    // ============================================
    
    const TileCache = {
      db: null,
      dbName: '${TILE_CACHE_CONFIG.dbName}',
      storeName: '${TILE_CACHE_CONFIG.storeName}',
      
      // Initialize IndexedDB
      async init() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, 1);
          
          request.onerror = () => reject(request.error);
          
          request.onsuccess = () => {
            this.db = request.result;
            console.log('[TileCache] IndexedDB initialized');
            resolve(this.db);
          };
          
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
              db.createObjectStore(this.storeName);
              console.log('[TileCache] Object store created');
            }
          };
        });
      },
      
      // Generate cache key for a tile
      getKey(z, x, y) {
        return z + '/' + x + '/' + y;
      },
      
      // Get tile from cache
      async getTile(z, x, y) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const request = store.get(this.getKey(z, x, y));
          
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      },
      
      // Save tile to cache
      async saveTile(z, x, y, blob) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.put(blob, this.getKey(z, x, y));
          
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      },
      
      // Check if tile is cached
      async hasTile(z, x, y) {
        const tile = await this.getTile(z, x, y);
        return tile !== undefined;
      },
      
      // Get cache statistics
      async getStats() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readonly');
          const store = transaction.objectStore(this.storeName);
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve({ tileCount: countRequest.result });
          };
          countRequest.onerror = () => reject(countRequest.error);
        });
      },
      
      // Clear all cached tiles
      async clear() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction([this.storeName], 'readwrite');
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();
          
          request.onsuccess = () => {
            console.log('[TileCache] Cache cleared');
            resolve();
          };
          request.onerror = () => reject(request.error);
        });
      }
    };
    
    // ============================================
    // Custom Tile Layer with Caching
    // ============================================
    
    L.TileLayer.Cached = L.TileLayer.extend({
      _loadTile: function(tile, coords) {
        const self = this;
        const key = coords.z + '/' + coords.x + '/' + coords.y;
        
        // Try to get from cache first
        TileCache.getTile(coords.z, coords.x, coords.y)
          .then(cachedBlob => {
            if (cachedBlob) {
              // Cache hit - use cached tile
              const url = URL.createObjectURL(cachedBlob);
              tile.src = url;
              tile.onload = function() {
                URL.revokeObjectURL(url);
                self._tileOnLoad.call(self, null, tile);
              };
              tile.onerror = function() {
                URL.revokeObjectURL(url);
                self._fetchAndCacheTile(tile, coords);
              };
            } else {
              // Cache miss - fetch from network
              self._fetchAndCacheTile(tile, coords);
            }
          })
          .catch(() => {
            // IndexedDB error - fetch directly
            self._fetchAndCacheTile(tile, coords);
          });
      },
      
      _fetchAndCacheTile: function(tile, coords) {
        const self = this;
        const url = this.getTileUrl(coords);
        
        fetch(url)
          .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.blob();
          })
          .then(blob => {
            // Save to cache
            TileCache.saveTile(coords.z, coords.x, coords.y, blob)
              .catch(err => console.warn('[TileCache] Failed to cache tile:', err));
            
            // Display tile
            const objectUrl = URL.createObjectURL(blob);
            tile.src = objectUrl;
            tile.onload = function() {
              URL.revokeObjectURL(objectUrl);
              self._tileOnLoad.call(self, null, tile);
            };
          })
          .catch(err => {
            console.warn('[TileCache] Failed to fetch tile:', err);
            self._tileOnError.call(self, err, tile, coords);
          });
      },
      
      createTile: function(coords, done) {
        const tile = document.createElement('img');
        tile.alt = '';
        tile.setAttribute('role', 'presentation');
        
        tile.onload = L.bind(this._tileOnLoad, this, done, tile);
        tile.onerror = L.bind(this._tileOnError, this, done, tile);
        
        if (this.options.crossOrigin || this.options.crossOrigin === '') {
          tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
        }
        
        this._loadTile(tile, coords);
        
        return tile;
      }
    });
    
    L.tileLayer.cached = function(url, options) {
      return new L.TileLayer.Cached(url, options);
    };
    
    // Initialize cache on load
    TileCache.init().then(() => {
      console.log('[TileCache] Ready');
    });
  `;
}

/**
 * Calculate tile coordinates for a given lat/lng and zoom level
 */
export function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const y = Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y };
}

/**
 * Calculate all tiles needed for a bounding box at given zoom levels
 */
export function getTilesForBounds(
  bounds: { north: number; south: number; east: number; west: number },
  zoomLevels: number[]
): Array<{ z: number; x: number; y: number }> {
  const tiles: Array<{ z: number; x: number; y: number }> = [];

  for (const z of zoomLevels) {
    const topLeft = latLngToTile(bounds.north, bounds.west, z);
    const bottomRight = latLngToTile(bounds.south, bounds.east, z);

    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        tiles.push({ z, x, y });
      }
    }
  }

  return tiles;
}

/**
 * Get all tiles needed for Huelva city center
 */
export function getHuelvaTiles(): Array<{ z: number; x: number; y: number }> {
  return getTilesForBounds(TILE_CACHE_CONFIG.huelvaBounds, TILE_CACHE_CONFIG.zoomLevels);
}
