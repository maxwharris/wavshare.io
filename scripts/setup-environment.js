#!/usr/bin/env node

/**
 * Environment Setup Script for RemixThis
 * 
 * This script helps set up environment configurations for different deployment scenarios.
 * Usage: node scripts/setup-environment.js [development|production]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 RemixThis Environment Setup\n');
  
  const environment = process.argv[2] || await question('Environment (development/production): ');
  
  if (!['development', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use "development" or "production"');
    process.exit(1);
  }

  console.log(`\n📝 Setting up ${environment} environment...\n`);

  if (environment === 'production') {
    await setupProduction();
  } else {
    await setupDevelopment();
  }

  console.log('\n✅ Environment setup complete!');
  console.log('\n📚 Next steps:');
  console.log('1. Review the generated .env files');
  console.log('2. Update placeholder values with your actual configuration');
  console.log('3. Run the application with the appropriate environment');
  console.log('\nFor more details, see ENVIRONMENT_SETUP.md');
  
  rl.close();
}

async function setupDevelopment() {
  console.log('🔧 Development environment detected');
  console.log('✅ Development configuration is already set up');
  console.log('📁 Files: client/.env.development, server/.env.development');
}

async function setupProduction() {
  console.log('🏭 Production environment setup');
  
  const domain = await question('Enter your domain (e.g., myapp.com): ');
  const dbType = await question('Database type (postgresql/mysql): ');
  
  let dbUrl = '';
  if (dbType === 'postgresql') {
    const dbHost = await question('Database host: ');
    const dbPort = await question('Database port (5432): ') || '5432';
    const dbName = await question('Database name: ');
    const dbUser = await question('Database username: ');
    const dbPass = await question('Database password: ');
    dbUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  } else if (dbType === 'mysql') {
    const dbHost = await question('Database host: ');
    const dbPort = await question('Database port (3306): ') || '3306';
    const dbName = await question('Database name: ');
    const dbUser = await question('Database username: ');
    const dbPass = await question('Database password: ');
    dbUrl = `mysql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  }

  const jwtSecret = await question('JWT Secret (leave empty to generate): ') || generateRandomSecret();
  
  // Update client production config
  updateClientProductionConfig(domain);
  
  // Update server production config
  updateServerProductionConfig(domain, dbUrl, jwtSecret);
  
  console.log('\n✅ Production configuration updated');
  console.log('⚠️  Remember to:');
  console.log('- Set up SSL certificates');
  console.log('- Configure email service');
  console.log('- Set up monitoring and logging');
  console.log('- Run database migrations');
}

function updateClientProductionConfig(domain) {
  const configPath = path.join(__dirname, '../client/.env.production');
  let config = fs.readFileSync(configPath, 'utf8');
  
  config = config.replace(/YOUR_DOMAIN\.com/g, domain);
  
  fs.writeFileSync(configPath, config);
  console.log('📝 Updated client/.env.production');
}

function updateServerProductionConfig(domain, dbUrl, jwtSecret) {
  const configPath = path.join(__dirname, '../server/.env.production');
  let config = fs.readFileSync(configPath, 'utf8');
  
  config = config.replace(/YOUR_DOMAIN\.com/g, domain);
  config = config.replace(/postgresql:\/\/username:password@YOUR_DOMAIN\.com:5432\/remixthis_prod/, dbUrl);
  config = config.replace(/CHANGE_THIS_TO_A_STRONG_RANDOM_SECRET_IN_PRODUCTION/, jwtSecret);
  
  fs.writeFileSync(configPath, config);
  console.log('📝 Updated server/.env.production');
}

function generateRandomSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Handle script execution
if (require.main === module) {
  setupEnvironment().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupEnvironment };
