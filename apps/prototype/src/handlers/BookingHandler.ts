import { randomUUID } from "crypto"
import { Booking, BookingCandidate } from "../types"
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
                    lte(booking.date, end),
                    eq(booking.tenantId, appid)
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

    static async addBooking(bookingData: BookingCandidate): Promise<Booking> {
        const id = randomUUID()
        const now = new Date()
        
        // Validate that the customer exists
        const existingCustomer = await db
            .select()
            .from(customer)
            .where(and(
                eq(customer.id, bookingData.customerId),
                eq(customer.tenantId, appid)
            ))
            .limit(1)
        
        if (existingCustomer.length === 0) {
            throw new Error(`Customer with ID ${bookingData.customerId} not found for tenant ${appid}`)
        }
        
        // Create the booking data for database insertion
        const newBooking = {
            id,
            tenantId: appid,
            customerId: bookingData.customerId,
            title: bookingData.title,
            description: bookingData.description || '',
            date: new Date(bookingData.date),
            status: bookingData.status,
            price: bookingData.price,
            currency: bookingData.currency,
            createdAt: now,
            updatedAt: now,
        }
        
        // Insert the booking into the database
        const insertedBookings = await db
            .insert(booking)
            .values(newBooking)
            .returning()
        
        if (insertedBookings.length === 0) {
            throw new Error('Failed to create booking')
        }
        
        const createdBooking = insertedBookings[0]
        
        // Convert to the expected format (with string dates)
        const formattedBooking: Booking = {
            ...createdBooking,
            description: createdBooking.description || '',
            status: createdBooking.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
            currency: createdBooking.currency as 'EUR',
            date: createdBooking.date.toISOString(),
            createdAt: createdBooking.createdAt.toISOString(),
            updatedAt: createdBooking.updatedAt.toISOString(),
        }
        
        // Invalidate relevant caches since we added a new booking
        // We'll invalidate caches for the date range around the booking date
        const bookingDate = new Date(bookingData.date)
        const startOfDay = new Date(bookingDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(bookingDate)
        endOfDay.setHours(23, 59, 59, 999)
        
        // Invalidate cache asynchronously (don't wait for it)
        this.invalidateCache(startOfDay, endOfDay).catch(() => {})
        
        return formattedBooking
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