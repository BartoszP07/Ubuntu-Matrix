
// DOM objects
let ngrok_cards_div = document.getElementById("ngrok-cards");
let add_ngrok_card = document.getElementById("add-ngrok-card");

let delete_ngrok_button = document.getElementById("delete-edit-ngrok-overlay-button");
let edit_ngrok_overlay = document.getElementById("edit-ngrok-overlay");
let close_ngrok_button = document.getElementById("close-edit-ngrok-overlay-button");
let ngrok_id_text = document.getElementById("ngrok-id-p");
let ngrok_created_text = document.getElementById("ngrok-created-p");
let ngrok_forwards_text = document.getElementById("ngrok-forwards-p");
let ngrok_visit_site_link = document.getElementById("visit-ngrok-link");

let ngrok_tunnels = [];
let current_ngrok_tunnel_id = undefined;
let current_ngrok_tunnel_session_id = undefined;

// Object
// forwards_to : "http://localhost:3000"
// id : "tn_3Hk5wbEo9Gvz9324PqFhVjo1iiW" 
// proto : "https" 
// public_url : "https://fba2-86-22-164-183.ngrok-free.app" 
// region : eu 
// started_at : "2026-08-10T22:04:25Z" 

// Function to get temporary running tunnels
async function GetNgrokTunnels(){
    try{
        const response = await fetch("/api/get-ngrok-tunnels",
            {
                method: "GET"
            }
        );
        const data = await response.json();
        console.log(data);
        ngrok_tunnels = data.tunnels;
        CreateNgrokCards(ngrok_tunnels);
    }
    catch (err){
        console.error(err);
    }
}

// Function to extract the port number from the tunnel service url
function GetPortNumber(service_url){
    const split_arr = service_url.split(":");
    return split_arr[split_arr.length - 1];
}

// Function to create the cards for the running tunnnels
function CreateNgrokCards(tunnels_data){
    // Remove all cards from the div
    Array.from(ngrok_cards_div.children).forEach(child => {
        if (child != add_ngrok_card){
            child.remove();
        }
    });

    console.log(tunnel_data);

    // Loop through each tunnel
    tunnels_data.forEach(tunnel => {
        // Get the port from the card
        tunnel_port = GetPortNumber(tunnel.forwards_to);
        // Get the card
        const card = CreateSingleNgrokCard("NGROK", tunnel_port, tunnel.id, tunnel.tunnel_session.id);
        // Add it to the div
        ngrok_cards_div.appendChild(card);
    });
}

// Function to create single cloudflare card
function CreateSingleNgrokCard(name, port, id, session_id){
    // Create the card elements
    const article = document.createElement("article");
    const name_h3 = document.createElement("h3");
    const port_p = document.createElement("p");
    const manage_button = document.createElement("button");

    // Add element classes
    article.classList.add("server-card", "ngrok-card");
    name_h3.classList.add("pm2-card-name");
    manage_button.classList.add("edit-server-button");

    // Add text
    name_h3.innerText = name;
    port_p.innerText = `Port: ${port}`;
    manage_button.innerText = "Manage";


    // Add children
    article.appendChild(name_h3);
    article.appendChild(port_p);
    article.appendChild(manage_button);

    // Add the tunnel id to the card
    article.dataset.tunnel_id = id;
    article.dataset.tunnel_session_id = session_id;

    // Add event listener to button
    manage_button.addEventListener("click", (event) => {
        ManageNgrokCardButtons(event);
    })

    // Return the card
    return article;
}

// Function to get current session id from article
function GetCurrentSessionId(event){
    // Get the card from the button
    const card = event.target.closest(".server-card");
    if (!card) { return; }
    // Get the cloudflare tunnel id
    return card.dataset.tunnel_session_id;
}

// Function to manage the card buttons - SETS THE CURRENT TUNNEL ID
function ManageNgrokCardButtons(event){
    current_ngrok_tunnel_id = GetCurrentTunnelId(event); // Function in cloudflare.js
    current_ngrok_tunnel_session_id = GetCurrentSessionId(event);
    LoadNgrokOverlayData(current_ngrok_tunnel_id);
    OpenNgrokOverlay();
}

// Function to open the ngrok overlay
function OpenNgrokOverlay(){
    edit_ngrok_overlay.classList.add("appear");
    overlay_shadow.classList.add("appear");
}

// Function to close the ngrok overlay
function CloseNgrokOverlay(){
    edit_ngrok_overlay.classList.remove("appear");
    overlay_shadow.classList.remove("appear");
}

// Event listener for buton to close overlay
close_ngrok_button.addEventListener("click", CloseNgrokOverlay);

// Function to delete an ngrok tunnel
async function DeleteNgrokTunnel(tunnel_id, session_id){
    if (!tunnel_id || !session_id) { return; }

    try{
        const response = await fetch("/api/delete-ngrok-tunnel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tunnel_id: tunnel_id,
                session_id: session_id 
            })
        });

        const data = await response.json();
        console.log(data);
        CloseNgrokOverlay();
    }
    catch (err){
        console.error(err);
    }
}

delete_ngrok_button.addEventListener("click", async function() {
    await DeleteNgrokTunnel(current_ngrok_tunnel_id, current_ngrok_tunnel_session_id);
})

// Function to load the tunnel overlay data
function LoadNgrokOverlayData(tunnel_id){
    // Loop through all tunnels and find the one with the matching id
    let tunnel_data;
    for (let i = 0; i < ngrok_tunnels.length; i++){
        if (ngrok_tunnels[i].id == tunnel_id){
            tunnel_data = ngrok_tunnels[i];
            break;
        }
    }

    ngrok_id_text.innerHTML = `<b>ID</b>: ${tunnel_data.id}`;
    ngrok_created_text.innerHTML = `<b>Created</b>: ${FormatLegibleDate(tunnel_data.started_at)}`;
    ngrok_forwards_text.innerHTML = `<b>Forwards</b>: ${tunnel_data.forwards_to}`;
    ngrok_visit_site_link.href = tunnel_data.public_url;

}

// Call the get tunnels function every second
setInterval(async function() {
    if (current_page == "ngrok"){
        await GetNgrokTunnels();
    }
}, 1000);