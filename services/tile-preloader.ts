/**
 * Tile Preloader Service
 * Pre-downloads map tiles for Huelva to enable offline use
 */

import { TILE_CACHE_CONFIG, getHuelvaTiles } from './tile-cache';

export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  percentage: number;
  isComplete: boolean;
}

export type ProgressCallback = (progress: PreloadProgress) => void;

/**
 * Generates the JavaScript code for the tile preloader to be embedded in the WebView
 */
export function generateTilePreloaderJS(): string {
  const tiles = getHuelvaTiles();
  const tilesJSON = JSON.stringify(tiles);
  
  return `
    // ============================================
    // Tile Preloader for Huelva
    // ============================================
    
    const TilePreloader = {
      tiles: ${tilesJSON},
      cdnUrl: '${TILE_CACHE_CONFIG.cdnUrl}',
      subdomains: ${JSON.stringify(TILE_CACHE_CONFIG.subdomains)},
      isPreloading: false,
      progress: {
        total: ${tiles.length},
        loaded: 0,
        failed: 0,
        percentage: 0,
        isComplete: false
      },
      
      // Get tile URL
      getTileUrl(z, x, y) {
        const subdomain = this.subdomains[Math.abs(x + y) % this.subdomains.length];
        return this.cdnUrl
          .replace('{s}', subdomain)
          .replace('{z}', z)
          .replace('{x}', x)
          .replace('{y}', y);
      },
      
      // Update progress
      updateProgress() {
        this.progress.percentage = Math.round(
          ((this.progress.loaded + this.progress.failed) / this.progress.total) * 100
        );
        this.progress.isComplete = 
          (this.progress.loaded + this.progress.failed) >= this.progress.total;
        
        // Dispatch custom event for React Native to catch
        window.dispatchEvent(new CustomEvent('tilePreloadProgress', {
          detail: this.progress
        }));
        
        // Also post message for WebView communication
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'preloadProgress',
            progress: this.progress
          }));
        }
      },
      
      // Preload a single tile
      async preloadTile(tile) {
        const { z, x, y } = tile;
        
        // Check if already cached
        try {
          const cached = await TileCache.getTile(z, x, y);
          if (cached) {
            this.progress.loaded++;
            this.updateProgress();
            return true;
          }
        } catch (e) {
          // Continue to fetch
        }
        
        // Fetch and cache
        try {
          const url = this.getTileUrl(z, x, y);
          const response = await fetch(url);
          
          if (!response.ok) throw new Error('Network error');
          
          const blob = await response.blob();
          await TileCache.saveTile(z, x, y, blob);
          
          this.progress.loaded++;
          this.updateProgress();
          return true;
        } catch (error) {
          console.warn('[Preloader] Failed to preload tile ' + z + '/' + x + '/' + y, error);
          this.progress.failed++;
          this.updateProgress();
          return false;
        }
      },
      
      // Preload all tiles with concurrency control
      async preloadAll(concurrency = 4) {
        if (this.isPreloading) {
          console.log('[Preloader] Already preloading');
          return;
        }
        
        this.isPreloading = true;
        console.log('[Preloader] Starting preload of ' + this.tiles.length + ' tiles');
        
        // Reset progress
        this.progress = {
          total: this.tiles.length,
          loaded: 0,
          failed: 0,
          percentage: 0,
          isComplete: false
        };
        this.updateProgress();
        
        // Process tiles in batches for controlled concurrency
        const tiles = [...this.tiles];
        
        const processBatch = async () => {
          const batch = [];
          for (let i = 0; i < concurrency && tiles.length > 0; i++) {
            batch.push(tiles.shift());
          }
          
          await Promise.all(batch.map(tile => this.preloadTile(tile)));
          
          if (tiles.length > 0) {
            // Small delay to prevent overwhelming the network
            await new Promise(resolve => setTimeout(resolve, 50));
            return processBatch();
          }
        };
        
        await processBatch();
        
        this.isPreloading = false;
        console.log('[Preloader] Preload complete:', this.progress);
        
        return this.progress;
      },
      
      // Check how many tiles are already cached
      async checkCachedCount() {
        let cached = 0;
        
        for (const tile of this.tiles) {
          try {
            const exists = await TileCache.hasTile(tile.z, tile.x, tile.y);
            if (exists) cached++;
          } catch (e) {
            // Ignore errors
          }
        }
        
        return {
          total: this.tiles.length,
          cached: cached,
          percentage: Math.round((cached / this.tiles.length) * 100)
        };
      }
    };
    
    // Expose to window for debugging
    window.TilePreloader = TilePreloader;
  `;
}

/**
 * Get the count of tiles that will be preloaded for Huelva
 */
export function getHuelvaTileCount(): number {
  return getHuelvaTiles().length;
}

/**
 * Estimate the size of tiles to download (rough estimate: ~25KB per tile)
 */
export function estimateDownloadSize(): string {
  const count = getHuelvaTileCount();
  const sizeKB = count * 25;
  
  if (sizeKB < 1024) {
    return `${sizeKB} KB`;
  }
  return `${(sizeKB / 1024).toFixed(1)} MB`;
}
