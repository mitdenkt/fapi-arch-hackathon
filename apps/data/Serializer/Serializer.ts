
export interface Serializer {
    persist(data: object[], destination: string, initialize: boolean, lastBatch: boolean): Promise<void>
}