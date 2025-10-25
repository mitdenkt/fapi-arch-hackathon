import { Customer } from "@types"
import { CacheHandler } from "./CacheHandler"
import { customer } from "@db/schema"
import { db } from "index"
import { eq } from "drizzle-orm"


const appid = process.env.APP ?? 'APPA'
export class CustomerHandler {
    static async findFirst(): Promise<Customer> {
        console.log(`Finding first customer for app ${appid}`)
        const firstCustomer = await db.query.customer.findFirst({
            where: eq(customer.tenantId, appid)
        })
        if (firstCustomer === undefined) throw new Error('did not find the user')
        return {
            id: firstCustomer.id,
            tenantId: firstCustomer.tenantId,
            name: firstCustomer.name,
            email: firstCustomer.email,
            phone: firstCustomer.phone ?? '',
            createdAt: firstCustomer.createdAt.toISOString(),
            updatedAt: firstCustomer.updatedAt.toISOString()
        }
    }
}