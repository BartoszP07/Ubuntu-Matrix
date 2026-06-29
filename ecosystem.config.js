module.exports = {
  apps: [
    {
      name: "Ubuntu-Matrix",
      script: "server/server.js",
      env: {
        NODE_ENV: "production",
        SERVER_PORT: "2000",
      },
    },
  ],
};
