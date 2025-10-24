import fs from 'fs';
import path from 'path'
import { Serializer } from "./Serializer";

export class CSVSerializer implements Serializer {
    async persist(data: object[], destination: string, initialize = false): Promise<void> {
        if (!data || data.length === 0) return Promise.resolve()

        if (initialize) {
            const temp = data[0]
            const headers = Object.keys(temp)

            try { fs.unlinkSync(destination); } catch (error) { /** ignore */ }

            const headerLine = headers.join(';') + '\n';

            const dir = path.dirname(destination);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(destination, headerLine, {});
        }

        const lines: string[] = [];

        for (const item of data) {
            const line = Object.values(item).map(value => `${JSON.stringify(value)}`).join(';') + '\n'
            lines.push(line);
        }

        fs.appendFileSync(destination, lines.join(''));
    }
}