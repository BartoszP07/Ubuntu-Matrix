
// Load libraries
const dotenv = require('dotenv').config();
const express = require("express");
const pm2 = require("pm2");
const path = require("path");
const app = express();

// Get the port to use
const port = process.env.SERVER_PORT;

// Use the static content
app.use(express.static(path.join(__dirname, "../client")));

// Api to get pm2 information
app.get("/api/get-pm2-data", function(req, res){
    pm2.list(function(error, processes){
        if (error){
            console.log("error");
            return res.status(500).json({ error: "Failed to fetch PM2 data" });
        }

        const server_stats = processes.map(proc => {
            
            const port = (proc.pm2_env.env && proc.pm2_env.env.SERVER_PORT) 
                 || proc.pm2_env.SERVER_PORT 
                 || "N/A";

            return {
                name: proc.name,
                port: port,
                status: proc.pm2_env.status,
                cpu: proc.monit.cpu,
                memory: proc.monit.memory,
                uptime: proc.pm2_env.uptime,
                pm_id: proc.pm_id
            };
        });

        res.json(server_stats);
        res.status(200);
    })
})

// Start the server on the given port
app.listen(port, function(){
    console.log("Running server on port:", port)
})