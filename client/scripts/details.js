
// Get elemements 

let get_details_btn = document.getElementById("get-details-button");
let details_p = document.getElementById("system-details");

// Make server call to get details
get_details_btn.addEventListener("click", async function() {
    const response = await fetch("/api/sysinfo");
    const data = await response.json();
    // Convert seconds to ms
    const uptime = FormatUptime(data.uptime*1000);
    const manufacturer = data.manufacturer;
    const model = data.model;
    console.log(data);
})