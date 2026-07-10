const file_input = document.getElementById('file-input');
const destination_input = document.getElementById('destination-path');
const progress_bar = document.getElementById('upload-progress');
const status_text = document.getElementById('status-message');
const send_file_btn = document.getElementById("send-server-btn");
const file_chosen_txt = document.getElementById("file-chosen-txt");

send_file_btn.addEventListener("click", uploadArchive);

file_input.addEventListener("change", function(event){
    if (file_input.files && file_input.files.length > 0){
        const selected_file = file_input.files[0];
        file_chosen_txt.innerText = selected_file.name;
    }
    progress_bar.value = 0;
    status_text.innerText = "";
    
});

function uploadArchive() {
    // Check if a file was actually selected
    if (file_input.files.length === 0) {
        status_text.innerText = "Please select a file first.";
        return;
    }

    const file = file_input.files[0];
    const destination = destination_input.value.trim();

    const form_data = new FormData();
    form_data.append('file', file);

    const base_url = '/api/upload';
    
    // Append the destination query parameter if one was typed in
    const target_url = destination 
        ? `${base_url}?dest=${encodeURIComponent(destination)}` 
        : base_url;

    const xhr = new XMLHttpRequest();

    // Reset UI
    progress_bar.style.display = "flex";
    progress_bar.value = 0;
    status_text.innerText = "Uploading...";

    // Listen for upload progress
    xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
            const percent_complete = Math.round((event.loaded / event.total) * 100);
            progress_bar.value = percent_complete;
            status_text.innerText = `Uploading... ${percent_complete}%`;
        }
    });

    // Handle the server's response when finished
    xhr.onload = () => {
        if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            status_text.innerText = response.message || "Upload successful!";
            file_input.value = ""; // Clear the input
        } else {
            // Parses the error message from Express if something goes wrong (like a bad path)
            const error_msg = JSON.parse(xhr.responseText).error || "Upload failed.";
            status_text.innerText = `Error: ${error_msg}`;
        }
    };

    // Handle network-level errors (e.g., server is offline)
    xhr.onerror = () => {
        status_text.innerText = "Network error. Make sure the server is running and you are connected to Tailscale.";
    };

    // Fire the request
    xhr.open("POST", target_url, true);
    xhr.send(form_data);
}