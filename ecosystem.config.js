module.exports = {
  apps: [
    {
      name: "website",
      script: "bun",
      args: "run start",
      cwd: "/home/github-runner/actions-runner/_work/map/map/apps/website",
      env: { NODE_ENV: "production" },
    },
    {
      name: "dashboard",
      script: "bun",
      args: "run start",
      cwd: "/home/github-runner/actions-runner/_work/map/map/apps/dashboard",
      env: { NODE_ENV: "production" },
    },
    {
      name: "express",
      script: "bun",
      args: "run serve",
      cwd: "/home/github-runner/actions-runner/_work/map/map/apps/express",
      env: { NODE_ENV: "production" },
    },
  ],
};
