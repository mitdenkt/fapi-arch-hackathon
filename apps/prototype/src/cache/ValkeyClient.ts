import Redis from 'ioredis';

export class ValkeyClient {
    private static instance: Redis | null = null;
    private static isConnected = false;

    /**
     * Initialize the Valkey client connection
     */
    public static init(): void {
        if (this.instance) {
            return;
        }

        const host = process.env.VALKEY_HOST || 'localhost';
        const port = parseInt(process.env.VALKEY_PORT || '6379', 10);

        this.instance = new Redis({
            host,
            port,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
            connectTimeout: 10000,
            showFriendlyErrorStack: false,
        });

        // Handle connection events
        this.instance.on('ready', () => {
            this.isConnected = true;
        });

        this.instance.on('error', () => {
            this.isConnected = false;
        });

        this.instance.on('close', () => {
            this.isConnected = false;
        });
    }

    /**
     * Get the Valkey client instance
     */
    public static getClient(): Redis | null {
        return this.instance;
    }

    /**
     * Check if the client is connected
     */
    public static isClientConnected(): boolean {
        if (!this.instance) {
            return false;
        }
        
        const status = this.instance.status;
        const isActuallyConnected = status === 'ready';
        
        if (isActuallyConnected && !this.isConnected) {
            this.isConnected = true;
        }
        
        return isActuallyConnected;
    }

    /**
     * Get a cached value by key
     */
    public static async get<T>(key: string): Promise<T | null> {
        if (!this.isClientConnected() || !this.instance) {
            return null;
        }

        try {
            const value = await this.instance.get(key);
            if (!value) return null;
            
            return JSON.parse(value) as T;
        } catch (_error) {
            return null;
        }
    }

    /**
     * Set a cached value with optional TTL (in seconds)
     */
    public static async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        if (!this.isClientConnected() || !this.instance) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            
            if (ttlSeconds) {
                await this.instance.setex(key, ttlSeconds, serialized);
            } else {
                await this.instance.set(key, serialized);
            }
            
            return true;
        } catch (_error) {
            return false;
        }
    }

    /**
     * Delete a cached value by key
     */
    public static async del(key: string): Promise<boolean> {
        if (!this.isClientConnected() || !this.instance) {
            return false;
        }

        try {
            await this.instance.del(key);
            return true;
        } catch (_error) {
            return false;
        }
    }

    /**
     * Delete multiple cached values by pattern
     */
    public static async delPattern(pattern: string): Promise<number> {
        if (!this.isClientConnected() || !this.instance) {
            return 0;
        }

        try {
            const keys = await this.instance.keys(pattern);
            if (keys.length === 0) return 0;
            
            await this.instance.del(...keys);
            return keys.length;
        } catch (_error) {
            return 0;
        }
    }

    /**
     * Check if a key exists in cache
     */
    public static async exists(key: string): Promise<boolean> {
        if (!this.isClientConnected() || !this.instance) {
            return false;
        }

        try {
            const result = await this.instance.exists(key);
            return result === 1;
        } catch (_error) {
            return false;
        }
    }

    /**
     * Get cache statistics
     */
    public static async getStats(): Promise<{ hits: number; misses: number } | null> {
        if (!this.isClientConnected() || !this.instance) {
            return null;
        }

        try {
            const info = await this.instance.info('stats');
            const hitsMatch = info.match(/keyspace_hits:(\d+)/);
            const missesMatch = info.match(/keyspace_misses:(\d+)/);
            
            return {
                hits: hitsMatch ? parseInt(hitsMatch[1], 10) : 0,
                misses: missesMatch ? parseInt(missesMatch[1], 10) : 0,
            };
        } catch (_error) {
            return null;
        }
    }

    /**
     * Close the Valkey connection
     */
    public static async close(): Promise<void> {
        if (this.instance) {
            await this.instance.quit();
            this.instance = null;
            this.isConnected = false;
        }
    }

    /**
     * Test the connection by sending a PING command
     */
    public static async testConnection(): Promise<boolean> {
        if (!this.instance) {
            return false;
        }

        try {
            const result = await this.instance.ping();
            return result === 'PONG';
        } catch (_error) {
            return false;
        }
    }
}

