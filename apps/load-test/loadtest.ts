import autocannon from "autocannon";

const connections = 5
const totalRequests = 10

const result = await autocannon({
    url: `http://localhost:3000`,
    connections,  // gleichzeitige Verbindungen
    amount: totalRequests,
    timeout: 60
});

console.log({
    'Total requests': result.requests.total,
    'Total time': `${result.duration} ms`,
    'Reqs/sec': result.requests.average.toFixed(2),
    'Latency avg': `${result.latency.average} ms`,
    'Gleichzeitige Verbindungen': connections,
    'Fehler': result.errors
})
