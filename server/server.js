// Load libraries
const dotenv = require("dotenv").config();
const express = require("express");
const pm2 = require("pm2");
const path = require("path");
const fs = require("fs/promises");
const sysinfo = require("systeminformation");
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
  pm2.describe(id, (err, process_description) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch process" });
    }

    // Check if the process actually exists
    if (!process_description || process_description.length === 0) {
      return res.status(404).json({ error: "Process not found" });
    }

    // Return the raw data
    res.json(process_description[0]);
  });
});

// Start a server
// This needs the path of the server script to start!
app.post("/api/process/:id/start", async (req, res) => {
  
});

// Stop a server
app.post("/api/process/:id/stop", (req, res) => {
  const pm2_id = parseInt(req.params.id);
  // Use pm2 function to stop the server
  pm2.stop(pm2_id, (error) => {
    // Check if there is an error
    if (error){
      console.log(error);
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
    }
  });
  res.status(200);
});

// Get system information
app.get("/api/sysinfo", async (req, res) => {
  try{
    const uptime = sysinfo.time().uptime;
    const system = await sysinfo.system();
    const bios = await sysinfo.bios();
    const cpu = await sysinfo.cpu();
    const cpu_temperature = await sysinfo.cpuTemperature();
    const memory = await sysinfo.mem();
    const battery = await sysinfo.battery();
    const graphics = await sysinfo.graphics();
    const os_info = await sysinfo.osInfo();
    const cpu_load = await sysinfo.currentLoad();
    const processes = await sysinfo.processes();
    const all_disks = await sysinfo.diskLayout();
    const disk_sizes = await sysinfo.fsSize();

    let disk_data = [];
    all_disks.forEach(disk => {
      const temp = {
          name: disk.name,
          size: disk.size,
          status: disk.smartStatus,
          temperature: disk.temperature,
          type: disk.type,
      };
      disk_data.push(temp);
    });

    disk_sizes.forEach(disk => {
      const temp = {
        available: disk.available,
        fs: disk.fs,
        size: disk.size,
        use: disk.use
      };
      disk_data.push(temp);
    })

    let system_data = {
      manufacturer: system.manufacturer,
      model: system.model,
      bios_version: bios.version,
      bios_release_date: bios.releaseDate,
      os_platform: os_info.platform,
      os_distro: os_info.distro,
      os_build: os_info.build,
      os_kernel: os_info.kernel
    };

    let battery_data = {
      has_battery: battery.hasBattery,
      current_capacity: battery.currentCapacity,
      max_capacity: battery.maxCapacity,
      is_charging: battery.isCharging,
      percent: battery.percent,
    }

    let memory_data = {
      total_memory: memory.total,
      free_memory: memory.free,
    }

    let cpu_data = {
      temp: cpu_temperature.main,
      brand: cpu.brand,
      cores: cpu.cores,
      manufacturer: cpu.manufacturer,
      load: cpu_load.currentLoad,
    }

    let gpu_data = []
    graphics.controllers.forEach(gpu => {
      const temp = {
        temparature: gpu.temperatureGpu,
        model: gpu.model,
        power_draw: gpu.powerDraw,
        clock: gpu.clockCore,
        memory: gpu.clockMemory,
      }
      gpu_data.push(temp);
    })

    res.status(200);
    res.json({
      uptime: uptime,
      cpu: cpu_data,
      memory: memory_data,
      battery: battery_data,
      system: system_data,
      graphics: gpu_data,
      processes: processes.all,
      disks: disk_data,
    });
  } 
  catch (error){
    console.log(error);
    res.status(500);
  }
});

// Start the server on the given port
app.listen(port, function () {
  console.log("Running server on port:", port);
});
