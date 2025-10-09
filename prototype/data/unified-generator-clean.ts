import { TENANTS } from './schemas';
import { DataGeneratorService } from './services/data-generator.service';
import { DataWriterFactory, DataFormat } from './services/data-writer.factory';

export class UnifiedDataGenerator {
    private readonly dataGenerator = new DataGeneratorService();

    async generateData(format: DataFormat): Promise<void> {
        const writer = DataWriterFactory.create(format);

        console.log(`Starting data generation (${writer.getFormatName()} format)...`);

        const results = [];

        for (const tenantId of TENANTS) {
            const data = this.dataGenerator.generateTenantData(tenantId);

            await writer.writeTenantData(tenantId, data);

            results.push({
                tenantId,
                customerCount: data.customers.length,
                bookingCount: data.bookings.length
            });

            console.log(`  ✓ Completed ${tenantId}: ${data.customers.length} customers, ${data.bookings.length} bookings\n`);
        }

        // Perform any post-processing (e.g., combined SQL file)
        if (writer.finalize) {
            await writer.finalize();
        }

        console.log(`Data generation completed successfully (${writer.getFormatName()})!`);
        const totalCustomers = results.reduce((sum, r) => sum + r.customerCount, 0);
        const totalBookings = results.reduce((sum, r) => sum + r.bookingCount, 0);
        console.log(`Total: ${totalCustomers} customers, ${totalBookings} bookings`);
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const format = args[0]?.toLowerCase();

    if (!format || !DataWriterFactory.getSupportedFormats().includes(format as DataFormat)) {
        console.error('Usage: bun run unified-generator-clean.ts <json|sql|csv>');
        console.error('Examples:');
        console.error('  bun run unified-generator-clean.ts json');
        console.error('  bun run unified-generator-clean.ts sql');
        console.error('  bun run unified-generator-clean.ts csv');
        process.exit(1);
    }

    const generator = new UnifiedDataGenerator();
    await generator.generateData(format as DataFormat);
}

if (import.meta.main) {
    await main();
}