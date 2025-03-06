import postgres  from 'postgres';
import { DATABASE_URL, DATABASE_SSL } from '@/utils/env.js';

const sql = postgres(DATABASE_URL,{
    ssl: DATABASE_SSL ? {
        rejectUnauthorized: false
    } : false
});

export default sql;

export const connectDB = async () => {
  try {
    await sql`SELECT 1`;
    console.log('✅ PostgreSQL Connected!');
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
    process.exit(1);
  }
};