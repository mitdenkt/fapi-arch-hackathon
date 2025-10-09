import { BookingHandler } from '@handlers/BookingHandler'
import { F_RangeSchema, Z_RangeSchema } from '@schemas/range'
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'

async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    fastify.route({
        method: 'GET',
        url: '/',
        schema: F_RangeSchema,
        handler: async (request: FastifyRequest) => {
            const { start, end } = Z_RangeSchema.parse(request.query)

            return BookingHandler.queryRange(start, end)
        }
    })
}

export default routes