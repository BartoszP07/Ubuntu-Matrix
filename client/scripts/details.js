
// Get elemements 

// Top bar
let uptime_p = document.getElementById("uptime-txt");
let processes_p = document.getElementById("processes-txt");

// Cpu
let cpu_model_p = document.getElementById("cpu-model");
let cpu_cores_p = document.getElementById("cpu-cores");
let cpu_threads_p = document.getElementById("cpu-threads");
let cpu_load_p = document.getElementById("cpu-load");
let cpu_temp_p = document.getElementById("cpu-temp");
let cpu_load_prog = document.getElementById("cpu-load-progress");
let cpu_temp_prog = document.getElementById("cpu-temp-progress");

// Mem
let mem_usage_p = document.getElementById("mem-usage");
let mem_usage_prog = document.getElementById("mem-usage-progress");
let total_mem_p = document.getElementById("total-memory");
let used_mem_p = document.getElementById("used-memory");

// Network
let network_ip4 = document.getElementById("network-ip4");
let network_type = document.getElementById("network-type");
let network_ssid = document.getElementById("network-ssid");
let network_quality = document.getElementById("network-quality");
let network_signal = document.getElementById("network-signal");
let network_download = document.getElementById("network-download");
let network_upload = document.getElementById("network-upload");
let network_total_download = document.getElementById("network-total-download");
let network_total_upload = document.getElementById("network-total-upload");

// Power
let max_capacity = document.getElementById("max-capacity");
let current_capacity = document.getElementById("current-capacity");
let charging_txt = document.getElementById("charging-txt");
let battery_percent = document.getElementById("battery-percent");
let battery_percent_prog = document.getElementById("battery-percent-progress")
let battery_health = document.getElementById("battery-health");
let battery_health_prog = document.getElementById("battery-health-progress");

let details_data = {};
let update_data = false;

// Get data from server
async function GetDetails(){
    update_data = false;
    try{
        const response = await fetch("/api/sysinfo");
        const data = await response.json();
        if (response.ok) {
            details_data = data;
            update_data = true;
        }
    }
    catch (err){
        console.log(err);
    }
}

// Format and update data
async function HandleData(){
    await GetDetails();

    if (!update_data) { return; }
    // Convert seconds to ms
    const uptime = FormatUptime(details_data.uptime*1000);
    const manufacturer = details_data.manufacturer;
    const model = details_data.model;
    console.log(details_data);

    details_data.uptime = uptime;
    details_data.cpu.load = Math.round(Number(details_data.cpu.load));
    if (details_data.cpu.temp == undefined || details_data.cpu.temp == null || details_data.cpu.temp == "null"){
        details_data.cpu.temp = "N/A";
    }
    else{
        details_data.cpu.temp = Math.round(Number(details_data.cpu.temp));
    }  

    // Go through each network and get the correct one
    let network_hardware = {}
    details_data.network.forEach(data => {
        if (data.ip4.includes("192.168")) {
            network_hardware = data;
        }
    });
    details_data.network = network_hardware;
    details_data.network_traffic = details_data.network_traffic[0];
    // Go through each wifi signal and get the one with the best signal level
    let wifi_hardware = {}
    let quality = 0;
    details_data.wifi.forEach(data => {
        if (data.quality > quality) {
            quality = data.quality;
            wifi_hardware = data;
        }
    });
    details_data.wifi = wifi_hardware;

    ShowData();
}

function BytesToGB(val){
    return (val / (1024*1024*1024)).toFixed(1);
}

// Insert data into elements
function ShowData(){
    // Top bar
    const uptime_str = `${details_data.uptime.days}d:${details_data.uptime.hours}h:${details_data.uptime.minutes}m:${details_data.uptime.seconds}s`
    uptime_p.innerText = `Uptime: ${uptime_str}`
    processes_p.innerText = `Processes: ${details_data.processes}`;

    // CPU
    cpu_model_p.innerText = `${details_data.cpu.manufacturer} ${details_data.cpu.model}`;
    cpu_cores_p.innerText = `${details_data.cpu.cores} Cores`;
    cpu_threads_p.innerText = `${details_data.cpu.threads} Threads`;
    cpu_temp_p.innerText = `${details_data.cpu.temp}°`;
    cpu_load_p.innerText = `${details_data.cpu.load}%`;

    if (details_data.cpu.temp != "N/A"){
        cpu_temp_prog.style.background = `conic-gradient(var(--accent-colour) ${
            details_data.cpu.temp * 3.6
        }deg, black 0deg)`
    }
 
    cpu_load_prog.style.background = `conic-gradient(var(--accent-colour) ${
            details_data.cpu.load * 3.6
        }deg, black 0deg)`;

    // MEMORY
    const free_mem = BytesToGB(details_data.memory.free_memory);
    const total_mem = BytesToGB(details_data.memory.total_memory)
    const used_mem = (total_mem - free_mem).toFixed(1);
    const mem_usage = (used_mem / total_mem) * 100
    mem_usage_p.innerText = `${Math.round(mem_usage)}%`
    mem_usage_prog.style.background = `conic-gradient(var(--accent-colour) ${
            mem_usage * 3.6
        }deg, black 0deg)`;
    total_mem_p.innerText = `Total: ${total_mem}GB`;
    used_mem_p.innerText = `Used: ${used_mem}GB`    

    // Network
    network_ip4.innerText = `Ip4: ${details_data.network.ip4}`;
    network_type.innerText = `Type: ${details_data.network.type}`;
    network_ssid.innerText = `SSID: ${details_data.wifi.ssid}`;
    network_quality.innerText = `Quality: ${details_data.wifi.quality}`;
    network_signal.innerText = `Signal: ${details_data.wifi.signal_level}`;
    network_download.innerText = `Down: ${details_data.network_traffic.download_speed}MB/s`;
    network_upload.innerText = `Up: ${details_data.network_traffic.upload_speed}MB/s`;
    network_total_download.innerText = `Down: ${details_data.network_traffic.total_downloaded}GB/s`;
    network_total_upload.innerText = `Up: ${details_data.network_traffic.total_uploaded}GB/s`;

    // Power
    max_capacity.innerText = `Max: ${(details_data.battery.max_capacity/1000).toFixed(1)}Wh`;
    current_capacity.innerText = `Current: ${(details_data.battery.current_capacity/1000).toFixed(1)}Wh`;
    charging_txt.innerText = `Charging: ${details_data.battery.is_charging}`;
    battery_percent.innerText = `${details_data.battery.percent}%`;
    battery_percent_prog.style.background = `conic-gradient(var(--accent-colour) ${
            details_data.battery.percent * 3.6
        }deg, black 0deg)`;
    const health = Math.round(details_data.battery.max_capacity / details_data.battery.designed_capacity) * 100 || 0;
    console.log(health);
    console.log(details_data.battery.max_capacity, details_data.battery.designed_capacity)
    battery_health.innerText = `${health}%`;
    battery_health_prog.style.background = `conic-gradient(var(--accent-colour) ${
            health * 3.6
        }deg, black 0deg)`;
}

async function PollServer(){
    await HandleData();
    setTimeout(PollServer, 1000);
}

PollServer();