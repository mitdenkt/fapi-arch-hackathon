import type { Customer, Booking, Tenant } from '../schemas';

export interface TenantData {
    customers: Customer[];
    bookings: Booking[];
}

export interface DataWriter {
    /**
     * Write tenant data to storage
     */
    writeTenantData(tenantId: Tenant, data: TenantData): Promise<void>;

    /**
     * Perform any post-processing after all tenants are written
     */
    finalize?(): Promise<void>;

    /**
     * Get the output format name
     */
    getFormatName(): string;
}