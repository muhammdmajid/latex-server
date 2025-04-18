module.exports = {
    apps: [
      {
        name: 'latex-server',
        script: 'src/index.js',
        instances: 'max',
        exec_mode: 'cluster',
        watch: true,
        env: {
          NODE_ENV: 'development',
          PORT: 3000,
        },
        env_production: {
          NODE_ENV: 'production',
          PORT: 3000,
        },
      },
    ],
  };
  