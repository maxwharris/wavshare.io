const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the server database
const dbPath = path.join(__dirname, '..', 'server', 'database', 'remixthis.db');

console.log('Checking server database schema...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the server SQLite database.');
});

// Check posts table structure
db.all("PRAGMA table_info(posts)", (err, columns) => {
  if (err) {
    console.error('Error getting posts table info:', err.message);
  } else {
    console.log('\nPosts table columns:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    const hasCoverArt = columns.some(col => col.name === 'coverArt');
    console.log(`\nCoverArt column exists: ${hasCoverArt}`);
  }
  
  db.close();
});
