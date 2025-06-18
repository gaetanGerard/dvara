#!/usr/bin/env node

const { spawn } = require("child_process");
const http = require("http");

const BACKEND_PORT = 3000; // à adapter si besoin
const BACKEND_START_CMD = "npm --workspace apps/backend run start:dev";
const FRONTEND_START_CMD = "npm --workspace apps/frontend run start";

function waitForBackend(port, retries = 30, delay = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(
        { hostname: "localhost", port, path: "/", timeout: 1000 },
        (res) => {
          resolve();
        },
      );
      req.on("error", () => {
        if (++attempts >= retries) reject(new Error("Backend not ready"));
        else setTimeout(check, delay);
      });
    };
    check();
  });
}

function run(cmd) {
  const [command, ...args] = cmd.split(" ");
  return spawn(command, args, { stdio: "inherit", shell: true });
}

(async () => {
  const backend = run(BACKEND_START_CMD);
  try {
    await waitForBackend(BACKEND_PORT);
    run(FRONTEND_START_CMD);
  } catch (e) {
    console.error("Le backend ne répond pas, arrêt du script.");
    backend.kill();
    process.exit(1);
  }
})();
