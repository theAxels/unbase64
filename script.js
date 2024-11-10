document.getElementById("decodeButton").addEventListener("click", () => {
  const base64Input = document.getElementById("base64Input").value.trim();
  const loader = document.getElementById("loader");
  const resultContainer = document.getElementById("resultContainer");

  // Hide result and action buttons initially
  resultContainer.classList.add("d-none");

  // Show loader
  showLoader();

  // Delay decoding process to display loader
  setTimeout(() => {
    if (base64Input) {
      decodeBase64(base64Input);
    } else {
      showAlert("Please provide either Base64 text or upload a file.");
      hideLoader();
    }
  }, 500);
});

function decodeBase64(base64Data) {
  try {
    const decodedText = atob(base64Data);
    displayResult(decodedText, base64Data);
  } catch (e) {
    showAlert("Invalid Base64 input!");
    hideLoader();
  }
}

function displayResult(decodedText, base64Data) {
  const decodedOutput = document.getElementById("decodedOutput");
  const resultContainer = document.getElementById("resultContainer");
  const backgroundToggle = document.getElementById("toggleButton");
  const copyButton = document.getElementById("copyButton");
  const viewButton = document.getElementById("viewButton");

  // Clear previous content
  decodedOutput.innerHTML = "";

  if (isHTML(decodedText)) {
    decodedOutput.innerHTML = `
    <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-y: auto; max-height: 300px;">
      <code>${escapeHTML(decodedText)}</code>
    </pre>`;
    backgroundToggle.classList.add("d-none");
    viewButton.textContent = "Preview HTML"; // Rename button
    viewButton.classList.remove("d-none"); // Show Preview button for HTML
  } else if (isPDF(base64Data)) {
    if (base64Data.length > 2000) {
      // Check base64 data length before loading
      decodedOutput.innerHTML = `<iframe src="data:application/pdf;base64,${base64Data}" style="width:100%; height:600px;" frameborder="0"></iframe>`;
      checkIframeLoaded(decodedOutput.querySelector("iframe"));
    } else {
      showAlert("PDF data is too short or corrupted.", "warning");
    }
    copyButton.classList.add("d-none"); // Hide copy button for PDF
    backgroundToggle.classList.add("d-none");
    viewButton.classList.add("d-none"); // Hide Preview button for non-HTML
  } else if (isImage(base64Data)) {
    decodedOutput.innerHTML = `<img src="data:image/png;base64,${base64Data}" alt="Decoded Image" style="max-width: 100%;">`;
    copyButton.classList.add("d-none"); // Hide copy button for images
    viewButton.classList.add("d-none"); // Hide Preview button for non-HTML
  } else {
    decodedOutput.textContent = decodedText;
    backgroundToggle.classList.add("d-none");
    viewButton.classList.add("d-none"); // Hide Preview button for non-HTML
  }

  resultContainer.classList.remove("d-none");

  // Add event listeners for the action buttons
  setupActionButtons(decodedText, base64Data);
  hideLoader();
}

function escapeHTML(html) {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupActionButtons(decodedText, base64Data) {
  const copyButton = document.getElementById("copyButton");
  const downloadButton = document.getElementById("downloadButton");
  const viewButton = document.getElementById("viewButton");
  const backgroundToggle = document.getElementById("toggleButton");

  backgroundToggle.addEventListener("click", () => toggleBackground());

  // Set up the copy button
  copyButton.addEventListener("click", () => copyResult(decodedText));

  // Set up the download button
  downloadButton.addEventListener("click", () =>
    downloadResult(decodedText, base64Data)
  );

  // Set up the view button (only as "Preview HTML" for HTML content)
  if (isHTML(decodedText)) {
    viewButton.addEventListener("click", () => previewHTML(decodedText));
  }
}

function isHTML(decodedText) {
  return decodedText.trim().startsWith("<") && decodedText.includes("</");
}

function isImage(base64Data) {
  return /^iVBORw0KGgo|\/9j|R0lGODdh/.test(base64Data);
}

function isPDF(base64Data) {
  return base64Data.startsWith("JVBER");
}

function toggleBackground() {
  const imgContainer = document.querySelector("#decodedOutput");
  imgContainer.style.backgroundColor =
    imgContainer.style.backgroundColor === "black" ? "white" : "black";
}

function copyResult(decodedText) {
  navigator.clipboard.writeText(decodedText).then(() => {
    showAlert("Decoded text copied to clipboard!");
  });
}

function downloadResult(decodedText, base64Data) {
  let blob;
  let filename;

  if (isHTML(decodedText)) {
    blob = new Blob([decodedText], { type: "text/html" });
    filename = "[unBase64]_decoded_result.html";
  } else if (isPDF(base64Data)) {
    const byteArray = base64ToByteArray(base64Data);
    blob = new Blob([byteArray], { type: "application/pdf" });
    filename = "[unBase64]_decoded_document.pdf";
  } else if (isImage(base64Data)) {
    const byteArray = base64ToByteArray(base64Data);
    blob = new Blob([byteArray], { type: "image/png" });
    filename = "[unBase64]_decoded_image.png";
  } else {
    showAlert("Download is only supported for HTML, image, and PDF content.");
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();

  // Clean up
  URL.revokeObjectURL(url);
}

function base64ToByteArray(base64Data) {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}

function previewHTML(decodedText) {
  const newWindow = window.open();
  newWindow.document.write(decodedText);
  newWindow.document.close();
}

function viewFullscreen() {
  const decodedOutput = document.getElementById("decodedOutput");

  if (isHTML(decodedOutput.querySelector("#htmlPreview").innerHTML)) {
    const newWindow = window.open();
    newWindow.document.write(
      decodedOutput.querySelector("#htmlPreview").innerHTML
    );
    newWindow.document.close();
  } else if (decodedOutput.querySelector("img")) {
    const img = decodedOutput.querySelector("img");
    const newWindow = window.open(img.src);
    newWindow.document.write(
      `<img src="${img.src}" style="width:100%; height:100%;">`
    );
    newWindow.document.close();
  } else if (decodedOutput.querySelector("iframe")) {
    const iframe = decodedOutput.querySelector("iframe");
    if (iframe) {
      const newWindow = window.open(iframe.src);
      newWindow.document.write(
        `<iframe src="${iframe.src}" style="width:100%; height:100%;" frameborder="0"></iframe>`
      );
      newWindow.document.close();
      checkIframeLoaded(iframe);
    } else {
      showAlert(
        "Fullscreen view is only available for HTML, image, or PDF content.",
        "info"
      );
    }
  } else {
    showAlert(
      "Fullscreen view is only available for HTML, image, or PDF content.",
      "info"
    );
  }
}

function checkIframeLoaded(iframe) {
  if (iframe) {
    const pdfUrl = iframe.src;
    const maxUrlLength = 2000;
    if (pdfUrl.length > maxUrlLength) {
      showAlert(
        "PDF URL is too long. You can download the PDF instead.",
        "warning"
      );
    } else {
      iframe.onload = function () {
        if (!iframe.contentDocument.body.childNodes.length) {
          showAlert("PDF failed to load.", "warning");
        } else {
          showAlert("PDF loaded successfully!", "success");
        }
      };
    }
  }
}

function showAlert(message, type = "danger") {
  const alertContainer = document.createElement("div");
  alertContainer.className = `alert alert-${type} d-flex align-items-center`;
  alertContainer.role = "alert";
  alertContainer.innerHTML = `<span style="font-weight:bold; margin-right: 8px;">❗</span> ${message}`;
  document.querySelector(".container").prepend(alertContainer);

  setTimeout(() => alertContainer.remove(), 3000);
}

function showLoader() {
  document.getElementById("loader-overlay").style.display = "flex"; // Show overlay and loader
  document.body.style.overflow = "hidden"; // Disable scrolling
}

function hideLoader() {
  document.getElementById("loader-overlay").style.display = "none"; // Hide overlay and loader
  document.body.style.overflow = ""; // Re-enable scrolling
}