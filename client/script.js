
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

pm2_server_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(pm2_section);
    pm2_server_button.classList.add("active");
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

function CreateServerCard(){
    const card = document.createElement("article");
    const title = document.createElement("h3");
    const port = document.createElement("port");
    const status_div = document.createElement("div");
    const status_txt = document.createElement("p");
    const status_circle = document.createElement("div");
    const edit_btn = document.createElement("button");

    // Add classes
    card.classList.add("server-card");
    title.classList.add("pm2-card-name");
    port.classList.add("pm2-card-port");
    status_div.classList.add("status");
    status_circle.classList.add("status-circle");
    edit_btn.classList.add("edit-card-button");

    // Add text
    title.textContent = "Name";
    port.textContent = "Port: ";
    status_txt.textContent = "Status:";
    edit_btn.textContent = "Edit";

    card.appendChild(title);
    card.appendChild(port);
    status_div.appendChild(status_txt);
    status_div.appendChild(status_circle);
    card.appendChild(status_div);
    card.appendChild(edit_btn);

    return card;
}

let new_server_btn = document.getElementById("new-server-button");

new_server_btn.addEventListener("click", function(){
    const card = CreateServerCard();
    pm2_cards_div.appendChild(card);
})