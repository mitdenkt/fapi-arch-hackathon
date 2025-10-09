import type { Tenant } from '../schemas';
import type { DataWriter, TenantData } from '../interfaces/data-writer.interface';

export class JsonWriterService implements DataWriter {
    private readonly outputDir = './json';

    async writeTenantData(tenantId: Tenant, data: TenantData): Promise<void> {
        const { customers, bookings } = data;

        // Write customers to file
        const customersPath = `${this.outputDir}/${tenantId.toLowerCase()}_customers.json`;
        await Bun.write(customersPath, JSON.stringify(customers, null, 2));
        console.log(`  ✓ Customers JSON saved to: ${customersPath}`);

        // Write bookings to file
        const bookingsPath = `${this.outputDir}/${tenantId.toLowerCase()}_bookings.json`;
        await Bun.write(bookingsPath, JSON.stringify(bookings, null, 2));
        console.log(`  ✓ Bookings JSON saved to: ${bookingsPath}`);
    }



    getFormatName(): string {
        return 'JSON';
    }
}