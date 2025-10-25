import { BookingHandler } from '@handlers/BookingHandler'
import { CacheHandler } from '@handlers/CacheHandler'
import { F_RangeSchema, Z_RangeSchema } from '@schemas/range'
import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from 'fastify'
import { Z_BookingCandidate } from '@types'

async function routes(fastify: FastifyInstance, _options: FastifyPluginOptions): Promise<void> {
    fastify.route({
        method: 'GET',
        url: '/',
        handler: async (request: FastifyRequest) => {
            const { start, end } = Z_RangeSchema.parse(request.query)

            return BookingHandler.queryRange(start, end)
        }
    })

    fastify.route({
        method: 'POST',
        url: '/',
        handler: async (request: FastifyRequest) => {
            const booking = Z_BookingCandidate.parse(request.body)

            return BookingHandler.addBooking(booking)
        }
    })
}

export default routes

