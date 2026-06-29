
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

let pm2_cards_div = document.getElementById("pm2-cards");
let add_server_card = document.getElementById("add-server-card");

function CreateServerCard(name, port, status){
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
    edit_btn.classList.add("edit-card-button");

    console.log(status);
    // Check the status of the server
    if (status == "stopped"){
        status_circle.classList.add("offline");
        status_circle.classList.remove("online");
        status_circle.classList.remove("errored");
    }
    else if (status == "online"){
        status_circle.classList.add("online");
        status_circle.classList.remove("offline");
        status_circle.classList.remove("errored");
    }
    else if (status == "errored"){
        status_circle.classList.remove("online");
        status_circle.classList.remove("offline");
        status_circle.classList.add("errored");
    }

    // Add text
    title.textContent = name;
    port_elem.textContent = `Port: ${port}`;
    status_txt.textContent = "Status:";
    edit_btn.textContent = "Edit";

    card.appendChild(title);
    card.appendChild(port_elem);
    status_div.appendChild(status_txt);
    status_div.appendChild(status_circle);
    card.appendChild(status_div);
    card.appendChild(edit_btn);

    return card;
}

let new_server_btn = document.getElementById("new-server-button");

new_server_btn.addEventListener("click", function(){
    const card = CreateServerCard("New server", 0, "offline");
    pm2_cards_div.appendChild(card);
})


async function GetPM2Data(){
    try {
        let response = await fetch("/api/get-pm2-data");
        let data = await response.json();

        // Remove all existing cards
        Array.from(pm2_cards_div.children).forEach((child) => {
            if (child != add_server_card) {
            child.remove();
            }
        });

        data.forEach((server) => {
            const server_port = server.port;
            const server_name = server.name;
            const server_status = server.status;
            const card = CreateServerCard(server_name, server_port, server_status);
            pm2_cards_div.appendChild(card);
        });
    } catch (error) {
        console.log(error);
    }
}

// Update pm2 server cards every second
setInterval(GetPM2Data, 1000);