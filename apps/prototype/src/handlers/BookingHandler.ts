import { randomUUID } from "crypto"
import { Booking, BookingCandidate } from "src/types"
import { CacheHandler } from "./CacheHandler"

const appid = process.env.APP ?? 'appa'

export class BookingHandler {
    static async queryRange(start: Date, end: Date) {

        const bookings = Array.from(CacheHandler.getBookings().values())

        const filteredBookings = bookings.filter(
            b => new Date(b.date).getTime() >= start.getTime() &&
                new Date(b.date).getTime() <= end.getTime()
        )

        return {
            count: filteredBookings.length,
            start: start.toISOString(),
            end: end.toISOString(),
            bookings: filteredBookings.map(b => ({
                ...b,
                customer: CacheHandler.getCustomers().get(b.customerId)
            })),
        }
    }

    static async addBooking(booking: BookingCandidate): Promise<Booking> {
        const id = randomUUID()
        console.log('jetzt neues booking')

        return CacheHandler.addBooking({ ...booking, id, tenantId: appid })
    }
}