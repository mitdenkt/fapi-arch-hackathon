import { faker } from '@faker-js/faker';
import type { Customer, Booking, Tenant } from '../schemas';
import { TENANT_CONFIG } from '../schemas';
import type { TenantData } from '../interfaces/data-writer.interface';

export class DataGeneratorService {
    private generateCustomer(tenantId: Tenant): Customer {
        const customerId = faker.string.uuid();
        const createdAt = faker.date.past({ years: 2 }).toISOString();

        return {
            id: customerId,
            tenantId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            phone: faker.phone.number(),
            createdAt,
            updatedAt: createdAt
        };
    }

    private generateBooking(tenantId: Tenant, customerId: string): Booking {
        const bookingId = faker.string.uuid();
        const date = faker.date.future({ years: 1 });
        const createdAt = faker.date.past({ years: 1 }).toISOString();

        return {
            id: bookingId,
            tenantId,
            customerId,
            title: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            date: date.toISOString(),
            status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
            price: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
            currency: 'EUR',
            createdAt,
            updatedAt: createdAt
        };
    }

    generateTenantData(tenantId: Tenant): TenantData {
        console.log(`Generating data for tenant: ${tenantId}`);

        const config = TENANT_CONFIG[tenantId];

        // Generate customers
        console.log(`  Generating ${config.customers} customers...`);
        const customers: Customer[] = [];
        for (let i = 0; i < config.customers; i++) {
            customers.push(this.generateCustomer(tenantId));
        }

        // Generate bookings with random customer assignments
        console.log(`  Generating ${config.bookings} bookings...`);
        const bookings: Booking[] = [];
        for (let i = 0; i < config.bookings; i++) {
            const randomCustomer = faker.helpers.arrayElement(customers);
            bookings.push(this.generateBooking(tenantId, randomCustomer.id));
        }

        return { customers, bookings };
    }
}