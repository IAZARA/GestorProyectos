module.exports = {
  apps: [
    {
      name: 'gestor-proyectos',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        WS_PORT: 3001
      },
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};