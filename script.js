const clientId = "147934510488-allie69121uoboqbr26nhql7u0205res.apps.googleusercontent.com";

// Google Sign-In Setup
function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    document.getElementById("fileInput").style.display = "block";
    document.getElementById("deleteSelectedBtn").style.display = "block";
    document.getElementById("uploadBtn").style.display = "block";
    document.getElementById("uploadStatus").innerText = `Welcome, ${payload.name}! Select files to upload.`;

    // Initialize the gapi client
    gapi.load("client:auth2", () => {
        gapi.client.init({
            apiKey: "YOUR_API_KEY", // Replace with your API key if necessary
            clientId: clientId,
            scope: "https://www.googleapis.com/auth/drive.file",
        });
    });
}

// Initialize Google Sign-In
window.onload = function () {
    google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
    });
    google.accounts.id.renderButton(
        document.querySelector(".g_id_signin"),
        { theme: "outline", size: "large", text: "signin_with", logo_alignment: "left" }
    );
    google.accounts.id.prompt();
};

// File Handling Variables
let selectedFiles = [];

// File Selection
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");

fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files);
    displayFileList();
});

// Display Files
function displayFileList() {
    fileList.innerHTML = "";
    if (selectedFiles.length === 0) {
        fileList.innerText = "No files selected.";
        return;
    }
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <input type="checkbox" id="file-${index}" data-index="${index}">
            <label for="file-${index}">${file.name} (${(file.size / 1024).toFixed(2)} KB)</label>
        `;
        fileList.appendChild(fileItem);
    });
}

// Delete Selected Files
document.getElementById("deleteSelectedBtn").addEventListener("click", () => {
    const selectedCheckboxes = document.querySelectorAll(".file-item input[type='checkbox']:checked");
    selectedCheckboxes.forEach((checkbox) => {
        const index = parseInt(checkbox.getAttribute("data-index"));
        selectedFiles.splice(index, 1);
    });
    displayFileList();
});

// Upload Files
document.getElementById("uploadBtn").addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
        alert("No files to upload.");
        return;
    }

    const uploadStatus = document.getElementById("uploadStatus");
    uploadStatus.innerText = "Uploading files, please wait...";

    for (const file of selectedFiles) {
        try {
            await uploadFileToDrive(file);
            uploadStatus.innerText = `${file.name} uploaded successfully!`;
        } catch (error) {
            uploadStatus.innerText = `Error uploading ${file.name}: ${error.message}`;
        }
    }
    uploadStatus.innerText = "All files uploaded!";
    selectedFiles = []; // Clear file list after upload
    displayFileList();
});

// Google Drive Upload Function
async function uploadFileToDrive(file) {
    const token = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;

    const metadata = {
        name: file.name,
        mimeType: file.type,
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", file);

    const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
        method: "POST",
        headers: new Headers({ Authorization: `Bearer ${token}` }),
        body: formData,
    });

    if (!response.ok) {
        throw new Error("Upload failed");
    }
}
