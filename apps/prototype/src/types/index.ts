import z from "zod"

export interface RouteConfig {
    required: {
        auth: boolean
        series: boolean
    }
}

export interface User {
    id: string | number
    name: string
}

export interface CreateUserRequest {
    name: string
}

export interface UpdateUserRequest {
    name: string
}

export const Z_Customer = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type Customer = z.infer<typeof Z_Customer>

export const Z_Booking = z.object({
    id: z.string(),
    tenantId: z.string(),
    customerId: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    status: z.literal(['pending', 'confirmed', 'cancelled', 'completed']),
    price: z.number(),
    currency: z.literal("EUR"),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type Booking = z.infer<typeof Z_Booking>

export const Z_BookingCandidate = z.object({
    customerId: z.string(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    status: z.literal(['pending', 'confirmed', 'cancelled', 'completed']),
    price: z.number(),
    currency: z.literal("EUR"),
    createdAt: z.string(),
    updatedAt: z.string(),
})
export type BookingCandidate = z.infer<typeof Z_BookingCandidate>
