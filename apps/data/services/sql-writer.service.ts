import type { Customer, Booking, Tenant } from '../schemas';
import { TENANTS } from '../schemas';
import type { DataWriter, TenantData } from '../interfaces/data-writer.interface';

export class SqlWriterService implements DataWriter {
    private readonly outputDir = './sql';

    private escapeString(str: string): string {
        return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
    }

    private formatTimestamp(isoString: string): string {
        return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
    }

    private generateCustomerInserts(customers: Customer[]): string[] {
        return customers.map(customer => {
            const values = [
                `'${customer.id}'`,
                `'${customer.tenantId}'`,
                `'${this.escapeString(customer.name)}'`,
                `'${this.escapeString(customer.email)}'`,
                `'${this.escapeString(customer.phone)}'`,
                `'${this.formatTimestamp(customer.createdAt)}'`,
                `'${this.formatTimestamp(customer.updatedAt)}'`
            ];

            return `INSERT INTO customers (id, tenant_id, name, email, phone, created_at, updated_at) VALUES (${values.join(', ')});`;
        });
    }

    private generateBookingInserts(bookings: Booking[]): string[] {
        return bookings.map(booking => {
            const values = [
                `'${booking.id}'`,
                `'${booking.tenantId}'`,
                `'${booking.customerId}'`,
                `'${this.escapeString(booking.title)}'`,
                `'${this.escapeString(booking.description)}'`,
                `'${this.formatTimestamp(booking.date)}'`,
                `'${booking.status}'`,
                booking.price.toString(),
                `'${booking.currency}'`,
                `'${this.formatTimestamp(booking.createdAt)}'`,
                `'${this.formatTimestamp(booking.updatedAt)}'`
            ];

            return `INSERT INTO bookings (id, tenant_id, customer_id, title, description, date, status, price, currency, created_at, updated_at) VALUES (${values.join(', ')});`;
        });
    }

    async writeTenantData(tenantId: Tenant, data: TenantData): Promise<void> {
        const { customers, bookings } = data;

        // Generate SQL statements
        const customerInserts = this.generateCustomerInserts(customers);
        const bookingInserts = this.generateBookingInserts(bookings);

        // Create SQL file content
        const sqlContent = [
            `-- SQL INSERT statements for tenant ${tenantId}`,
            `-- Generated on ${new Date().toISOString()}`,
            '',
            '-- Disable foreign key checks for faster inserts',
            'SET FOREIGN_KEY_CHECKS = 0;',
            '',
            `-- Insert customers for tenant ${tenantId}`,
            ...customerInserts,
            '',
            `-- Insert bookings for tenant ${tenantId}`,
            ...bookingInserts,
            '',
            '-- Re-enable foreign key checks',
            'SET FOREIGN_KEY_CHECKS = 1;',
            ''
        ].join('\n');

        // Write SQL file
        const sqlPath = `${this.outputDir}/${tenantId.toLowerCase()}_inserts.sql`;
        await Bun.write(sqlPath, sqlContent);
        console.log(`  ✓ SQL file saved to: ${sqlPath}`);
    }

    async finalize(): Promise<void> {
        await this.generateCombinedSQL();
    }

    private async generateCombinedSQL(): Promise<void> {
        console.log('\nGenerating combined SQL file...');

        const combinedSql = [
            '-- Combined SQL INSERT statements for all tenants',
            `-- Generated on ${new Date().toISOString()}`,
            '',
            '-- Disable foreign key checks for faster inserts',
            'SET FOREIGN_KEY_CHECKS = 0;',
            ''
        ];

        for (const tenantId of TENANTS) {
            const sqlFile = Bun.file(`${this.outputDir}/${tenantId.toLowerCase()}_inserts.sql`);
            const content = await sqlFile.text();

            // Extract just the INSERT statements (skip headers and SET commands)
            const lines = content.split('\n');
            const insertLines = lines.filter(line =>
                line.startsWith('INSERT INTO') ||
                (line.startsWith('--') && line.includes('Insert'))
            );

            combinedSql.push(`-- Data for tenant ${tenantId}`);
            combinedSql.push(...insertLines);
            combinedSql.push('');
        }

        combinedSql.push('-- Re-enable foreign key checks');
        combinedSql.push('SET FOREIGN_KEY_CHECKS = 1;');

        await Bun.write(`${this.outputDir}/all_tenants_inserts.sql`, combinedSql.join('\n'));
        console.log(`✓ Combined SQL file saved to: ${this.outputDir}/all_tenants_inserts.sql`);
    }

    getFormatName(): string {
        return 'SQL';
    }
}