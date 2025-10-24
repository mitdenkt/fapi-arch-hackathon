import { Serializer } from "./Serializer";
import fs from 'fs';
import path from 'path';

export class JSONSerializer implements Serializer {
    async persist(data: object[], destination: string, initialize: boolean, lastBatch: boolean): Promise<void> {
        if (!data || data.length === 0) {
            if (lastBatch && fs.existsSync(destination)) {
                // Close the array if this is the last batch but no data
                fs.appendFileSync(destination, '\n]');
            }
            return Promise.resolve();
        }

        const dir = path.dirname(destination);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (initialize) {
            try { fs.unlinkSync(destination); } catch (error) { /** ignore */ }
            // Start JSON array
            fs.writeFileSync(destination, '[\n', {});
        }

        // Check if file exists and has content to determine if we need a comma
        const needsComma = fs.existsSync(destination) && fs.statSync(destination).size > 2; // More than just "[\n"

        const jsonLines: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const jsonString = JSON.stringify(item, null, 2);
            const indentedJson = jsonString.split('\n').map(line => '  ' + line).join('\n');

            const prefix = (needsComma || i > 0) ? ',\n' : '';
            jsonLines.push(prefix + indentedJson);
        }

        fs.appendFileSync(destination, jsonLines.join(''));

        if (lastBatch) {
            fs.appendFileSync(destination, '\n]');
        }
    }
}