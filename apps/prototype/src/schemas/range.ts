import z from "zod"

export const F_RangeSchema = {
    querystring: {
        type: 'object',
        required: ['start', 'end'],
        properties: {
            start: {
                type: 'string',
                format: 'date',
                description: 'Start date in YYYY-MM-DD format'
            },
            end: {
                type: 'string',
                format: 'date',
                description: 'End date in YYYY-MM-DD format'
            }
        }
    }
}

export const Z_RangeSchema = z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
})

export const Z_ID = z.object({
    id: z.coerce.string()
})

export type RangeSchema = z.infer<typeof Z_RangeSchema>