const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'database', 'remixthis.db');

console.log('Inspecting database schema...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Get all table names
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err.message);
    return;
  }
  
  console.log('\nTables found:');
  tables.forEach(table => {
    console.log(`- ${table.name}`);
  });
  
  // Get schema for each table
  let completed = 0;
  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
      if (err) {
        console.error(`Error getting schema for ${table.name}:`, err.message);
      } else {
        console.log(`\n${table.name} columns:`);
        columns.forEach(col => {
          console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
        });
      }
      
      completed++;
      if (completed === tables.length) {
        db.close();
      }
    });
  });
});
