const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'paylink.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = createClient({
  url: `file:${dbPath}`,
});

async function initDb() {
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  await db.executeMultiple(schema);
  console.log('Database schema initialized.');
}

module.exports = {
  db,
  initDb
};
