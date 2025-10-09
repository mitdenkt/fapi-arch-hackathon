import type { DataWriter } from '../interfaces/data-writer.interface';
import { JsonWriterService } from './json-writer.service';
import { SqlWriterService } from './sql-writer.service';
import { CsvWriterService } from './csv-writer.service';

export enum DataFormat {
    JSON = 'json',
    SQL = 'sql',
    CSV = 'csv'
}

export class DataWriterFactory {
    static create(format: DataFormat): DataWriter {
        switch (format) {
            case DataFormat.JSON:
                return new JsonWriterService();
            case DataFormat.SQL:
                return new SqlWriterService();
            case DataFormat.CSV:
                return new CsvWriterService();
            default:
                throw new Error(`Unsupported data format: ${format}`);
        }
    }

    static getSupportedFormats(): DataFormat[] {
        return Object.values(DataFormat);
    }
}