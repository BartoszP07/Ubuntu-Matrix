


// Function to get temporary running tunnels
async function GetTempTunnels(){
    try{
        const response = await fetch("/api/get-temp-tunnels",
            {
                method: "GET"
            }
        );

        const data = await response.json();
        console.log(data.tunnels);
    }
    catch (err){
        console.error(err);
    }
}

setInterval(async function() {
    if (current_page == "temp-tunnels"){
        await GetTempTunnels();
    }
}, 1000);