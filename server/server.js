// Load libraries
const dotenv = require("dotenv").config();
const express = require("express");
const pm2 = require("pm2");
const path = require("path");
const app = express();

// Get the port to use
const port = process.env.SERVER_PORT;

// Use the static content
app.use(express.static(path.join(__dirname, "../client")));

// Connect to PM2 globally on startup to prevent connection reset errors
pm2.connect(function (err) {
  if (err) {
    console.error("Critical: Failed to connect to PM2 daemon", err);
    process.exit(2);
  }
  console.log("Connected to PM2 daemon.");
});

// Api to get pm2 information
app.get("/api/get-pm2-data", function (req, res) {
  pm2.list(function (error, processes) {
    if (error) {
      console.log("error");
      return res.status(500).json({ error: "Failed to fetch PM2 data" });
    }

    const server_stats = processes.map((proc) => {
      const port =
        (proc.pm2_env.env && proc.pm2_env.env.SERVER_PORT) ||
        proc.pm2_env.SERVER_PORT ||
        "N/A";

      return {
        name: proc.name,
        port: port,
        status: proc.pm2_env.status,
        cpu: proc.monit.cpu,
        memory: proc.monit.memory,
        uptime: proc.pm2_env.uptime,
        pm_id: proc.pm_id,
      };
    });

    // Chained status and json to ensure headers are sent correctly
    res.status(200).json(server_stats);
  });
});

// API to get the data of a single server
app.get("/api/process/:id", (req, res) => {
  const id = parseInt(req.params.id);

  // Using pm2.describe to get the full process details
  pm2.describe(id, (err, processDescription) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch process" });
    }

    // Check if the process actually exists
    if (!processDescription || processDescription.length === 0) {
      return res.status(404).json({ error: "Process not found" });
    }

    // Return the raw object directly
    res.json(processDescription[0]);
  });
});

// Helper function to handle PM2 actions to keep code dry
const runPm2Action = (action, id, res) => {
  // Execute the action (start/stop/restart) directly without reconnecting
  pm2[action](id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, message: `Process ${id} ${action}ed` });
  });
};

// 1. START (Resumes a stopped process)
app.post("/api/process/:id/start", (req, res) => {
  runPm2Action("start", parseInt(req.params.id), res);
});

// 2. STOP
app.post("/api/process/:id/stop", (req, res) => {
  runPm2Action("stop", parseInt(req.params.id), res);
});

// 3. RESTART
app.post("/api/process/:id/restart", (req, res) => {
  runPm2Action("restart", parseInt(req.params.id), res);
});

// Start the server on the given port
app.listen(port, function () {
  console.log("Running server on port:", port);
});
