module.exports = {
  apps: [
    {
      name: "happylife-frontend",
      cwd: "./",
      script: "node_modules/vite/bin/vite.js",
      args: "dev --host --port 5175"
    },
    {
      name: "happylife-backend",
      cwd: "./server",
      script: "index.js",
      env: {
        PORT: 3011
      }
    }
  ]
};
