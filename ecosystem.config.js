module.exports = {
  apps: [
    {
      name: 'aithink-backend',
      cwd: '/Users/mac/AIThink/backend',
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5172,
        MAX_CONCURRENT_REQUESTS: 6,
        PATH: '/Library/TeX/texbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
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
    },
    {
      name: 'aithink-tunnel',
      script: 'cloudflared',
      args: 'tunnel --config /Users/mac/.cloudflared/config-aithink.yml run',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '100M',
      error_file: '/Users/mac/AIThink/logs/tunnel-error.log',
      out_file: '/Users/mac/AIThink/logs/tunnel-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};
