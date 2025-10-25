import { CacheHandler } from '@handlers/CacheHandler'
import { ValkeyClient } from '@cache/ValkeyClient'
import fastify from 'fastify'
import path from 'path'

// Initialize Valkey cache connection
ValkeyClient.init()

// Test Valkey connection after a brief delay to allow connection to establish
setTimeout(async () => {
    await ValkeyClient.testConnection()
}, 1000)

// caching the data from file system
CacheHandler.init()

const server = fastify({ logger: false })

// Register the autoload plugin
server.register(require('@fastify/autoload'), {
    dir: path.join(__dirname, 'routes'),
    options: { routeParams: true }
})

// Start the server, try ports upward if the port is taken
const start = async (): Promise<void> => {
    const host = '0.0.0.0'
    const startPort = 3000
    const maxPort = 3100

    for (let port = startPort; port <= maxPort; port++) {
        try {
            await server.listen({ port, host })
            console.log(`Server listening on http://localhost:${port}`)
            return
        } catch (err: any) {
            // If port is in use or permission denied, try next port
            if (err && (err.code === 'EADDRINUSE' || err.code === 'EACCES')) {
                continue
            }
            console.error(err)
            process.exit(1)
        }
    }

    console.error(`No available ports found in range ${startPort}-${maxPort}`)
    process.exit(1)
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, closing gracefully...`)
    
    try {
        await server.close()
        await ValkeyClient.close()
        process.exit(0)
    } catch (err) {
        console.error('Error during graceful shutdown:', err)
        process.exit(1)
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

start()