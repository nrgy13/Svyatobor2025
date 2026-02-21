module.exports = {
  apps: [
    {
      name: 'svyatobor-landing',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      cwd: '/var/www/html',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/svyatobor-error.log',
      out_file: '/var/log/svyatobor-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ]
}
