import autocannon from "autocannon";
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const connections = 5
const totalRequests = 10

let httpErrors = 0;

const querystring = 'start=2025-10-20&end=2025-10-26'

const customerport = 3000
const appid = process.env.APP ?? 'appa';

const customerId = await fetch(`http://localhost:${customerport}/api/customers`)
    .then(r => r.json())
    .then(j => j?.id)

if (customerId === undefined) {
    console.log('did not find a cutomer')
    process.exit(1)
}

const test = async (port: number) => {
    const numberofreturns: number[] = []
    
    // Get the first customer from the database
    const customerId = 'e56ac603-00fa-4924-9e9b-9d50ed9afa70';
    console.log(`Using customer ID: ${customerId}`);

    const resultRead1 = await autocannon({
        url: `http://localhost:${port}`,
        connections,
        amount: totalRequests,
        timeout: 60,
        requests: [
            {
                method: 'GET',
                path: `/api/bookings?${querystring}`,
                onResponse: (status, _body, _context) => {

                    if (status !== 200) {
                        console.error(`GET Error ${status}: ${_body}`);
                        httpErrors++;
                        numberofreturns.push(0);
                        return;
                    }

                    try {
                        const response = JSON.parse(_body);
                        const bookingCount = response.bookings ? response.bookings.length : 0;
                        numberofreturns.push(bookingCount);
                        console.log(`GET Success: Found ${bookingCount} bookings`);
                    } catch (e) {
                        console.error(`Failed to parse response: ${_body} - Error: ${e}`);
                        numberofreturns.push(0)
                    }
                }
            }
        ]
    });

    const resultWrite = await autocannon({
        url: `http://localhost:${port}`,
        connections,
        amount: totalRequests,
        timeout: 60,
        requests: [
            {
                method: 'POST',
                path: '/api/bookings',
                headers: { "content-type": 'application/json' },
                body: JSON.stringify({
                    customerId,
                    title: 'Das ist eine neue Buchung',
                    description: 'das ist meine beschreibung',
                    date: new Date('2025-10-10'),
                    status: 'pending',
                    price: 20_00,
                    tenantId: appid,
                    currency: 'EUR',
                    createdAt: new Date('2025-10-10'),
                    updatedAt: new Date('2025-10-10'),
                }),
                onResponse: (status, _body, _context) => {
                    if (status !== 200 && status !== 201) {
                        console.error(`POST Error ${status}: ${_body}`);
                        httpErrors++;
                    } else {
                        console.log(`POST Success ${status}: Booking created`);
                    }
                }
            }
        ]
    });

    const resultRead2 = await autocannon({
        url: `http://localhost:${port}`,
        connections,
        amount: totalRequests,
        timeout: 60,
        requests: [
            {
                method: 'GET',
                path: `/api/bookings?${querystring}`,
                onResponse: (status, _body, _context) => {
                    if (status !== 200) {
                        console.error(`GET Error ${status}: ${_body}`);
                        httpErrors++;
                        numberofreturns.push(0);
                        return;
                    }

                    try {
                        const response = JSON.parse(_body);
                        const bookingCount = response.bookings ? response.bookings.length : 0;
                        numberofreturns.push(bookingCount);
                        console.log(`GET Success: Found ${bookingCount} bookings`);
                    } catch (e) {
                        console.error(`Failed to parse response: ${_body} - Error: ${e}`);
                        numberofreturns.push(0)
                    }
                }
            }
        ]
    });

    const totalErrors = resultRead1.errors + httpErrors + resultRead2.errors + resultWrite.errors;

    console.log({
        Port: port,
        'Total requests': totalRequests * 3,
        'Read before write (Latency avg)': `${resultRead1.latency.average} ms`,

        'Write (Latency avg)': `${resultWrite.latency.average} ms`,

        'Read after write (Latency avg)': `${resultRead2.latency.average} ms`,

        'Total errors': totalErrors,
        'number of returned bookings': numberofreturns
    })
}

// for (let port = 3000; port <= 3002; port++) {
//     test(port)
// }

test(3000)


