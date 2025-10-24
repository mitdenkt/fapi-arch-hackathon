import { FastifyInstance, FastifyPluginOptions } from 'fastify'

async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    fastify.route({
        method: 'GET',
        url: '/',
        handler: async () => {
            return {
                message: 'Server is running',
                status: 'ok',
                timestamp: new Date().toISOString()
            }
        }
    })
}

export default routes