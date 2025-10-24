import { faker } from "@faker-js/faker";
import { CSVSerializer } from "./Serializer/CSVSerializer";
import { SQLSerializer } from "./Serializer/SQLSerializer";
import { JSONSerializer } from "./Serializer/JSONSerializer";
import { Serializer } from "./Serializer/Serializer";


const batchSize = 25_000

const Targets = [
    'csv',
    'sql',
    'json',
] as const
type Target = typeof Targets[number]

const TargetSerializers: Record<typeof Targets[number], Serializer> = {
    csv: new CSVSerializer(),
    json: new JSONSerializer(),
    sql: new SQLSerializer()
}

export type Subject = 'customers' | 'bookings'

const TENANT_CONFIG: Record<'APPA' | 'APPB' | 'APPC', Record<Subject, number>> = {
    APPA: { customers: 3_000, bookings: 50_000 },
    APPB: { customers: 6_000, bookings: 600_000 },
    APPC: { customers: 9_000, bookings: 1_500_000 }
} as const;
type Tenant = keyof typeof TENANT_CONFIG

const getRandomDate = () => faker.date.between({ from: new Date('2023-01-01'), to: new Date('2025-12-31') });

const getDatePlusDays = (date: Date): Date => {
    const daysToAdd = faker.number.int({ min: 20, max: 40 });
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + daysToAdd);
    return newDate;
};

const targets = Array.from(new Set(process.argv.filter((a): a is Target => Targets.includes(a as Target))))
console.log('targets', targets)

if (targets.length === 0) {
    console.log('no targets specified. provide csv/json/sql')
    process.exit(1)
}

const processBatches = async (customersTotal: number, bookingsTotal: number, tenant: Tenant): Promise<void> => {

    let iterator = 0

    const customerIds: string[] = []
    const getCustomerId = () => customerIds[Math.floor(Math.random() * customerIds.length)];

    const customerDestination = (target: Target) => `${__dirname}/output/${tenant}/customer.${target}`

    const customerBatches = subArray(customersTotal)
    for (const x of customerBatches) {
        const progress = Math.round(((x.length + (iterator * batchSize)) / customersTotal) * 100)
        process.stdout.write(`\r${progress}% customers created for tenant ${tenant}`)

        const customers = x.map(() => generateCustomer(tenant))

        customerIds.push(...customers.map(c => c.id))

        const isLastBatch = iterator === customerBatches.length - 1
        for (const target of targets)
            await TargetSerializers[target].persist(customers, customerDestination(target), iterator === 0, isLastBatch)


        iterator++
    }

    console.log('')

    iterator = 0

    const bookingDestination = (target: Target) => `${__dirname}/output/${tenant}/booking.${target}`

    const bookingBatches = subArray(bookingsTotal)
    for (const x of bookingBatches) {
        const progress = Math.round(((x.length + (iterator * batchSize)) / bookingsTotal) * 100)
        process.stdout.write(`\r${progress}% bookings created for tenant ${tenant}`)

        const bookings = x.map(() => generateBooking(tenant, getCustomerId()))

        const isLastBatch = iterator === bookingBatches.length - 1
        for (const target of targets)
            await TargetSerializers[target].persist(bookings, bookingDestination(target), iterator === 0, isLastBatch)


        iterator++
    }

    console.log('')
}

for (const [tenant, config] of Object.entries(TENANT_CONFIG)) {
    await processBatches(config.customers, config.bookings, tenant as keyof typeof TENANT_CONFIG)
}

function generateBooking(tenantId: Tenant, customerId: string) {
    const now = getRandomDate()

    return {
        id: faker.string.uuid(),
        tenantId,
        customerId,
        title: faker.commerce.productName(),
        description: faker.lorem.sentence(),
        date: now,
        status: faker.helpers.arrayElement(['pending', 'confirmed', 'cancelled', 'completed']),
        price: parseFloat(faker.commerce.price({ min: 50, max: 2000 })),
        currency: 'EUR',
        createdAt: now,
        updatedAt: getDatePlusDays(now)
    };
}

function generateCustomer(tenantId: Tenant) {
    const now = getRandomDate()

    return {
        id: faker.string.uuid(),
        tenantId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        createdAt: now,
        updatedAt: getDatePlusDays(now)
    }
}

function subArray(total: number, arrayBatchSize = batchSize): undefined[][] {
    const result: undefined[][] = [];

    for (let i = 0; i < total; i += arrayBatchSize) {
        const batchLength = Math.min(arrayBatchSize, total - i);
        result.push(Array(batchLength).fill(undefined));
    }

    return result;
}

export { };
