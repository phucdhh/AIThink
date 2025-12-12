module.exports = {
  apps: [
    {
      name: 'aithink-backend',
      cwd: '/Users/mac/AIThink/backend',
      script: 'src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/Users/mac/AIThink/logs/backend-error.log',
      out_file: '/Users/mac/AIThink/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'aithink-frontend',
      cwd: '/Users/mac/AIThink/frontend',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 5173',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/Users/mac/AIThink/logs/frontend-error.log',
      out_file: '/Users/mac/AIThink/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
