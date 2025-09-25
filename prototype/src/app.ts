import fastify from 'fastify'
import path from 'path'

const server = fastify({ logger: true })

// Register the autoload plugin
server.register(require('@fastify/autoload'), {
    dir: path.join(__dirname, 'routes'),
    options: { routeParams: true }
})

// Start the server
const start = async (): Promise<void> => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' })
        server.log.info('Server listening on http://localhost:3000')
    } catch (err) {
        server.log.error(err)
        process.exit(1)
    }
}

start()