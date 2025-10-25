import { randomUUID } from "crypto"
import { Booking, BookingCandidate } from "../types"
import { CacheHandler } from "./CacheHandler"
import { db } from '../index'
import { booking, customer } from '@db/schema'
import { and, gte, lte, eq } from 'drizzle-orm'
import { ValkeyClient } from '@cache/ValkeyClient'
import crypto from 'crypto'

interface BookingQueryResult {
    count: number
    start: string
    end: string
    bookings: any[]
    fetchTimeMs: number
    cached?: boolean
    cacheKey?: string
}

const appid = process.env.APP ?? 'appa'

export class BookingHandler {
    // Default TTL for booking queries (5 minutes)
    private static readonly DEFAULT_TTL_SECONDS = 300

    /**
     * Generate a deterministic cache key for a date range query
     */
    private static generateCacheKey(start: Date, end: Date): string {
        const startStr = start.toISOString()
        const endStr = end.toISOString()
        const hash = crypto
            .createHash('md5')
            .update(`${startStr}:${endStr}`)
            .digest('hex')
        return `bookings:range:${hash}`
    }

    /**
     * Query bookings within a date range with cache-aside pattern
     */
    static async queryRange(start: Date, end: Date): Promise<BookingQueryResult> {
        const cacheKey = this.generateCacheKey(start, end)
        const fetchStart = performance.now()
        
        // Try to get from cache first
        const cachedResult = await ValkeyClient.get<BookingQueryResult>(cacheKey)
        
        if (cachedResult) {
            const fetchEnd = performance.now()
            const fetchTimeMs = parseFloat((fetchEnd - fetchStart).toFixed(2))
            
            return {
                ...cachedResult,
                fetchTimeMs,
                cached: true,
                cacheKey,
            }
        }
        
        const dbQueryStart = performance.now()
        
        // Query bookings within the date range with their associated customers
        const bookingsWithCustomers = await db
            .select()
            .from(booking)
            .leftJoin(customer, eq(booking.customerId, customer.id))
            .where(
                and(
                    gte(booking.date, start),
                    lte(booking.date, end)
                )
            )
        
        const dbQueryEnd = performance.now()
        const dbQueryTimeMs = (dbQueryEnd - dbQueryStart).toFixed(2)
        
        // Transform the results to match the expected format
        const formattedBookings = bookingsWithCustomers.map(row => ({
            ...row.booking,
            customer: row.customer
        }))

        const result: BookingQueryResult = {
            count: formattedBookings.length,
            start: start.toISOString(),
            end: end.toISOString(),
            bookings: formattedBookings,
            fetchTimeMs: parseFloat(dbQueryTimeMs),
            cached: false,
            cacheKey,
        }

        // Store in cache asynchronously (don't wait for it)
        ValkeyClient.set(cacheKey, result, this.DEFAULT_TTL_SECONDS).catch(() => {})

        return result
    }

    static async addBooking(booking: BookingCandidate): Promise<Booking> {
        const id = randomUUID()

        return CacheHandler.addBooking({ ...booking, id, tenantId: appid })
    }

    /**
     * Invalidate cache for a specific date range
     */
    static async invalidateCache(start: Date, end: Date): Promise<boolean> {
        const cacheKey = this.generateCacheKey(start, end)
        return await ValkeyClient.del(cacheKey)
    }

    /**
     * Invalidate all booking caches
     */
    static async invalidateAllCaches(): Promise<number> {
        return await ValkeyClient.delPattern('bookings:range:*')
    }
}