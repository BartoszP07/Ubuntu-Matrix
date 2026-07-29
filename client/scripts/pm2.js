
// Get elements

// Handle the server cards
let pm2_cards_div = document.getElementById("pm2-cards");
let add_server_card = document.getElementById("add-server-card");
let statuses = ["online", "stopped", "errored", "launching", "stopping"];
let pm2_servers = []

// Get all the card edit buttons -- also gotten in when the new cards are made
let edit_server_buttons;

// Get the overlays
let overlay_shadow = document.getElementById("overlay-shadow");
let edit_server_overlay = document.getElementById("edit-server-overlay");

// Get other elements
let close_server_overlay_button = document.getElementById(
  "close-edit-server-overlay-button",
);

// Server control buttons
const server_stop_btn = document.getElementById("stop-edit-server-overlay-button");
const server_start_btn = document.getElementById("start-edit-server-overlay-button");
const server_restart_btn = document.getElementById("restart-edit-server-overlay-button");
const server_delete_btn = document.getElementById("delete-edit-server-overlay-button");

//  Elements for creating new server
let new_server_btn = document.getElementById("new-server-button");
let new_server_overlay = document.getElementById("new-server-overlay");
let close_new_server_btn = document.getElementById("close-new-server-overlay-button");
let check_new_server_btn = document.getElementById("check-new-server-overlay-button");
let create_new_server_btn = document.getElementById("create-new-server-overlay-button");
let create_ecosystem_checkbox = document.getElementById("ecosystem-checkbox");
let port_input = document.getElementById("port-number-input");
let port_input_info = document.getElementById("port-number-input-info");
let root_folder_input = document.getElementById("root-folder-input");
let root_folder_input_info = document.getElementById("root-folder-input-info");
let server_file_location_input = document.getElementById("server-file-location-input");
let server_file_location_input_info = document.getElementById("server-file-location-input-info");
let eco_file_location_input = document.getElementById("ecosystem-file-location-input");
let create_ecosystem_div = document.getElementById("create-ecosystem-file-div");
let existing_ecosystem_div = document.getElementById("existing-ecosystem-file-div");
let load_ecosystem_file_btn = document.getElementById("load-ecosystem-file-btn");
let eco_server_name = document.getElementById("ecosystem-server-name");
let eco_server_port = document.getElementById("ecosystem-server-port");
let new_port_input = document.getElementById("new-port-input");
let change_port_text = document.getElementById("change-port-text");
let change_port_button = document.getElementById("change-port-button");
let change_port_info_p = document.getElementById("change-port-info-text");

// Variables
let current_server = undefined;
let current_server_id = undefined;
let ports_in_use = [];
let allow_create_server = false;

// Main program  --------------------------------------------------------------------

// Function to create the server card
function CreateServerCard(name, port, status, pm_id){
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const port_elem = document.createElement("p");
    const status_div = document.createElement("div");
    const status_txt = document.createElement("p");
    const status_circle = document.createElement("div");
    const edit_btn = document.createElement("button");

    // Add classes
    card.classList.add("server-card");
    title.classList.add("pm2-card-name");
    port_elem.classList.add("pm2-card-port");
    status_div.classList.add("status");
    status_circle.classList.add("status-circle");
    edit_btn.classList.add("edit-server-button");

    // Check the status of the server
    ChangeStatusIndicator(status_circle, status);

    // Add text
    title.textContent = name;
    port_elem.textContent = `Port: ${port}`;
    status_txt.textContent = "Status:";
    edit_btn.textContent = "Manage";

    // Add all the elements to the card
    card.appendChild(title);
    card.appendChild(port_elem);
    status_div.appendChild(status_txt);
    status_div.appendChild(status_circle);
    card.appendChild(status_div);
    card.appendChild(edit_btn);

    // Add the pm id to the card
    card.dataset.pm_id = pm_id;

    // Return the card
    return card;
}

// Function to change the class of the colour state indicator
function ChangeStatusIndicator(element, status) {
    // Remove all status classes
    statuses.forEach((status) => {
        element.classList.remove(status);
    });
    // Change the status indicator
    if (status == "stopped") {
        element.classList.add("offline");
    } else if (status == "online") {
        element.classList.add("online");
    } else if (status == "errored") {
        element.classList.add("errored");
    } else if (status == "launching") {
        element.classList.add("launching");
    } else if (status == "stopping") {
        element.classList.add("stopping");
    }
}

// Function to get data from the pm2 servers
async function GetPM2Data(){
    try {
      let response = await fetch("/api/get-pm2-data");
      pm2_servers = await response.json();

      // Remove all existing cards
      Array.from(pm2_cards_div.children).forEach((child) => {
        if (child != add_server_card) {
          child.remove();
        }
      });

      ports_in_use = [];
      // Add each server to the card div
      pm2_servers.forEach((server) => {
        const server_port = server.port;
        const server_name = server.name;
        const server_status = server.status;
        const server_id = server.pm_id;
        const card = CreateServerCard(
          server_name,
          server_port,
          server_status,
          server_id,
        );
        pm2_cards_div.appendChild(card);
        ports_in_use.push(Number(server_port));
      });
        // Get all edit buttons from the cards
        edit_server_buttons =
            document.getElementsByClassName("edit-server-button");
        // Make the buttons an array
        edit_server_buttons = Array.from(edit_server_buttons);

        // Loop through all buttons
        edit_server_buttons.forEach((button) => {
            button.addEventListener("click", function (event) {
            if (!overlay_shadow.classList.contains("appear")) {
                overlay_shadow.classList.add("appear");
            }
            if (!edit_server_overlay.classList.contains("appear")) {
                edit_server_overlay.classList.add("appear");
            }
            GetCurrentServer(event);
            });
        });
    } 
    catch (error) {
        console.log(error);
    }
}

// Update pm2 server cards every second
setInterval(GetPM2Data, 1000);

// Handle editing a server ----------------------------------------------------------

function CloseServerOverlay(){
    overlay_shadow.classList.remove("appear");
    edit_server_overlay.classList.remove("appear");
    current_server = undefined;
    current_server_id = undefined;
}

// Close the server overlay
close_server_overlay_button.addEventListener("click", CloseServerOverlay);

// Function to get the current server for the overlay
function GetCurrentServer(event){
    if (!current_server) {
        // Get the card from the button
        const card = event.target.closest(".server-card");
        if (!card) { return; }
        // Get the pm2 server id
        current_server_id = card.dataset.pm_id;

        // Get the current server
        pm2_servers.forEach((server) => {
        
        if (current_server_id != server.pm_id) { return; }
        else { current_server = server; }

        });
    }
}

// Function to get the data from the server to display the pm2 server info
async function LoadServerOverlayData(){
    if (!current_server || !current_server_id) { return; }
    let data;
    try{
        const response = await fetch(`api/process/${current_server_id}`);
        data = await response.json();
    }
    catch (error){
        console.log(error);
    }

    // Get server data
    console.log(data.pm2_env.SERVER_PORT);
    console.log(data.pm2_env);
    const server_status = data.pm2_env.status;
    const server_name = data.name;
    const server_port = data.pm2_env.SERVER_PORT;
    const server_cpu = data.monit.cpu;
    const server_mem = FormatMemory(data.monit.memory);
    const server_uptime = FormatUptime(Date.now() - data.pm2_env.pm_uptime);
    const uptime_str = `${server_uptime.days}D : ${server_uptime.hours}H : ${server_uptime.minutes}M : ${server_uptime.seconds}S`
    // Get overlay elements
    const server_overlay_status = document.getElementById("server-overlay-status")
    const server_overlay_name = document.getElementById("server-overlay-name");
    const server_overlay_port = document.getElementById("server-overlay-port");
    const server_overlay_cpu = document.getElementById("server-overlay-cpu");
    const server_overlay_mem = document.getElementById("server-overlay-mem");
    const server_overlay_uptime = document.getElementById("server-overlay-uptime");

    server_overlay_name.textContent = server_name;
    server_overlay_port.textContent = `${server_port}`
    server_overlay_status.textContent = `${server_status}`;
    server_overlay_cpu.textContent = `${server_cpu}%`;
    server_overlay_mem.textContent = `${server_mem}`;
    server_overlay_uptime.textContent = `${uptime_str}`;
}

// Call this load server function very 0.2s
setInterval(LoadServerOverlayData, 200);

// Stop a server from running
server_stop_btn.addEventListener("click", () => SendServerCommand("stop"));

// Start a server
server_start_btn.addEventListener("click", () => {
    // Get the current server
    pm2_servers.forEach((server) => {
        if (current_server_id != server.pm_id) {
            return;
        }
        else {
            current_server = server;
        }
    });
    if (current_server.status != "online"){
        SendServerCommand("restart");
    }
});

// Restart a server
server_restart_btn.addEventListener("click", () => SendServerCommand("restart"));

// Delete a server
server_delete_btn.addEventListener("click", function() {
    SendServerCommand("delete");
    CloseServerOverlay();
});

// Change server port
change_port_button.addEventListener("click", async function() {
    // Get port
    let port = change_port_text.value;
    if (ValidatePort(port, ports_in_use) == false) {
        change_port_info_p.innerText = "Invalid Port";
        return;
    }
    change_port_info_p.innerText = "";
    port = Number(change_port_text.value.trim());

    if (!current_server) { return; }

    const root = current_server.name;
    const pm_id = current_server.pm_id;

    try{
        let response = await fetch(`/api/change-server-port?port=${port}&root=${root}&id=${pm_id}`, {
            method: "POST"
        });
        const data = await response.json();
        console.log(data);
    }   
    catch (err){
        console.log(err);
    }
})

// Helper function for the buttons to send the commands to the server
async function SendServerCommand(command){
    try{
        const response = await fetch(`/api/process/${current_server_id}/${command}`,
            { method: "POST" }
        );
        if (response.ok){
            LoadServerOverlayData();
        }
    }
    catch (error){
        console.log(error)
    }
}

// Creating a new server ------------------------------------------------------------

function CheckEcosystemBox(){
    if (this.checked == true){
        create_ecosystem_div.style.display = "flex";
        existing_ecosystem_div.style.display = "none";
        check_new_server_btn.style.display = "flex";
    }
    else{
        create_ecosystem_div.style.display = "none";
        existing_ecosystem_div.style.display = "flex";
        check_new_server_btn.style.display = "none";
    }
}

create_ecosystem_checkbox.addEventListener("change", CheckEcosystemBox);

// Check the inputted data before creating server
check_new_server_btn.addEventListener("click", async function() {
    let valid_port = false;
    let valid_root = false;
    let valid_server = false;
    // Get the port nubmer and validate it
    let port = port_input.value
    valid_port = ValidatePort(port, ports_in_use);
    if (!valid_port){
        port_input_info.textContent = "Can't use port";
    }
    else{
        port_input_info.textContent = "Port is valid";
    }

    // Get the root folder and server location
    let root_folder = root_folder_input.value;
    let server_path = server_file_location_input.value;

    if (root_folder.length == 0){
        root_folder_input_info.textContent = "Enter the server root folder";
    }
    else{
        root_folder_input_info.textContent = "";
        valid_root = true;
    }
    if (server_path.length == 0){
        server_file_location_input_info.textContent = "Enter the server path";
    }
    else{
        server_file_location_input_info.textContent = "";
        valid_server = true;
    }

    if (!(valid_port && valid_root && valid_server)){
        return;
    }

    // Ask the server to validate the inputs
    try{
        let response = await fetch(`api/validate-server-dir?root=${root_folder}&server_path=${server_path}`)
        let data = await response.json();
        let message = await data.message;
        if (message == "server file not found"){
            server_file_location_input_info.textContent = "File not found!";
            root_folder_input_info.textContent = ""
            return;
        }
        else if (message == "root folder not found"){
            root_folder_input_info.textContent = "Root folder not found!"
            server_file_location_input_info.textContent = "File not found!";
            return;
        }
        else if (message == "valid"){
            server_file_location_input_info.textContent = "Found file!";
            root_folder_input_info.textContent = "Found folder";
            allow_create_server = true;
        }
        else if (message == "ecosystem exists"){
            port_input_info.textContent = "";
            server_file_location_input_info.textContent = "";
            root_folder_input_info.textContent = "Ecosystem config already exists!";
        }
        else{
            console.log(message);
        }
    }
    catch (err){
        console.log(err);
    }
});

// Create new server request
create_new_server_btn.addEventListener("click", async function(){
    // Check if the ecosystem file should be created?
    if (create_ecosystem_checkbox.checked == true){
        if (!allow_create_server) { return; }
        // Get the root folder and server location
        let port = Number(port_input.value.trim());
        const root_folder = root_folder_input.value;
        const server_path = server_file_location_input.value;
        CreateNewServer(port, root_folder, server_path);
    }
    // Just run the ecosystem file.
    else{
        // Check if the port is in use already (The same server is running)
        if (!allow_create_server) { return; }
        // Get ecosystem file location
        const file_location = eco_file_location_input.value;
         // Get the new port input
        let new_port = new_port_input.value;
        // Check if there is a new port to be added
        if (ValidatePort(new_port, ports_in_use) == false) { new_port = "-1"; }
        try{
            let response = await fetch(`/api/create-new-server?root=${file_location}&port=${new_port}`, {
                method: "POST",
            });
            if (response.ok){
                CloseNewServerOverlay();
                allow_create_server = false;
            }
            
        }
        catch (err){
            console.log(err);
        }
    }
})

load_ecosystem_file_btn.addEventListener("click", async function(){
    allow_create_server = false;
    // Get ecosystem file location
    const file_location = eco_file_location_input.value;
   
    if (file_location.length < 1) { return; }
    try{
        let response = await fetch(`/api/get-ecosystem-config-data?file_location=${file_location}`);
        let data = await response.json();
        const port = data.port;
        const name = data.name;
        eco_server_name.textContent = `Name: ${name}`;
        eco_server_port.textContent = `Port: ${port}`;
        allow_create_server = true;
    }
    catch (err){
        console.log("error:", err);
    }
})

// Open the new server overlay
new_server_btn.addEventListener("click", function(){
    new_server_overlay.classList.add("appear");
    overlay_shadow.classList.add("appear");
})

// Function to create a new server
async function CreateNewServer(port, root_folder, server_path){
    try{
        let response = await fetch(`/api/create-new-server-config?root=${root_folder}&server_path=${server_path}&port=${port}`, {
                method: "POST"
            });
        if (response.ok){
            CloseNewServerOverlay();
            allow_create_server = false;
        }
    }
    catch (err){
        console.log(err);
    }
}

// Close the new server overlay
function CloseNewServerOverlay(){
    new_server_overlay.classList.remove("appear");
    overlay_shadow.classList.remove("appear");

    // Clear all of the inputs
    port_input.value = "";
    port_input_info.textContent = "Port Info";
    root_folder_input.value = "";
    root_folder_input_info.textContent = "Root Folder Info";
    server_file_location_input.value = "";
    server_file_location_input_info.textContent = "Server File Location Info";
    create_ecosystem_checkbox.checked = false;
    eco_file_location_input.value = "";
    eco_server_name.textContent = "Name";
    eco_server_port.textContent = "Port";
    new_port_input.value = "";
    CheckEcosystemBox();
}

close_new_server_btn.addEventListener("click", CloseNewServerOverlay);