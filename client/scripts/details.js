
// Get elemements 

// Cpu
let cpu_model_p = document.getElementById("cpu-model");
let cpu_cores_p = document.getElementById("cpu-cores");
let cpu_load_p = document.getElementById("cpu-load");
let cpu_temp_p = document.getElementById("cpu-temp");
let cpu_load_prog = document.getElementById("cpu-load-progress");
let cpu_temp_prog = document.getElementById("cpu-temp-progress");

// Mem
let mem_usage_p = document.getElementById("mem-usage");
let mem_usage_prog = document.getElementById("mem-usage-progress");
let total_mem_p = document.getElementById("total-memory");
let used_mem_p = document.getElementById("used-memory");

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
    ShowData();
}

function BytesToGB(val){
    return (val / (1024*1024*1024)).toFixed(1);
}

// Insert data into elements
function ShowData(){
    // CPU
    cpu_model_p.innerText = `${details_data.cpu.manufacturer} ${details_data.cpu.model}`;
    cpu_cores_p.innerText = `${details_data.cpu.cores}C, ${details_data.cpu.threads}T`;
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
}

async function PollServer(){
    await HandleData();
    setTimeout(PollServer, 1000);
}

PollServer();