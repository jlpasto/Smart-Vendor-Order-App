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

const extractSchema = async () => {
  try {
    console.log('🔍 Connecting to source database...');

    // Get all table names
    const tablesResult = await sourcePool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log(`✅ Found ${tablesResult.rows.length} tables`);

    let schema = '';
    schema += '-- Database Schema Export\n';
    schema += `-- Generated: ${new Date().toISOString()}\n`;
    schema += '-- Source Database: wholesale_app_4csh\n\n';

    // For each table, get the CREATE TABLE statement
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      console.log(`  📋 Extracting schema for: ${tableName}`);

      // Get columns
      const columnsResult = await sourcePool.query(`
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          column_default,
          is_nullable,
          udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // Get primary key
      const pkResult = await sourcePool.query(`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass
        AND i.indisprimary;
      `, [tableName]);

      // Get constraints
      const constraintsResult = await sourcePool.query(`
        SELECT
          con.conname,
          con.contype,
          pg_get_constraintdef(con.oid) as definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = $1
        AND con.contype IN ('f', 'c', 'u');
      `, [tableName]);

      // Build CREATE TABLE statement
      schema += `-- Table: ${tableName}\n`;
      schema += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n`;
      schema += `CREATE TABLE ${tableName} (\n`;

      const columns = [];
      for (const col of columnsResult.rows) {
        let columnDef = `  ${col.column_name} `;

        // Handle data type
        if (col.data_type === 'ARRAY') {
          columnDef += col.udt_name.replace('_', '') + '[]';
        } else if (col.data_type === 'character varying') {
          columnDef += `VARCHAR(${col.character_maximum_length || 255})`;
        } else if (col.data_type === 'USER-DEFINED') {
          columnDef += col.udt_name;
        } else {
          columnDef += col.data_type.toUpperCase();
          if (col.character_maximum_length) {
            columnDef += `(${col.character_maximum_length})`;
          }
        }

        // Handle default
        if (col.column_default) {
          // Skip identity sequences for SERIAL columns
          if (!col.column_default.includes('nextval')) {
            columnDef += ` DEFAULT ${col.column_default}`;
          } else if (col.column_default.includes('nextval')) {
            // It's a SERIAL column
            if (col.data_type === 'integer') {
              columnDef = `  ${col.column_name} SERIAL`;
            } else if (col.data_type === 'bigint') {
              columnDef = `  ${col.column_name} BIGSERIAL`;
            }
          }
        }

        // Handle nullable
        if (col.is_nullable === 'NO' && !col.column_default?.includes('nextval')) {
          columnDef += ' NOT NULL';
        }

        columns.push(columnDef);
      }

      // Add primary key
      if (pkResult.rows.length > 0) {
        const pkColumns = pkResult.rows.map(r => r.attname).join(', ');
        columns.push(`  PRIMARY KEY (${pkColumns})`);
      }

      schema += columns.join(',\n');
      schema += '\n);\n\n';

      // Add constraints
      for (const constraint of constraintsResult.rows) {
        if (constraint.contype === 'f') { // Foreign key
          schema += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.conname} ${constraint.definition};\n`;
        } else if (constraint.contype === 'c') { // Check constraint
          schema += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.conname} ${constraint.definition};\n`;
        } else if (constraint.contype === 'u') { // Unique constraint
          schema += `ALTER TABLE ${tableName} ADD CONSTRAINT ${constraint.conname} ${constraint.definition};\n`;
        }
      }
      schema += '\n';
    }

    // Get indexes
    console.log('  📊 Extracting indexes...');
    const indexesResult = await sourcePool.query(`
      SELECT
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      ORDER BY tablename, indexname;
    `);

    schema += '-- Indexes\n';
    for (const idx of indexesResult.rows) {
      schema += `${idx.indexdef};\n`;
    }
    schema += '\n';

    // Write to file
    const outputPath = path.join(__dirname, 'extracted-schema.sql');
    fs.writeFileSync(outputPath, schema);

    console.log('');
    console.log('✅ Schema extraction completed!');
    console.log(`📄 Schema saved to: ${outputPath}`);
    console.log('');

    await sourcePool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error extracting schema:', error);
    await sourcePool.end();
    process.exit(1);
  }
};

extractSchema();
