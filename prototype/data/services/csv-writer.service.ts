import type { Customer, Booking, Tenant } from '../schemas';
import type { DataWriter, TenantData } from '../interfaces/data-writer.interface';

export class CsvWriterService implements DataWriter {
    private readonly outputDir = './csv';

    private escapeCsvField(field: string | number): string {
        const str = String(field);
        // If field contains comma, quote, or newline, wrap in quotes and escape quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }

    private formatTimestamp(isoString: string): string {
        return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
    }

    private generateCustomerCsv(customers: Customer[]): string {
        const headers = ['id', 'tenant_id', 'name', 'email', 'phone', 'created_at', 'updated_at'];
        const csvLines = [headers.join(',')];

        for (const customer of customers) {
            const row = [
                this.escapeCsvField(customer.id),
                this.escapeCsvField(customer.tenantId),
                this.escapeCsvField(customer.name),
                this.escapeCsvField(customer.email),
                this.escapeCsvField(customer.phone),
                this.escapeCsvField(this.formatTimestamp(customer.createdAt)),
                this.escapeCsvField(this.formatTimestamp(customer.updatedAt))
            ];
            csvLines.push(row.join(','));
        }

        return csvLines.join('\n');
    }

    private generateBookingCsv(bookings: Booking[]): string {
        const headers = ['id', 'tenant_id', 'customer_id', 'title', 'description', 'date', 'status', 'price', 'currency', 'created_at', 'updated_at'];
        const csvLines = [headers.join(',')];

        for (const booking of bookings) {
            const row = [
                this.escapeCsvField(booking.id),
                this.escapeCsvField(booking.tenantId),
                this.escapeCsvField(booking.customerId),
                this.escapeCsvField(booking.title),
                this.escapeCsvField(booking.description),
                this.escapeCsvField(this.formatTimestamp(booking.date)),
                this.escapeCsvField(booking.status),
                this.escapeCsvField(booking.price),
                this.escapeCsvField(booking.currency),
                this.escapeCsvField(this.formatTimestamp(booking.createdAt)),
                this.escapeCsvField(this.formatTimestamp(booking.updatedAt))
            ];
            csvLines.push(row.join(','));
        }

        return csvLines.join('\n');
    }

    async writeTenantData(tenantId: Tenant, data: TenantData): Promise<void> {
        const { customers, bookings } = data;

        // Generate CSV content
        const customersCsv = this.generateCustomerCsv(customers);
        const bookingsCsv = this.generateBookingCsv(bookings);

        // Write customers CSV file
        const customersPath = `${this.outputDir}/${tenantId.toLowerCase()}_customers.csv`;
        await Bun.write(customersPath, customersCsv);
        console.log(`  ✓ Customers CSV saved to: ${customersPath}`);

        // Write bookings CSV file
        const bookingsPath = `${this.outputDir}/${tenantId.toLowerCase()}_bookings.csv`;
        await Bun.write(bookingsPath, bookingsCsv);
        console.log(`  ✓ Bookings CSV saved to: ${bookingsPath}`);
    }

    getFormatName(): string {
        return 'CSV';
    }
}