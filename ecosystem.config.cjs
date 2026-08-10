module.exports = {
  apps: [
    {
      name: "fasylpmo-api",
      script: "backend/server.js",
      cwd: "/var/www/html/fasylpmo",
      env: {
        NODE_ENV: "production",
        PORT: 5002,
      },
      max_memory_restart: "500M",
      watch: true,
      ignore_watch: ["node_modules", "backend/uploads", "backend/prisma", "dist", ".git"],
    },
  ],
};
