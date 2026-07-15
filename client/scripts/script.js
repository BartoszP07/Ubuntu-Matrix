
// Get all elements

// Get sections
let welcome_section = document.getElementById("welcome-section");
let pm2_section = document.getElementById("pm2-section");
let cloudflare_section = document.getElementById("cloudflare-section");
let storage_section = document.getElementById("storage-section");
let details_section = document.getElementById("details-section");

// Get side buttons
let title_button = document.getElementById("title-button");
let pm2_server_button = document.getElementById("pm2-server-btn");
let cloudflare_button = document.getElementById("cloudflare-btn");
let storage_button = document.getElementById("storage-btn");
let details_button = document.getElementById("details-btn");

// Get elements which affect the side bar
let close_side_btn = document.getElementById("close-side-btn");
let side_bar = document.getElementById("side-bar");
let menu_btn = document.getElementById("menu-btn");

// Hide all sections -- function removes repeated code and enforces all sections are hidden
function HideAllSections(){
    welcome_section.style.display = "none";
    pm2_section.style.display = "none";
    cloudflare_section.style.display = "none";
    storage_section.style.display = "none";
    details_section.style.display = "none";
    pm2_server_button.classList.remove("active");
    cloudflare_button.classList.remove("active");
    storage_button.classList.remove("active");
    details_button.classList.remove("active");
}

// Function to show an element -- every section does use flex as display
function ShowSection(element){
    element.style.display = "flex";
}

// Show the main page
title_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(welcome_section);
})

// Show the pm2 servers page
pm2_server_button.addEventListener("click", async function(){
    HideAllSections();
    ShowSection(pm2_section);
    pm2_server_button.classList.add("active");

    await GetPM2Data();
})

// Show the cloudflare tunnels page
cloudflare_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(cloudflare_section);
    cloudflare_button.classList.add("active");
})

// Show the server storage page
storage_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(storage_section);
    storage_button.classList.add("active");
})

// Show the server details page
details_button.addEventListener("click", function(){
    HideAllSections();
    ShowSection(details_section);
    details_button.classList.add("active");
})

// Convert Bytes to MB or GB
function FormatMemory(bytes) {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
        return (mb / 1024).toFixed(2) + ' GB';
    }
    return mb.toFixed(0) + ' MB';
}

// Convert Milliseconds (D:H:M:S)
function FormatUptime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    hours = hours % 24;
    minutes = minutes % 60;
    seconds = seconds % 60;

    return {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
    };
}

function ValidatePort(port, used_ports){
    let p = String(port);
    // Check if there is a port
    if (p.length < 1) { return false; }
    // Check if its a number
    if (!isNaN(p)) { return false; }
    // Convert port to a number
    p = Number(p);
    if (p < 1001) { return false; }
    if (p > 65535) { return false; }
    if (used_ports.includes(p)) { return false; }
    return true;
}

// ONLY WORKS FOR MOBILE (MAX-WIDTH <= 768)

// Close the side bar
close_side_btn.addEventListener("click", function(){
    side_bar.classList.remove("appear");
    menu_btn.classList.remove("disappear");
});

// Open the side bar
menu_btn.addEventListener("click", function(){
    side_bar.classList.add("appear");
    menu_btn.classList.add("disappear");
})