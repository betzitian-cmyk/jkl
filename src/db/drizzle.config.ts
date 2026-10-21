import { defineConfig } from 'drizzle-kit';

const { SQL_USER, SQL_PASSWORD, SQL_HOST, SQL_DB_NAME } = process.env;
const url = `postgresql://${SQL_USER}:${encodeURIComponent(SQL_PASSWORD || '')}@/${SQL_DB_NAME}?host=${SQL_HOST}`;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: url,
  },
});
