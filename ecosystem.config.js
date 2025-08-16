module.exports = {
  apps: [{
    name: 'wavshare-api',
    cwd: './server',
    script: 'dist/index.js',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Environment file for production
    env_file: '.env.production'
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'wavshare.io',
      ref: 'origin/main',
      repo: 'https://github.com/maxwharris/wavshare.io.git',
      path: '/home/ubuntu/remixthis',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build:prod && npm run migrate:prod && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
