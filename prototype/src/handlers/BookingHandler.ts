export class BookingHandler {
    static async queryRange(start: Date, end: Date) {
        return {
            bookings: [],
            start: start.toISOString(),
            end: end.toISOString()
        }
    }
}