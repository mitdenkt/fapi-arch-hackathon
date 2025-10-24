import { Serializer } from "./Serializer";
import fs from 'fs';
import path from 'path';

export class SQLSerializer implements Serializer {
    async persist(data: object[], destination: string, initialize: boolean): Promise<void> {
        if (!data || data.length === 0) return Promise.resolve();

        if (initialize) {
            const temp = data[0];
            const columns = Object.keys(temp);

            try { fs.unlinkSync(destination); } catch (error) { /** ignore */ }

            // Create table schema based on first object
            const tableName = path.basename(destination, '.sql');
            const columnDefinitions = columns.map(col => {
                const value = (temp as any)[col];
                let dataType = 'TEXT';
                let constraints = '';

                if (col.toLowerCase() === 'id') {
                    dataType = 'INTEGER';
                    constraints = ' PRIMARY KEY AUTOINCREMENT';
                } else if (value instanceof Date) {
                    dataType = 'DATETIME';
                } else if (typeof value === 'number') {
                    dataType = Number.isInteger(value) ? 'INTEGER' : 'REAL';
                } else if (typeof value === 'boolean') {
                    dataType = 'BOOLEAN';
                }

                return `  ${col} ${dataType}${constraints}`;
            });

            const createTable = `CREATE TABLE IF NOT EXISTS ${tableName} (\n` +
                columnDefinitions.join(',\n') +
                '\n);\n\n';

            const dir = path.dirname(destination);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(destination, createTable, {});
        }

        const tableName = path.basename(destination, '.sql');
        const columns = Object.keys(data[0]);
        const insertStatements: string[] = [];

        for (const item of data) {
            const values = Object.values(item).map(value => {
                if (value === null || value === undefined) {
                    return 'NULL';
                }
                if (value instanceof Date) {
                    return `'${value.toISOString()}'`;
                }
                return `'${String(value).replace(/'/g, "''")}'`;
            });
            const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
            insertStatements.push(insertSQL);
        }

        fs.appendFileSync(destination, insertStatements.join(''));
    }
}