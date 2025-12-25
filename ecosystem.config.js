module.exports = {
  apps: [{
    name: 'aura-papers-api',
    cwd: '/var/www/aura-papers/server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/aura-papers-error.log',
    out_file: '/var/log/pm2/aura-papers-out.log',
    log_file: '/var/log/pm2/aura-papers-combined.log',
    time: true
  }]
};
