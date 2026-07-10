function uploadArchive() {
    const fileInput = document.getElementById('fileInput');
    const destInput = document.getElementById('destPath');
    const progressBar = document.getElementById('uploadProgress');
    const statusText = document.getElementById('statusMessage');

    // 1. Check if a file was actually selected
    if (fileInput.files.length === 0) {
        statusText.innerText = "Please select a file first.";
        statusText.style.color = "red";
        return;
    }

    const file = fileInput.files[0];
    const destination = destInput.value.trim();

    // 2. Package the file for transit
    const formData = new FormData();
    formData.append('file', file); // 'file' matches the upload.single('file') in Express

    // 3. Build the Target URL
    // Use your server's Tailscale IP or MagicDNS hostname here
    const baseUrl = 'http://lenovo-ubuntu-server:3000/api/upload';
    
    // Append the destination query parameter if one was typed in
    const targetUrl = destination 
        ? `${baseUrl}?dest=${encodeURIComponent(destination)}` 
        : baseUrl;

    // 4. Set up the network request
    const xhr = new XMLHttpRequest();

    // Reset UI
    progressBar.style.display = "block";
    progressBar.value = 0;
    statusText.innerText = "Uploading...";
    statusText.style.color = "black";

    // 5. Listen for upload progress
    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            progressBar.value = percentComplete;
            statusText.innerText = `Uploading... ${percentComplete}%`;
        }
    });

    // 6. Handle the server's response when finished
    xhr.onload = () => {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            statusText.innerText = response.message || "Upload successful!";
            statusText.style.color = "green";
            fileInput.value = ""; // Clear the input
        } else {
            // Parses the error message from Express if something goes wrong (like a bad path)
            const errorMsg = JSON.parse(xhr.responseText).error || "Upload failed.";
            statusText.innerText = `Error: ${errorMsg}`;
            statusText.style.color = "red";
        }
    };

    // Handle network-level errors (e.g., server is offline)
    xhr.onerror = () => {
        statusText.innerText = "Network error. Make sure the server is running and you are connected to Tailscale.";
        statusText.style.color = "red";
    };

    // 7. Fire the request
    xhr.open("POST", targetUrl, true);
    xhr.send(formData);
}