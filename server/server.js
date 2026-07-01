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
});

// Api to get pm2 information
app.get("/api/get-pm2-data", (req, res) => {
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

    // Return the raw data
    res.json(processDescription[0]);
  });
});

// Start a server
// This needs the path of the server script to start!
app.post("/api/process/:id/start", (req, res) => {
  const pm2_id = parseInt(req.params.id);

  console.log(__dirname);

  // Use pm2 function to start the server
  pm2.start(pm2_id, (error) => {
    // Check if there is an error
    if (error){
      console.log(error);
      return pm2.disconnect();
    } 
  });
  res.status(200);
});

// Stop a server
app.post("/api/process/:id/stop", (req, res) => {
  const pm2_id = parseInt(req.params.id);
  // Use pm2 function to stop the server
  pm2.stop(pm2_id, (error) => {
    // Check if there is an error
    if (error){
      console.log(error);
      return pm2.disconnect();
    }
  });
  res.status(200);
});

// Restart a server
app.post("/api/process/:id/restart", (req, res) => {
  const pm2_id = parseInt(req.params.id);
  // Use pm2 function to restart the server
  pm2.restart(pm2_id, (error) => {
    // Check if there is an error
    if (error){
      console.log(error);
      return pm2.disconnect();
    }
  });
  res.status(200);
});

// Delete a server
app.post("/api/process/:id/delete", (req, res) => {
  const pm2_id = parseInt(req.params.id);
  // Use pm2 function to delete a server
  pm2.delete(pm2_id, (error) => {
    // Check if there is an error
    if (error){
      console.log(error);
      return pm2.disconnect();
    }
  });
  res.status(200);
})

// Start the server on the given port
app.listen(port, function () {
  console.log("Running server on port:", port);
});
