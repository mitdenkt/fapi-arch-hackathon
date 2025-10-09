export interface Customer {
    id: string;
    tenantId: string;
    name: string;
    email: string;
    phone: string;
    createdAt: string;
    updatedAt: string;
}

export interface Booking {
    id: string;
    date: string;
    tenantId: string;
    customerId: string;
    title: string;
    description: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    price: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export const TENANTS = ['APPA', 'APPB', 'APPC'] as const;
export type Tenant = typeof TENANTS[number];

export const TENANT_CONFIG = {
    APPA: { customers: 3000, bookings: 9000 },
    APPB: { customers: 6000, bookings: 18000 },
    APPC: { customers: 12000, bookings: 36000 }
} as const;