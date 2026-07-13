module.exports = {
  apps: [
    {
      name: "Ubuntu-Matrix",
      script: "server/server.js",
      cwd: "/home/bpio07/Ubuntu-Matrix",
      env: {
        NODE_ENV: "production",
        SERVER_PORT: "2000",
      },
    },
  ],
};
