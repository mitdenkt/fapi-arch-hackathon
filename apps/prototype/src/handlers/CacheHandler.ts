import { readFileSync } from "fs";
import path from "path";
import { Booking, Customer, Z_Booking, Z_Customer } from "src/types";
import z from "zod";
import { SomeType } from "zod/v4/core";

const appid = process.env.APP ?? 'appa'

let customers: Map<string, Customer> | null = null //<string, Customer> | null = null
let bookings: Map<string, Booking> | null = null //Booking[] | null = null

export class CacheHandler {
    public static init() {
        const parsedBookings = this._load(
            'bookings',
            Z_Booking,
            b => b.id
        )

        bookings = parsedBookings

        const parsedCustomer = this._load(
            'customers',
            Z_Customer,
            c => c.id
        )

        customers = parsedCustomer
    }

    public static getCustomers(): Map<string, Customer> {
        if (customers !== null) return customers

        const _customers = this._load(
            'customers',
            Z_Customer,
            c => c.id
        )

        customers = _customers

        return _customers
    }

    public static getBookings(): Map<string, Booking> {
        if (bookings !== null) return bookings

        const _bookings = this._load(
            'bookings',
            Z_Booking,
            b => b.id
        )

        bookings = _bookings

        return _bookings
    }

    private static _load<T extends SomeType>(
        dataType: 'bookings' | 'customers',
        Z_Parser: T,
        keySelector: (entry: z.core.output<T>) => string
    ): Map<string, z.core.output<T>> {
        const started = Date.now()

        const jsonBasePath = path.join(__dirname, '..', '..', '..', 'data', 'json')

        const dataPath = jsonBasePath + `/${appid}_${dataType}.json`
        const data = readFileSync(dataPath, { encoding: 'utf-8' })
        const dataParsed = z.array(Z_Parser).parse(JSON.parse(data))

        const map = new Map<string, z.core.output<T>>()

        dataParsed.forEach(d => {
            map.set(
                keySelector(d),
                d
            )
        })

        console.log(`initial loading of "${dataType}" finished in ${Date.now() - started} ms for appid ${appid}.`)

        return map
    }
}


