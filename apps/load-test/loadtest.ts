import autocannon from "autocannon";

const connections = 5
const totalRequests = 10

let httpErrors = 0;

const test = async (port: number) => {
    const result = await autocannon({
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
                }
            }
        ]
    });

    const totalErrors = result.errors + httpErrors;

    console.log({
        Port: port,
        'Total requests': result.requests.total,
        'Total time': `${result.duration} ms`,
        'Reqs/sec': result.requests.average.toFixed(2),
        'Latency avg': `${result.latency.average} ms`,
        'Gleichzeitige Verbindungen': connections,
        'Connection errors': result.errors,
        'HTTP status errors': httpErrors,
        'Total errors': totalErrors
    })
}

for (let port = 3000; port <= 3002; port++) {
    test(port)
}


