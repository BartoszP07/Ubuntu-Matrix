
// Get elemements 

let get_details_btn = document.getElementById("get-details-button");
let details_p = document.getElementById("system-details");

let cpu_model_p = document.getElementById("cpu-model");
let cpu_cores_p = document.getElementById("cpu-cores");
let cpu_load_p = document.getElementById("cpu-load");
let cpu_temp_p = document.getElementById("cpu-temp");
let cpu_load_prog = document.getElementById("cpu-load-progress");
let cpu_temp_prog = document.getElementById("cpu-temp-progress");

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

// Insert data into elements
function ShowData(){
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
        }deg, black 0deg)`
}

async function PollServer(){
    await HandleData();
    setTimeout(PollServer, 1000);
}

PollServer();