const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '..', 'database', 'remixthis.db');

console.log('Adding coverArt column to posts table...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database.');
});

// Add the coverArt column
db.run('ALTER TABLE posts ADD COLUMN coverArt TEXT', (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column coverArt already exists.');
    } else {
      console.error('Error adding column:', err.message);
      process.exit(1);
    }
  } else {
    console.log('Successfully added coverArt column to posts table.');
  }
  
  // Close the database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
});
