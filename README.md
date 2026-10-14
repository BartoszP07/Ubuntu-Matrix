# Ubuntu-Matrix
A portal to show all the running servers on an ubuntu server using pm2 to host local servers, along with the ability to connect them to a cloudflare domain.
Also allowing the use of temporary tunnels using Ngrok and a displaying whole monitoring system.

## Requirements
 - Ubuntu Linux Server
 - Node.js
   ### Libraries - install on server
   - System Information
   - PM2
   - Child Process
   - Ngrok
   ### Environment (.env)
   - SERVER_PORT
   - CF_ACCOUNT_ID ( cloudflare account ID)
   - CF_API_TOKEN ( cloudflare api token )
   - NGROK_AUTHTOKEN ( ngrok auth token )
   - NGROK_API_KEY ( ngrok api key )
  
## Installation
  ### Install required libraries
  - `sudo apt install sysinfo lm-sensors`
  - `sudo apt install -g pm2`
  - `sudo apt install -g ngrok`
  ### Clone the repository
  - `git clone https://github.com/BartoszP07/ubuntu-matrix.git`
  ### Navigate to directory
  - `cd Ubuntu-Matrix`
  ### Install dependencies
  - `npm install`
  ### Create .env file
  - `Create file in the main working directory and use the contents given`
  ### Start server on pm2
  - `pm2 start server/server.js --name "Ubuntu-Matrix"`

## **Connecting Via Tailscale**
- **Install Tailscale on server**: `curl -fsSL https://tailscale.com/install.sh | sh`
- **Install Tailscale on working machine**: https://tailscale.com/download
- **Authenticate both devices**
- **Connect to server using the assigned IP address or MagnicDNS hostname**

## Features
* **Live System Monitoring:** View CPU, RAM, and temperature metrics in real-time.
* **Process Management:** Start, stop, and monitor PM2 hosted servers directly from the web interface.
* **Secure Tunnelling:** Integrated Ngrok support for secure external access -- **mainly used for temporary tunnels**.
* **Cloudflare Integration:** Tunneling with a cloudflare domain.
* **Uploading Files:** Allows to upload any zipped file to the main directory of the server.

## Start Page
<p align="center">
  <img src="Dashboard%20Images/start.png" width="80%">
</p>

## Pm2 Page
<p align="center">
  <img src="Dashboard%20Images/pm2.png" width="80%">
</p>

## Cloudflare Page
<p align="center">
  <img src="Dashboard%20Images/cloudflare.png" width="80%">
</p>

## Ngrok Page
<p align="center">
  <img src="Dashboard%20Images/ngrok.png" width="80%">
</p>

## Storage Page
<p align="center">
  <img src="Dashboard%20Images/storage.png" width="80%">  
</p>

## Details Page
<p align="center">
  <img src="Dashboard%20Images/details.png" width="80%">
</p>
