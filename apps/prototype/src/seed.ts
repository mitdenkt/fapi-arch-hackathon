import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { booking, customer } from './db/schema';
import { sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const db = drizzle(process.env.DATABASE_URL!);

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function processLargeCsvFile(filePath: string, processor: (data: any[]) => Promise<void>, headers: string[]) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let batch: any[] = [];
    const batchSize = 1000;
    let isFirstLine = true;
    let processing = false;
    
    rl.on('line', (line) => {
      // Skip header line
      if (isFirstLine) {
        isFirstLine = false;
        return;
      }
      
      try {
        const values = parseCsvLine(line);
        const obj: any = {};
        
        headers.forEach((header, index) => {
          obj[header] = values[index];
        });
        
        batch.push(obj);
        
        if (batch.length >= batchSize && !processing) {
          processing = true;
          rl.pause();
          
          const currentBatch = [...batch];
          batch = [];
          
          processor(currentBatch)
            .then(() => {
              processing = false;
              rl.resume();
            })
            .catch((error) => {
              rl.close();
              reject(error);
            });
        }
      } catch (error) {
        rl.close();
        reject(error);
      }
    });
    
    rl.on('close', async () => {
      // Process remaining batch
      if (batch.length > 0) {
        try {
          await processor(batch);
        } catch (error) {
          reject(error);
          return;
        }
      }
      resolve(undefined);
    });
    
    rl.on('error', reject);
  });
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const outputDir = path.join(__dirname, '../../data/output');
  const tenants = ['APPA', 'APPB', 'APPC'];

  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.execute(sql`TRUNCATE TABLE booking CASCADE`);
    await db.execute(sql`TRUNCATE TABLE customer CASCADE`);
    
    // Seed customers first (foreign key dependency)
    console.log('👥 Seeding customers...');
    for (const tenant of tenants) {
      const customerFile = path.join(outputDir, tenant, 'customer.csv');
      
      if (fs.existsSync(customerFile)) {
        console.log(`  📁 Reading customers for ${tenant}...`);
        
        const customerHeaders = ['id', 'tenantId', 'name', 'email', 'phone', 'createdAt', 'updatedAt'];
        
        await processLargeCsvFile(customerFile, async (batch) => {
          const processedBatch = batch.map((customer: any) => ({
            ...customer,
            createdAt: new Date(customer.createdAt),
            updatedAt: new Date(customer.updatedAt)
          }));
          
          await db.insert(customer).values(processedBatch);
          console.log(`    ✅ Inserted ${processedBatch.length} customers`);
        }, customerHeaders);
      }
    }
    
    // Seed bookings
    console.log('📅 Seeding bookings...');
    for (const tenant of tenants) {
      const bookingFile = path.join(outputDir, tenant, 'booking.csv');
      
      if (fs.existsSync(bookingFile)) {
        console.log(`  📁 Reading bookings for ${tenant}...`);
        
        const bookingHeaders = ['id', 'tenantId', 'customerId', 'title', 'description', 'date', 'status', 'price', 'currency', 'createdAt', 'updatedAt'];
        
        await processLargeCsvFile(bookingFile, async (batch) => {
          const processedBatch = batch.map((booking: any) => ({
            ...booking,
            price: parseInt(booking.price),
            date: new Date(booking.date),
            createdAt: new Date(booking.createdAt),
            updatedAt: new Date(booking.updatedAt)
          }));
          
          await db.insert(booking).values(processedBatch);
          console.log(`    ✅ Inserted ${processedBatch.length} bookings`);
        }, bookingHeaders);
      }
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
    // Show summary
    const customerResult = await db.execute(sql`SELECT COUNT(*) as count FROM customer`);
    const bookingResult = await db.execute(sql`SELECT COUNT(*) as count FROM booking`);
    
    console.log(`📊 Summary:`);
    console.log(`  👥 Customers: ${customerResult.rows[0].count}`);
    console.log(`  📅 Bookings: ${bookingResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('✨ Seeding process finished');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});