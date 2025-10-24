import autocannon from "autocannon";

const connections = 5
const totalRequests = 10

let httpErrors = 0;

const result = await autocannon({
    url: `http://localhost:3000`,
    connections,
    amount: totalRequests,
    timeout: 60,
    requests: [
        {
            method: 'GET',
            path: '/api/bookings?start=2026-01-01&end=2026-01-15',
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
    'Total requests': result.requests.total,
    'Total time': `${result.duration} ms`,
    'Reqs/sec': result.requests.average.toFixed(2),
    'Latency avg': `${result.latency.average} ms`,
    'Gleichzeitige Verbindungen': connections,
    'Connection errors': result.errors,
    'HTTP status errors': httpErrors,
    'Total errors': totalErrors
})
