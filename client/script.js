
// Get sections
let welcome_section = document.getElementById("welcome-section");
let pm2_section = document.getElementById("pm2-section");
let cloudflare_section = document.getElementById("cloudflare-section");
let details_section = document.getElementById("details-section");

// Get side buttons
let title_button = document.getElementById("title-button");
let pm2_server_button = document.getElementById("pm2-server-btn");
let cloudflare_button = document.getElementById("cloudflare-btn");
let details_button = document.getElementById("details-btn");

function HideAllSections(){
    welcome_section.style.display = "none";
    pm2_section.style.display = "none";
    cloudflare_section.style.display = "none";
    details_section.style.display = "none";
    pm2_server_button.classList.remove("active");
    cloudflare_button.classList.remove("active");
    details_button.classList.remove("active");
}

function ShowSection(element){
    element.style.display = "flex";
}

title_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(welcome_section);
})

pm2_server_button.addEventListener("click", async function(){
    HideAllSections();
    ShowSection(pm2_section);
    pm2_server_button.classList.add("active");

    await GetPM2Data();
})

cloudflare_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(cloudflare_section);
    cloudflare_button.classList.add("active");
})

details_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(details_section);
    details_button.classList.add("active");
})

// Handle the server cards
let pm2_cards_div = document.getElementById("pm2-cards");
let add_server_card = document.getElementById("add-server-card");
let statuses = ["online", "stopped", "errored", "launching", "stopping"];
let pm2_servers = []

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
    edit_btn.textContent = "Edit";

    // Add all the elements to the card
    card.appendChild(title);
    card.appendChild(port_elem);
    status_div.appendChild(status_txt);
    status_div.appendChild(status_circle);
    card.appendChild(status_div);
    card.appendChild(edit_btn);

    // Add the pm id to the card
    card.dataset.pm_id = pm_id;

    return card;
}

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

let new_server_btn = document.getElementById("new-server-button");

new_server_btn.addEventListener("click", function(){
    const card = CreateServerCard("New server", 0, "offline");
    pm2_cards_div.appendChild(card);
})

async function GetPM2Data(new_cards=true, pm_id=-1){
    try {
        let response = await fetch("/api/get-pm2-data");
        pm2_servers = await response.json();

        if (new_cards){   

            // Remove all existing cards
            Array.from(pm2_cards_div.children).forEach((child) => {
                if (child != add_server_card) {
                child.remove();
                }
            });

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
            });
        }
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

        if (pm_id != -1){
            pm2_servers.forEach((server) => {
                if (pm_id != server.pm_id) {
                    return;
                } else {
                    current_server = server;
                }
            });
        }
    } 
    catch (error) {
        console.log(error);
    }
}

// Update pm2 server cards every second
setInterval(GetPM2Data, 1000);

// Handle editing a server

// Get all the card edit buttons -- also gotten in when the new cards are made
let edit_server_buttons;

// Get the overlays
let overlay_shadow = document.getElementById("overlay-shadow");
let edit_server_overlay = document.getElementById("edit-server-overlay");

// Get other elements
let close_server_overlay_button = document.getElementById(
  "close-edit-server-overlay-button",
);

close_server_overlay_button.addEventListener("click", function(){
    overlay_shadow.classList.remove("appear");
    edit_server_overlay.classList.remove("appear");
    current_server = undefined;
})

let current_server = undefined;

function GetCurrentServer(event){
    if (!current_server) {
        // Get the card from the button
        const card = event.target.closest(".server-card");
        if (!card) { return; }
        // Get the pm2 server id
        pm_id = card.dataset.pm_id;

        // Get the current server
        pm2_servers.forEach((server) => {
        if (pm_id != server.pm_id) {
            return;
        }
        else {
            current_server = server;
        }

        });
    }
}

function LoadServerOverlayData(){
    if (!current_server) { return; }

    GetPM2Data(new_cards=false, current_server.pm_id);

    // Get server data
    const server_status = current_server.status;
    const server_name = current_server.name;
    const server_port = current_server.port;
    const server_cpu = current_server.cpu;
    const server_mem = current_server.memory;
    const server_uptime = current_server.uptime;

    // Get overlay elements
    const server_overlay_status = document.getElementById("server-overlay-status")
    const server_overlay_name = document.getElementById("server-overlay-name");
    const server_overlay_port = document.getElementById("server-overlay-port");
    const server_overlay_cpu = document.getElementById("server-overlay-cpu");
    const server_overlay_mem = document.getElementById("server-overlay-mem");
    const server_overlay_uptime = document.getElementById("server-overlay-uptime");

    server_overlay_name.textContent = server_name;
    server_overlay_port.textContent = `Port: ${server_port}`
    server_overlay_status.textContent = `Status: ${server_status}`;
    server_overlay_cpu.textContent = `CPU: ${server_cpu}`;
    server_overlay_mem.textContent = `Memory: ${server_mem}`;
    server_overlay_uptime.textContent = `Uptime: ${server_uptime}`;

    
}

setInterval(LoadServerOverlayData, 100);