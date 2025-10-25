import { CustomerHandler } from '@handlers/CustomerHandler'
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'

async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    fastify.route({
        method: 'GET',
        url: '/',
        handler: async (request: FastifyRequest) => CustomerHandler.findFirst()

    })
}

export default routes

