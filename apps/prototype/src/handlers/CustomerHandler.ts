import { Customer } from "src/types"
import { CacheHandler } from "./CacheHandler"

export class CustomerHandler {
    static findFirst(): Customer {
        const c = Array.from(CacheHandler.getCustomers().values()).at(0)
        if (c === undefined) throw new Error('did not find the user')

        return c
    }
}