
// DOM objects
let ngrok_cards_div = document.getElementById("ngrok-cards");
let add_ngrok_card = document.getElementById("add-ngrok-card");

let ngrok_tunnels = [];
let current_ngrok_tunnel_id = undefined;

// Object
// forwards_to : "http://localhost:3000"
// id : "tn_3Hk5wbEo9Gvz9324PqFhVjo1iiW" 
// proto : "https" 
// public_url : "https://fba2-86-22-164-183.ngrok-free.app" 
// region : eu 
// started_at : "2026-08-10T22:04:25Z" 

// Function to create the cards for the running tunnnels
function CreateNgrokCards(tunnels_data){
    // Remove all cards from the div
    Array.from(ngrok_cards_div.children).forEach(child => {
        if (child != add_ngrok_card){
            child.remove();
        }
    });

    // Loop through each tunnel
    tunnels_data.forEach(tunnel => {
        // Get the port from the card
        tunnel_port = GetPortNumber(tunnel.forwards_to);
        // Get the card
        const card = CreateSingleNgrokCard("NGROK", tunnel_port, tunnel.id);
        // Add it to the div
        ngrok_cards_div.appendChild(card);
    });

}

// Function to create single cloudflare card
function CreateSingleNgrokCard(name, port, id){
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

    // Add event listener to button
    manage_button.addEventListener("click", (event) => {
        ManageNgrokCardButtons(event);
    })

    // Return the card
    return article;
}


// Function to manage the card buttons - SETS THE CURRENT TUNNEL ID
function ManageNgrokCardButtons(event){
    current_ngrok_tunnel_id = GetCurrentTunnelId(event);
}


// Function to get temporary running tunnels
async function GetNgrokTunnels(){
    try{
        const response = await fetch("/api/get-ngrok-tunnels",
            {
                method: "GET"
            }
        );
        const data = await response.json();
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

// Call the get tunnels function every second
setInterval(async function() {
    if (current_page == "ngrok"){
        await GetNgrokTunnels();
    }
}, 1000);