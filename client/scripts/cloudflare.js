
// Get DOM elements
let cloudflare_tunnels_btn = document.getElementById("get-tunnels-btn");
let cloudflare_cards_div = document.getElementById("cloudflare-cards");
let cloudflare_tunnel_overlay = document.getElementById("edit-tunnel-overlay");
let tunnel_delete_btn = document.getElementById("delete-edit-tunnel-overlay-button");
let tunnel_close_overlay_button = document.getElementById("close-edit-tunnel-overlay-button");

let tunnel_overlay_name_text = document.getElementById("tunnel-overlay-name");
let tunnel_id_text = document.getElementById("tunnel-id-p");
let tunnel_created_text = document.getElementById("tunnel-created-p");
let tunnel_status_text = document.getElementById("tunnel-status-p");

let tunnel_domains_div = document.getElementById("tunnel-domains-div");
let tunnel_domains_title = document.getElementById("tunnel-domains-title");

// Variables
let tunnel_id = undefined;
let current_tunnel_config = [];
let cloudflare_tunnels = [];
let cloudflare_statuses = ["healthy", "down", "degraded", "inactive"];
let opened_overlay = true;

// Event listener for button for closing the overlay
tunnel_close_overlay_button.addEventListener("click", CloseServerOverlay);

// Function to get the cloudflare tunnel data
async function GetCloudflareTunnels(){
    try{
        // Call server api for data
        const response = await fetch("/api/get-cloudflare-tunnels");
        const data = await response.json();
        cloudflare_tunnels = data.tunnels;
        CreateCloudflareCards(cloudflare_tunnels);
    }
    catch (error){
        console.log(error);
    }
}

// Function to get the config of the wanted tunnel
async function GetCloudflareTunnelConfig(id){
    // Check if there is a tunnel id
    if (!id){
        return;
    }

    try{
        // Call server api for data
        const response = await fetch(`/api/get-cloudflare-tunnel-config?tunnel_id=${id}`);
        const data = await response.json();
        // Get the domains the tunnel is tunneling to
        current_tunnel_config = ExtractTunnelDomains(data);
    }
    catch (err){
        console.error("Error:", err);
    }
}

// Function to get hostnames and services from the tunnel data
function ExtractTunnelDomains(tunnel_data){
    // If not complete data, return
    if (!tunnel_data || !tunnel_data.config || !tunnel_data.config.config || !tunnel_data.config.config.ingress){
        return;
    }
    // Create array for domains
    let selected_domains = [];
    // Get all the domains
    const domains = tunnel_data.config.config.ingress;
    // Loop through each domain
    for (let i = 0; i < domains.length; i++){
        // Get the hostname and service
        let hostname = domains[i].hostname;
        let service = domains[i].service;
        // Keep the domains which are good
        if (!hostname || !service) { continue; }
        // Put into dict
        let temp = {
            hostname: hostname,
            service: service
        }
        // Push the data
        selected_domains.push(temp);
    }
    
    // Return the data
    return selected_domains;
}

// Function to update the status indicator of a cloudflare tunnel
function UpdateTunnelStatus(status_div, status_data){
    // Remove previous status
    cloudflare_statuses.forEach(status => {
        status_div.classList.remove(status);
    })

    // Add the correct class
    if (status_data.toLowerCase() == "healthy"){
        status_div.classList.add("online");
    }
    else if (status_data.toLowerCase() == "down"){
        status_div.classList.add("offline");
    }
    else if (status_data.toLowerCase() == "inactive"){
        status_div.classList.add("errored");
    }
    else if (status_data.toLowerCase() == "degraded"){
        status_div.classList.add("stopping");
    }
}

// Function to create the cloudflare tunnel cards
function CreateCloudflareCards(tunnels_data){
    // Remove all cards from the div
    Array.from(cloudflare_cards_div.children).forEach(child => {
        child.remove();
    });

    // Loop through each tunnel
    tunnels_data.forEach(tunnel => {
        // Get the card
        const card = CreateSingleCard(tunnel.name, tunnel.status, tunnel.id);
        // Add it to the div
        cloudflare_cards_div.appendChild(card);
    });

}

// Function to create single cloudflare card
function CreateSingleCard(name, status, id){
    // Create the card elements
    const article = document.createElement("article");
    const name_h3 = document.createElement("h3");
    const status_div = document.createElement("div");
    const status_p = document.createElement("p");
    const status_circle = document.createElement("div");
    const manage_button = document.createElement("button");

    // Add element classes
    article.classList.add("server-card", "cloudflare-card");
    name_h3.classList.add("pm2-card-name");
    status_div.classList.add("status");
    status_circle.classList.add("status-circle");
    manage_button.classList.add("edit-server-button");

    // Add text
    name_h3.innerText = name;
    status_p.innerText = "Status:";
    manage_button.innerText = "Manage";

    // Show the correct status
    UpdateTunnelStatus(status_circle, status);

    // Add children
    status_div.appendChild(status_p);
    status_div.appendChild(status_circle);
    article.appendChild(name_h3);
    article.appendChild(status_div);
    article.appendChild(manage_button);

    // Add the tunnel id to the card
    article.dataset.tunnel_id = id;

    // Add event listener to button
    manage_button.addEventListener("click", (event) => {
        tunnel_id = GetCurrentTunnelId(event);
        OpenServerOverlay();
    });

    // Return the card
    return article;
}

// Function to get the id of the interacted card
function GetCurrentTunnelId(event){
    // Get the card from the button
    const card = event.target.closest(".server-card");
    if (!card) { return; }
    // Get the cloudflare tunnel id
    return card.dataset.tunnel_id;
}

// Function to open the server overlay
function OpenServerOverlay(){
    overlay_shadow.classList.add("appear");
    cloudflare_tunnel_overlay.classList.add("appear");
    opened_overlay = true;
    LoadTunnelOverlayData(tunnel_id);
}

// Function to close the server overlay
function CloseServerOverlay(){
    overlay_shadow.classList.remove("appear");
    cloudflare_tunnel_overlay.classList.remove("appear");
    opened_overlay = false;
}

// Function to get the relevant tunnel data
function GetRelevantTunnelData(tunnel_id){
    let current_data = [];
    let tunnel_data = {};
    // Get the current server data
    for (let i = 0; i < cloudflare_tunnels.length; i++){
        t_id = cloudflare_tunnels[i].id;
        if (t_id == tunnel_id) {
            current_data = cloudflare_tunnels[i]; 
            break;
        }
    }

    // Sort the relevant data
    tunnel_data = {
        "domains": current_tunnel_config,
        "date_created": current_data.created_at,
        "id": current_data.id,
        "name": current_data.name,
        "status": current_data.status
    }
    // Return the data
    return tunnel_data;
}

// Function to load the overlay data
function LoadTunnelOverlayData(tunnel_id){
    if (!tunnel_id) { return; }
    
    const data = GetRelevantTunnelData(tunnel_id);

    tunnel_overlay_name_text.innerText = data.name;

    tunnel_id_text.innerHTML = `<b>ID</b>: ${data.id}`;
    tunnel_created_text.innerHTML = `<b>Created</b>: ${FormatLegibleDate(data.date_created)}`
    tunnel_status_text.innerHTML = `<b>Status</b>: ${data.status}`;

    if (data.domains.length > 0) { tunnel_domains_title.innerText = "Domains"; }

    // Clear children from the tunnel div
    Array.from(tunnel_domains_div.children).forEach(child => {
        child.remove();
    })

    // Loop through the domains
    data.domains.forEach(domain => {
        // Create the div
        const separator_div = CreateDomainSeparator(domain.hostname, domain.service);
        // Add it to the domain secion
        tunnel_domains_div.appendChild(separator_div);
    });
}

// Function to convert iso string to legible date and time
function FormatLegibleDate(isoString) {
    const date = new Date(isoString);

    // Check if the date is valid before formatting
    if (isNaN(date.getTime())) {
        return "Invalid Date";
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true // Set to false if you prefer 24-hour time
    }).replace(' at ', ', '); // Replaces "at" with a comma depending on browser locale quirks
}

function CreateDomainSeparator(hostname, service){
    // Create elements
    domain_div = document.createElement("div");
    hostname_text = document.createElement("p");
    service_text = document.createElement("p");

    // Add class
    domain_div.classList.add("center-div-text");
    domain_div.classList.add("tunnel-domain-separator");
    hostname_text.classList.add("domain-text");
    service_text.classList.add("domain-text");

    // Add text
    hostname_text.innerText = `Host: ${hostname}`;
    service_text.innerText = `Service: ${service}`;
    
    // Add elements to div
    domain_div.appendChild(hostname_text);
    domain_div.appendChild(service_text);
    
    // Return the div
    return domain_div;
}

setInterval(async function() {
    if (current_page == "cloudflare"){
        await GetCloudflareTunnels();

        if (opened_overlay){
            await GetCloudflareTunnelConfig(tunnel_id);
            LoadTunnelOverlayData(tunnel_id);
        }
    }
}, 1000);