module.exports = {
  apps: [
    {
      name: "wasypro",
      script: "server.cjs",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
