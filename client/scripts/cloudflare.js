
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

let add_tunnel_card = document.getElementById("add-tunnel-card");
let new_tunnel_button = document.getElementById("new-tunnel-button");

let new_tunnel_overlay = document.getElementById("new-tunnel-overlay");
let close_new_tunnel_overlay_button = document.getElementById("close-new-tunnel-overlay-button");
let visit_tunnel_link = document.getElementById("visit-tunnel-link");
let permenant_tunnel_section = document.getElementById("create-permenant-tunnel-div");
let create_tunnel_button = document.getElementById("create-tunnel-button");

let tunnel_name_input = document.getElementById("tunnel-name-input");
let tunnel_port_input = document.getElementById("tunnel-port-input");
let tunnel_domain_input = document.getElementById("tunnel-domain-input");

// Variables
let tunnel_id = undefined;
let current_tunnel_config = [];
let cloudflare_tunnels = [];
let cloudflare_statuses = ["healthy", "down", "degraded", "inactive"];
let opened_overlay = true;

// Event listener for button for closing the overlay
tunnel_close_overlay_button.addEventListener("click", CloseTunnelOverlay);
close_new_tunnel_overlay_button.addEventListener("click", CloseTunnelOverlay);

// Event listener for button for opening new tunnel overlay
new_tunnel_button.addEventListener("click", OpenNewTunnelOverlay);

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
        if (child != add_tunnel_card){
            child.remove();
        }
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
        ManageCardButtons(event);
    })

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

// Function to manage the card buttons
function ManageCardButtons(event){
    tunnel_id = GetCurrentTunnelId(event);
    OpenTunnelOverlay();
}

// Function to open the server overlay
function OpenTunnelOverlay(){
    overlay_shadow.classList.add("appear");
    cloudflare_tunnel_overlay.classList.add("appear");
    opened_overlay = true;
    tunnel_domains_title.innerText = "Loading";
    Array.from(tunnel_domains_div.children).forEach(child => {
        child.remove();
    });
    ToggleAreaScroll(true);
    LoadTunnelOverlayData(tunnel_id);
}

// Function to close the server overlay
function CloseTunnelOverlay(){
    overlay_shadow.classList.remove("appear");
    cloudflare_tunnel_overlay.classList.remove("appear");
    opened_overlay = false;
    current_tunnel_config = [];
    tunnel_domains_title.innerText = "Loading";
    Array.from(tunnel_domains_div.children).forEach(child => {
        child.remove();
    });
    ToggleAreaScroll(false);
    CloseNewTunnelOverlay();
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
    if (!opened_overlay) { return; }
    
    const data = GetRelevantTunnelData(tunnel_id);

    tunnel_overlay_name_text.innerText = data.name;

    tunnel_id_text.innerHTML = `<b>ID</b>: ${data.id}`;
    tunnel_created_text.innerHTML = `<b>Created</b>: ${FormatLegibleDate(data.date_created)}`
    tunnel_status_text.innerHTML = `<b>Status</b>: ${data.status}`;

    if (!data.domains) {
        tunnel_domains_title.innerText = "No Domains!";
        Array.from(tunnel_domains_div.children).forEach(child => {
            child.remove();
        })
        return;
    }

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

    // Check if there are any domains
    if (data.domains.length > 0){
        // Check if there is a hostname
        if (data.domains[0].hostname){
            // Make the visit site link the hostname
            visit_tunnel_link.href = `https://${data.domains[0].hostname}`
        }
        
    }
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

// Function to create the div for the hostnames and services
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
    hostname_text.innerHTML = `<b>Host</b>: ${hostname}`;
    service_text.innerHTML = `<b>Service</b>: ${service}`;
    
    // Add elements to div
    domain_div.appendChild(hostname_text);
    domain_div.appendChild(service_text);
    
    // Return the div
    return domain_div;
}

// Function to open the new tunnel overlay
function OpenNewTunnelOverlay(){
    new_tunnel_overlay.classList.add("appear");
    overlay_shadow.classList.add("appear");
    opened_overlay = true;
}

// Function to close the new tunnel overlay
function CloseNewTunnelOverlay(){
    // Called in "CloseTunnelOverlay" function
    new_tunnel_overlay.classList.remove("appear");
}

// Event listener for the new tunnel button
create_tunnel_button.addEventListener("click", async function() {
    await CreateNewTunnel();
});

// Function to create the new tunnel
async function CreateNewTunnel(){
    // Get the name, port and domain
    const tunnel_name = tunnel_name_input.value;
    const tunnel_port = tunnel_port_input.value;
    const tunnel_domain = tunnel_domain_input.value;

    if (tunnel_name.length < 1) { return; }
    else if (!ValidatePort(tunnel_port, [])) { return; }
    else if (tunnel_domain.length < 1) { return; }

    try{
        const response = await fetch("/api/create-permanent-tunnel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tunnel_name: tunnel_name,
                local_port: tunnel_port,
                public_domain: tunnel_domain
            })
        });

        const data = await response.json();
    }
    catch (err){
        console.error(err);
    }
}

// Event listener for delete tunnel button
tunnel_delete_btn.addEventListener("click", async function(){
    await DeleteTunnel();
})

// Function to delete a tunnel
async function DeleteTunnel(){
    if (!tunnel_id) { return; }

    try{
        const response = await fetch("/api/delete-tunnel", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tunnel_id: tunnel_id }),
        })

        const data = await response.json();
        console.log(data);
    }
    catch (error){
        console.error(error);
    }
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