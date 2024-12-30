// Google Sign-In Setup
const clientId = "147934510488-allie69121uoboqbr26nhql7u0205res.apps.googleusercontent.com";

function handleCredentialResponse(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    document.getElementById("fileInput").style.display = "block";
    document.getElementById("deleteSelectedBtn").style.display = "inline-block";
    document.getElementById("uploadBtn").style.display = "inline-block";
    document.getElementById("uploadStatus").innerText = `Welcome, ${payload.name}! Select files to upload.`;
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
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");

// File Selection
fileInput.addEventListener("change", () => {
    selectedFiles = Array.from(fileInput.files);
    displayFileList();
});

// Display Files
function displayFileList() {
    fileList.innerHTML = "";
    if (selectedFiles.length === 0) {
        fileList.innerText = "No files selected.";
        uploadBtn.disabled = true;
        return;
    }
    uploadBtn.disabled = false;

    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.innerHTML = `
            <span>${file.name} (${(file.size / 1024).toFixed(2)} KB)</span>
            <button class="delete-btn" data-index="${index}">Delete</button>
        `;
        fileList.appendChild(fileItem);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            const index = parseInt(e.target.getAttribute("data-index"));
            selectedFiles.splice(index, 1);
            displayFileList();
        });
    });
}

// Delete Selected Files
deleteSelectedBtn.addEventListener("click", () => {
    selectedFiles = [];
    displayFileList();
});

// Upload Files
uploadBtn.addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
        alert("No files selected. Please choose files first.");
        return;
    }

    uploadStatus.innerHTML = "";
    for (const file of selectedFiles) {
        const progressBar = document.createElement("div");
        progressBar.className = "progress-bar";
        progressBar.innerHTML = `
            <div class="progress-bar-inner" style="width: 0%;"></div>
            <span>${file.name} - Uploading...</span>
        `;
        uploadStatus.appendChild(progressBar);

        try {
            await uploadFileToDrive(file, progressBar);
            progressBar.querySelector(".progress-bar-inner").style.width = "100%";
            progressBar.querySelector("span").innerText = `${file.name} - Upload complete!`;
        } catch (error) {
            progressBar.querySelector("span").innerText = `${file.name} - Upload failed: ${error.message}`;
        }
    }

    selectedFiles = [];
    displayFileList();
});

// Google Drive Upload Function
async function uploadFileToDrive(file, progressBar) {
    const accessToken = gapi.auth.getToken().access_token;

    const metadata = {
        name: file.name,
        mimeType: file.type,
    };

    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.querySelector(".progress-bar-inner").style.width = `${percentComplete}%`;
        }
    };

    return new Promise((resolve, reject) => {
        xhr.onload = () => {
            if (xhr.status === 200) {
                resolve();
            } else {
                reject(new Error(xhr.statusText));
            }
        };
        xhr.onerror = () => reject(new Error("Network Error"));
        xhr.send(formData);
    });
}
