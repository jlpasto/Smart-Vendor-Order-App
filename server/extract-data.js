import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source database configuration
const sourcePool = new pg.Pool({
  host: 'dpg-d3jjrr7fte5s73frlnig-a',
  port: 5432,
  database: 'wholesale_app_4csh',
  user: 'wholesale_app_4csh_user',
  password: 'lrmooKVMVwidUWaMYBNni3daraps5upq',
  ssl: {
    rejectUnauthorized: false
  }
});

const escapeValue = (value) => {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (Array.isArray(value)) {
    return `ARRAY[${value.map(v => escapeValue(v)).join(',')}]`;
  }
  // String - escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`;
};

const extractData = async () => {
  try {
    console.log('🔍 Connecting to source database...');

    // Get table names in dependency order
    const tablesResult = await sourcePool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    // Order tables by dependencies (manual ordering for known tables)
    const tableOrder = ['users', 'vendors', 'products', 'orders'];
    const tables = tablesResult.rows
      .map(r => r.table_name)
      .sort((a, b) => {
        const indexA = tableOrder.indexOf(a);
        const indexB = tableOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    console.log(`✅ Found ${tables.length} tables to export`);

    let dataSQL = '';
    dataSQL += '-- Database Data Export\n';
    dataSQL += `-- Generated: ${new Date().toISOString()}\n`;
    dataSQL += '-- Source Database: wholesale_app_4csh\n\n';
    dataSQL += '-- Disable triggers and constraints during import\n';
    dataSQL += 'SET session_replication_role = replica;\n\n';

    let totalRows = 0;

    for (const tableName of tables) {
      console.log(`  📊 Extracting data from: ${tableName}`);

      // Get row count
      const countResult = await sourcePool.query(`SELECT COUNT(*) FROM ${tableName}`);
      const rowCount = parseInt(countResult.rows[0].count);

      if (rowCount === 0) {
        console.log(`    ℹ️  No data in ${tableName}`);
        continue;
      }

      console.log(`    📦 ${rowCount} rows`);
      totalRows += rowCount;

      // Get all data
      const dataResult = await sourcePool.query(`SELECT * FROM ${tableName}`);

      if (dataResult.rows.length === 0) continue;

      // Get column names
      const columns = Object.keys(dataResult.rows[0]);

      dataSQL += `-- Table: ${tableName} (${rowCount} rows)\n`;
      dataSQL += `DELETE FROM ${tableName};\n`;

      // Insert in batches
      const batchSize = 100;
      for (let i = 0; i < dataResult.rows.length; i += batchSize) {
        const batch = dataResult.rows.slice(i, i + batchSize);

        for (const row of batch) {
          const values = columns.map(col => escapeValue(row[col]));
          dataSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }

      // Reset sequence for SERIAL columns
      const sequenceResult = await sourcePool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_default LIKE 'nextval%';
      `, [tableName]);

      for (const seqCol of sequenceResult.rows) {
        const seqName = `${tableName}_${seqCol.column_name}_seq`;
        dataSQL += `SELECT setval('${seqName}', (SELECT MAX(${seqCol.column_name}) FROM ${tableName}), true);\n`;
      }

      dataSQL += '\n';
    }

    dataSQL += '-- Re-enable triggers and constraints\n';
    dataSQL += 'SET session_replication_role = DEFAULT;\n\n';

    // Write to file
    const outputPath = path.join(__dirname, 'extracted-data.sql');
    fs.writeFileSync(outputPath, dataSQL);

    console.log('');
    console.log('✅ Data extraction completed!');
    console.log(`📄 Data saved to: ${outputPath}`);
    console.log(`📊 Total rows exported: ${totalRows}`);
    console.log('');

    await sourcePool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error extracting data:', error);
    await sourcePool.end();
    process.exit(1);
  }
};

extractData();
