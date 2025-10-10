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

// Start the server
const start = async (): Promise<void> => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' })
        console.log('Server listening on http://localhost:3000')
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}

start()