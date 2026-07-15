// Load libraries
const dotenv = require("dotenv").config();
const express = require("express");
const pm2 = require("pm2");
const path = require("path");
const fs = require("fs");
const fs_promises = require("fs").promises;
const sysinfo = require("systeminformation");
const multer = require("multer");
const adm_zip = require("adm-zip");
const cors = require("cors");
const os = require("os");

const app = express();

// Get the port to use
const port = process.env.SERVER_PORT;

// Use the static content
app.use(cors());
app.use(express.static(path.join(__dirname, "../client")));
app.use(express.static(path.join(__dirname, "../client", "scripts")));
app.use(express.static(path.join(__dirname, "../client", "style")));


// PM2 -------------------------------------------------------------------------------------------------------------------

// Connect to PM2 globally on startup to prevent connection reset errors
pm2.connect(function (err) {
  if (err) {
    console.error("Critical: Failed to connect to PM2 daemon", err);
    process.exit(2);
  }
});

// Funcion to start pm2 server

function StartPM2(ecosystem_file_path) {
  try {
    // Clear the cache so Node doesn't use an old version of the file
    delete require.cache[require.resolve(ecosystem_file_path)];
    
    // Read the ecosystem file into a JavaScript object
    const ecosystem_config = require(ecosystem_file_path);
    
    // Extract the app configuration (the first item in the apps array)
    const app_config = ecosystem_config.apps[0];

    // Pass the parsed object directly to PM2!
    pm2.start(app_config, function(err, apps) {
        if (err) {
          console.error("PM2 Start Error:", err);
          return pm2.disconnect();
        }
        console.log(`Server ${app_config.name} started successfully on port ${app_config.env.SERVER_PORT}`);
    });
    
  } catch (err) {
    console.error("Failed to read ecosystem file or start PM2:", err);
  }
}

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

// Dir validaton
app.get("/api/validate-server-dir", (req, res) => {
  const root_folder = req.query.root;
  const server_path = req.query.server_path;
  const full_path = path.join(os.homedir(), root_folder, server_path);
  const root_path = path.join(os.homedir(), root_folder);
  const ecosystem_path = path.join(os.homedir(), root_folder, "ecosystem.config.js");

  if (fs.existsSync(ecosystem_path)){
    return res.status(200).json({ message: "ecosystem exists"});
  }
  else if (fs.existsSync(full_path)){
    return res.status(200).json({ message: "valid" });
  }
  else if (fs.existsSync(root_path)){
    return res.status(404).json({ message: "server file not found"});
  }
  else{
    return res.status(404).json({ message: "root folder not found"});
  }
  return res.status(500).json({ message: "Something went wrong "});
});

// Create new server with new ecosystem config
app.post("/api/create-new-server-config", async (req, res) => {
  // Get rqeuest variables
  const root_folder = req.query.root;
  const server_path = req.query.server_path;
  const port = req.query.port;

  // Get the path of the file
  const ecosystem_path = path.join(os.homedir(), root_folder, "ecosystem.config.js");
  const current_working_directory = path.join(os.homedir(), root_folder);

  // Create template for the file
  const file_content = `module.exports = {
    apps: [
      {
        name: "${root_folder}",
        script: "${server_path}",
        cwd: "${current_working_directory}",
        env: {
          NODE_ENV: "production",
          SERVER_PORT: "${port}",
        },
      },
    ],
  };
  `;
  
  // Change port in env file if needed
  ChangeENVPort(root_folder, port);

  // Write to the file
  try{
    await fs_promises.writeFile(ecosystem_path, file_content);
    // Start the server
    StartPM2(ecosystem_path);
    res.status(200).json({ message: "Started server" });
  }
  catch (error){
    console.log(error);
    res.status(500).json({ error: "Failed to write to file" });
  }
});

// Create new server with existing ecosystem config
app.post("/api/create-new-server", async (req, res) => {
  try{
    const root_folder = req.query.root;
    const port = req.query.port;
    
    const ecosystem_path = path.join(os.homedir(), root_folder, "ecosystem.config.js");

    // Only change the port if there is a valid value
    if (port != -1){
      try{
        ChangeENVPort(root_folder, port);

        // Clear the require cache so an outdated version isnt read from memory
        delete require.cache[require.resolve(ecosystem_path)];
        
        // Load the file as a JavaScript object
        const config = require(ecosystem_path);
        
        // Update the port
        config.apps[0].env.SERVER_PORT = String(port);
        
        // Convert the object back into a module.exports string
        const updated_content = `module.exports = ${JSON.stringify(config, null, 2)};`;
        
        // Write to file
        await fs_promises.writeFile(ecosystem_path, updated_content, "utf8");
      }
      catch (err){
        console.log(err);
      }
    };

    StartPM2(ecosystem_path);
    res.status(200).json({ message: "created server" });
  }
  catch (err){
    console.log(err);
    res.status(500).json({ error: "something went wrong" });
  }
});

// Function to change port in env file
function ChangeENVPort(root_folder, new_port){
  try{
    // Check if the root has a .env file
    const env_path = path.join(os.homedir(), root_folder, ".env");
    if (fs.existsSync(env_path)){
      // Read the env file
      const env_data = fs.readFileSync(env_path, "utf8");
      // Loop through each file line
      let lines = env_data.split("\n");
      for (let i=0; i < lines.length; i++){
        if (lines[i].startsWith("SERVER_PORT=")){
          // Check if the server port has changed
          const current_port = Number(lines[i].split("=")[1]);
          if (new_port != current_port){
            // Set the new port
            lines[i] = `SERVER_PORT=${new_port}`;
          }
        } 
      }
      let updated_lines = lines.join("\n");
      // Write to the file
      fs.writeFileSync(env_path, updated_lines, "utf8")
    } 
  }
  catch (err){
      console.log(err);
    }
}

// Api to get the data from an ecosystem file
app.get("/api/get-ecosystem-config-data", (req, res) => {
  try {
    const file_location = req.query.file_location;
    
    if (!file_location) {
      return res.status(400).json({ error: "Missing file_location parameter" });
    }

    const file_path = path.join(os.homedir(), file_location, "ecosystem.config.js");

    delete require.cache[require.resolve(file_path)];

    const ecosystemData = require(file_path);

    const app_config = ecosystemData.apps[0]; 
    const server_name = app_config.name;
    const server_port = app_config.env.SERVER_PORT;

    // 5. Send it back to the client
    return res.status(200).json({ 
      name: server_name, 
      port: server_port 
    });

  } catch (error) {

    console.error("Failed to read ecosystem file:", error.message);
    
    if (error.code === 'MODULE_NOT_FOUND') {
      return res.status(404).json({ error: "Ecosystem file not found at this location." });
    }
    
    return res.status(500).json({ error: "Something went wrong while reading the config." });
  }
});
// SYSTEM INFORMATION ----------------------------------------------------------------------------------------------------

// Create cache varaibles to store the system information variables
let static_sysinfo = {};
let cached_sysinfo = {};

// Pair disk data from array
function PairDisks(diskData) {
    // Separate the raw data into two distinct arrays
    // Hardware has a 'name' property, partitions have an 'fs' property
    const hardware = diskData.filter(item => item.name);
    const partitions = diskData.filter(item => item.fs);
    
    const paired_drives = [];

    // Loop through each physical drive and find its matching partition
    hardware.forEach(drive => {
        let closest_partition = null;
        let smallest_difference = Infinity;

        partitions.forEach(partition => {
            // Calculate the size difference between the hardware and the partition
            const sizeDiff = Math.abs(drive.size - partition.size);
            
            // If this is the closest size match we've seen so far, save it
            if (sizeDiff < smallest_difference) {
                smallest_difference = sizeDiff;
                closest_partition = partition;
            }
        });

        // Push the matched pair into our final array
        paired_drives.push({
            name: drive.name,
            type: drive.type,
            mount_point: closest_partition.fs,
            total_size: drive.size,
            used_percent: closest_partition.use,
            available_space: closest_partition.available
        });
    });

    return paired_drives;
}

// Fetch static hardware data
async function initStaticData() {
  try {
    const system = await sysinfo.system();
    const bios = await sysinfo.bios();
    const os_info = await sysinfo.osInfo();
    const cpu = await sysinfo.cpu();
    const battery = await sysinfo.battery();

    static_sysinfo = {
      system: {
        manufacturer: system.manufacturer,
        model: system.model,
        bios_version: bios.version,
        bios_release_date: bios.releaseDate,
        os_platform: os_info.platform,
        os_distro: os_info.distro,
        os_build: os_info.build,
        os_kernel: os_info.kernel
      },
      cpu: {
        model: cpu.brand,
        cores: cpu.physicalCores,
        threads: cpu.cores,
        manufacturer: cpu.manufacturer,
      },
      battery: {
        has_battery: battery.hasBattery,
        max_capacity: battery.maxCapacity,
      }
    };
  } catch (error) {
    console.log(error);
  }
}

// Fetch dynamic data continuously
async function pollDynamicData() {
  try {
    const uptime = sysinfo.time().uptime;
    const cpu_temperature = await sysinfo.cpuTemperature();
    const cpu_load = await sysinfo.currentLoad();
    const memory = await sysinfo.mem();
    const battery = await sysinfo.battery();
    const graphics = await sysinfo.graphics();
    const processes = await sysinfo.processes();
    const all_disks = await sysinfo.diskLayout();
    const disk_sizes = await sysinfo.fsSize();
    const network = await sysinfo.networkInterfaces();
    const network_traffic = await sysinfo.networkStats();
    const wifi = await sysinfo.wifiNetworks();

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
    });

    disk_data = PairDisks(disk_data);

    let gpu_data = [];
    graphics.controllers.forEach(gpu => {
      const temp = {
        temperature: gpu.temperatureGpu,
        model: gpu.model,
        power_draw: gpu.powerDraw,
        clock: gpu.clockCore,
        memory: gpu.clockMemory,
      };
      gpu_data.push(temp);
    });

    let network_data = [];
    network.forEach(data => {
      const temp = {
        ip4: data.ip4,
        type: data.type,
        speed: data.speed,
      };
      network_data.push(temp);
    });

    let wifi_data = [];
    wifi.forEach(data => {
      const temp = {
        ssid: data.ssid,
        signal_level: data.signalLevel,
        quality: data.quality,
      };
      wifi_data.push(temp);
    });

    let network_traffic_data= [];
    network_traffic.forEach(data => {
      if (data.iface !== "lo") {
        const temp = {
          interface: data.iface,
          download_speed: (data.rx_sec / 1024 / 1024).toFixed(2),
          upload_speed: (data.tx_sec / 1024 / 1024).toFixed(2),
          total_downloaded: (data.rx_bytes / 1073741824).toFixed(2),
          total_uploaded: (data.tx_bytes / 1073741824).toFixed(2)
        };
        network_traffic_data.push(temp);
      }
    });

    // Update the global cache
    cached_sysinfo = {
      uptime: uptime,
      cpu: {
        ...static_sysinfo.cpu,
        temp: cpu_temperature.main,
        load: cpu_load.currentLoad,
      },
      memory: {
        total_memory: memory.total,
        free_memory: memory.free,
        available_memory: memory.available,
        buffers_cache_memory: memory.buffcache,
      },
      battery: {
        ...static_sysinfo.battery,
        current_capacity: battery.currentCapacity,
        is_charging: battery.isCharging,
        percent: battery.percent,
        designed_capacity: battery.designedCapacity,
      },
      system: static_sysinfo.system,
      graphics: gpu_data,
      processes: processes.all,
      disks: disk_data,
      network: network_data,
      wifi: wifi_data,
      network_traffic: network_traffic_data,
    };

    // Restart the polling loop
    setTimeout(pollDynamicData, 2000);
  } catch (error) {
    console.log(error);
    // Keep loop alive if error occurs
    setTimeout(pollDynamicData, 5000);
  }
}

// Get system information
app.get("/api/sysinfo", (req, res) => {
  // Check if cache is ready
  if (Object.keys(cached_sysinfo).length === 0) {
    return res.status(503).json({ error: "Server warming up..." });
  }
  
  res.status(200).json(cached_sysinfo);
});

// Initialize background workers
initStaticData().then(() => {
  pollDynamicData();
});

// MULTER (file manager) -------------------------------------------------------------------------------------------------

// Set up multer storage system
const storage = multer.diskStorage({
  // Set the destination for the file transfer
  destination: function(req, file, cb){
    let target_dir = req.query.dest;
    let final_path;
    if (target_dir){
      final_path = path.resolve(os.homedir(), target_dir);
    }
    else{
      final_path = path.resolve(os.homedir());
    } 

    if (!fs.existsSync(final_path)){
      fs.mkdirSync(final_path, { recursive: true });
    }

    cb(null, final_path);
  },
  // Set the name of the file
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Upload file api
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file){
    return res.status(400).send("No file to upload");
  }

  const file_path = req.file.path;
  const dest_folder = req.file.destination;

  if (req.file.mimetype == "application/zip" || req.file.originalname.endsWith(".zip")){
    try{
      const zip = new adm_zip(file_path);
      zip.extractAllTo(dest_folder, true);
      fs.unlinkSync(file_path);
      return res.json({ message: "Uploaded!" });
    }
    catch (err){
      return res.status(500).json({ error: "Failed to extract zip" });
    }
  }

  res.json({ message: "Transfer complete!", filename: req.file.filename });
});

app.use((err, req, res, next) => {
  if (err.message.startsWith("Access Denied")) {
    return res.statis(403).json({ error: err.message });
  }
  res.status(500).json({ error: err.message });
});

// Start the server on the given port
app.listen(port, function () {
  console.log("Running server on port:", port);
});