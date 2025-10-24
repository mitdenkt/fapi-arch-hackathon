import { CacheHandler } from '@handlers/CacheHandler'
import fastify from 'fastify'
import path from 'path'

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
                console.warn(`Port ${port} unavailable (${err.code}). Trying ${port + 1}...`)
                continue
            }
            console.error(err)
            process.exit(1)
        }
    }

    console.error(`No available ports found in range ${startPort}-${maxPort}`)
    process.exit(1)
}

start()