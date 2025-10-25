import autocannon from "autocannon";

const connections = 5
const totalRequests = 10

let httpErrors = 0;

const test = async (port: number) => {
    const numberofreturns: number[] = []

    const resultRead1 = await autocannon({
        url: `http://localhost:${port}`,
        connections,
        amount: totalRequests,
        timeout: 60,
        requests: [
            {
                method: 'GET',
                path: '/api/bookings?start=2025-10-01&end=2025-10-30',
                onResponse: (status, _body, _context) => {
                    if (status !== 200) {
                        console.error(`Unexpected status: ${status}`);
                        httpErrors++;
                    }

                    numberofreturns.push(JSON.parse(_body).bookings.length)
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
                    customerId: '725a92c1-b13b-4e68-a018-9df131725279',
                    title: 'Das ist eine neue Buchung',
                    description: 'das ist meine beschreibung',
                    date: new Date('2025-10-10'),
                    status: 'pending',
                    price: 20_00,
                    currency: 'EUR',
                    createdAt: new Date('2025-10-10'),
                    updatedAt: new Date('2025-10-10'),
                }),
                onResponse: (status, _body, _context) => {
                    if (status !== 200) {
                        console.error(`Unexpected status: ${status}`);
                        httpErrors++;
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
                path: '/api/bookings?start=2025-10-01&end=2025-10-30',
                onResponse: (status, _body, _context) => {
                    if (status !== 200) {
                        console.error(`Unexpected status: ${status}`);
                        httpErrors++;
                    }

                    numberofreturns.push(JSON.parse(_body).bookings.length)
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


