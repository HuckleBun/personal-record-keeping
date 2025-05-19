// Add these storage management functions at the top of the file
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
    alert(
      "There was an error saving your data. Please make sure you have enough storage space."
    );
  }
}

function loadFromStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading from localStorage: ${error}`);
    return defaultValue;
  }
}

// Update the initial data loading
let cases = loadFromStorage("dispositionCases");
const clients = loadFromStorage("dispositionClients");

// DOM Elements
const addCaseBtn = document.getElementById("add-case-btn");
const addCaseModal = document.getElementById("add-case-modal");
const viewCaseModal = document.getElementById("view-case-modal");
const deleteConfirmModal = document.getElementById("delete-confirm-modal");
const caseForm = document.getElementById("case-form");
const casesContainer = document.getElementById("cases-container");
const submitBtn = document.querySelector(".submit-btn");
const closeButtons = document.querySelectorAll(".close");
const cancelButtons = document.querySelectorAll(".cancel-btn");
const caseFilter = document.getElementById("case-filter");
const clientSelect = document.getElementById("client-select");
const addClientBtn = document.querySelector(".add-client-btn");
const removeClientBtn = document.querySelector(".remove-client-btn");
const addClientModal = document.getElementById("add-client-modal");
const newClientInput = document.getElementById("new-client-name");
const confirmAddClientBtn = document.getElementById("confirm-add-client");

// Form Elements
const caseNameInput = document.getElementById("case-name");
const adminDataSelect = document.getElementById("admin-data");
const originalDataSelect = document.getElementById("original-data");
const deliveryRadios = document.getElementsByName("delivery");
const caseFileInput = document.getElementById("case-file");

// Event Listeners
addCaseBtn.addEventListener("click", () => {
  addCaseModal.style.display = "block";
});

// Close modals when clicking close button or cancel button
closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    addCaseModal.style.display = "none";
    viewCaseModal.style.display = "none";
    deleteConfirmModal.style.display = "none";
    resetFileLabel();
  });
});

cancelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    addCaseModal.style.display = "none";
    viewCaseModal.style.display = "none";
    deleteConfirmModal.style.display = "none";
    resetFileLabel();
  });
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
  if (
    e.target === addCaseModal ||
    e.target === viewCaseModal ||
    e.target === deleteConfirmModal
  ) {
    addCaseModal.style.display = "none";
    viewCaseModal.style.display = "none";
    deleteConfirmModal.style.display = "none";
    resetFileLabel();
  }
});

// Form validation
function validateForm() {
  const isNameValid = caseNameInput.value.trim() !== "";
  const isAdminDataValid = adminDataSelect.value !== "";
  const isOriginalDataValid = originalDataSelect.value !== "";
  const isDeliveryValid = Array.from(deliveryRadios).some(
    (radio) => radio.checked
  );
  const isFileValid = caseFileInput.files.length > 0;

  // Add console.log for debugging
  console.log({
    isNameValid,
    isAdminDataValid,
    isOriginalDataValid,
    isDeliveryValid,
    isFileValid,
  });

  submitBtn.disabled = !(
    isNameValid &&
    isAdminDataValid &&
    isOriginalDataValid &&
    isDeliveryValid &&
    isFileValid
  );
}

// Add event listeners for form validation
[
  caseNameInput,
  adminDataSelect,
  originalDataSelect,
  ...deliveryRadios,
  caseFileInput,
].forEach((element) => {
  element.addEventListener("change", validateForm);
  if (element.type === "text") {
    element.addEventListener("input", validateForm);
  }
});

// Add event listener for file input change
caseFileInput.addEventListener("change", function () {
  const fileName = this.files[0]?.name || "Choose a file";
  this.nextElementSibling.querySelector("span").textContent = fileName;
});

// Add this function after the file input change listener
function resetFileLabel() {
  const fileLabel = caseFileInput.nextElementSibling.querySelector("span");
  fileLabel.textContent = "Choose a file";
}

// Handle form submission
caseForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const file = caseFileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const base64File = e.target.result.split(",")[1];

      const newCase = {
        id: Date.now(),
        name: caseNameInput.value.trim(),
        client: clientSelect.value,
        adminData: adminDataSelect.value,
        originalData: originalDataSelect.value,
        delivery: Array.from(deliveryRadios).find((radio) => radio.checked)
          .value,
        fileName: file.name,
        fileType: file.type,
        fileData: base64File,
      };

      cases.push(newCase);
      saveToStorage("dispositionCases", cases);

      renderCases();
      addCaseModal.style.display = "none";
      caseForm.reset();
      resetFileLabel();
      submitBtn.disabled = true;
    };

    reader.readAsDataURL(file);
  } catch (error) {
    console.error("Error processing file:", error);
    alert("There was an error processing the file. Please try again.");
  }
});

// Filter cases
function filterCases() {
  const filterText = caseFilter.value.toLowerCase();
  const filteredCases = cases.filter((case_) =>
    case_.name.toLowerCase().includes(filterText)
  );

  renderCases(filteredCases);
}

// Render cases
function renderCases(casesToRender = cases) {
  // Group cases by client
  const casesByClient = casesToRender.reduce((acc, case_) => {
    if (!acc[case_.client]) {
      acc[case_.client] = [];
    }
    acc[case_.client].push(case_);
    return acc;
  }, {});

  // Generate HTML for each client section
  casesContainer.innerHTML = Object.entries(casesByClient)
    .map(
      ([client, clientCases]) => `
      <div class="client-section">
        <h2>${client}</h2>
        <div class="cases-container">
          ${clientCases
            .map(
              (case_) => `
            <div class="case-card" data-id="${case_.id}">
              <button class="delete-case" title="Delete Case">
                <i class="fas fa-trash"></i>
              </button>
              <h3>${case_.name}</h3>
              <div class="case-info">
                <div>Administrative Data: ${case_.adminData}</div>
                <div>Original Data: ${case_.originalData}</div>
                <div>Delivery Method: ${case_.delivery}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");

  // Add event listeners to cards and delete buttons
  document.querySelectorAll(".case-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".delete-case")) {
        viewCase(card.dataset.id);
      }
    });
  });

  document.querySelectorAll(".delete-case").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      confirmDelete(button.closest(".case-card").dataset.id);
    });
  });
}

// View case details
function viewCase(id) {
  const case_ = cases.find((c) => c.id === parseInt(id));

  document.getElementById("view-case-name").textContent = case_.name;
  document.getElementById("view-admin-data").textContent = case_.adminData;
  document.getElementById("view-original-data").textContent =
    case_.originalData;
  document.getElementById("view-delivery").textContent = case_.delivery;
  document.getElementById("view-filename").textContent = case_.fileName;

  const downloadBtn = document.getElementById("download-file");
  downloadBtn.onclick = () => downloadFile(case_);

  viewCaseModal.style.display = "block";
}

// Download file
function downloadFile(case_) {
  const binary = atob(case_.fileData);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: case_.fileType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = case_.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Confirm delete
function confirmDelete(id) {
  deleteConfirmModal.style.display = "block";

  document.getElementById("confirm-delete-btn").onclick = () => {
    cases = cases.filter((c) => c.id !== parseInt(id));
    saveToStorage("dispositionCases", cases);
    renderCases();
    deleteConfirmModal.style.display = "none";
  };

  document.getElementById("cancel-delete-btn").onclick = () => {
    deleteConfirmModal.style.display = "none";
  };
}

// Add event listener for filter input
caseFilter.addEventListener("input", filterCases);

// Load clients into select
function loadClients() {
  clientSelect.innerHTML = `
    <option value="">Select client</option>
    ${clients
      .map((client) => `<option value="${client}">${client}</option>`)
      .join("")}
  `;
}

// Add client
addClientBtn.addEventListener("click", () => {
  addClientModal.style.display = "block";
});

confirmAddClientBtn.addEventListener("click", () => {
  const clientName = newClientInput.value.trim();
  if (clientName && !clients.includes(clientName)) {
    clients.push(clientName);
    saveToStorage("dispositionClients", clients);
    loadClients();
    addClientModal.style.display = "none";
    newClientInput.value = "";
  }
});

// Remove client
removeClientBtn.addEventListener("click", () => {
  const selectedClient = clientSelect.value;
  if (
    selectedClient &&
    confirm(`Are you sure you want to remove ${selectedClient}?`)
  ) {
    const index = clients.indexOf(selectedClient);
    clients.splice(index, 1);
    saveToStorage("dispositionClients", clients);
    loadClients();
    renderCases();
  }
});

// Initial render
renderCases();

// Initialize clients
loadClients();

// Add a storage cleanup function
function clearStorageData() {
  if (
    confirm(
      "Are you sure you want to clear all stored data? This cannot be undone."
    )
  ) {
    localStorage.removeItem("dispositionCases");
    localStorage.removeItem("dispositionClients");
    cases = [];
    clients.length = 0;
    renderCases();
    loadClients();
  }
}

// Add error boundary for storage quota exceeded
window.addEventListener("storage", (e) => {
  if (e.storageArea === localStorage) {
    if (e.quota && e.quota < e.usage) {
      alert("Storage quota exceeded. Please delete some items to continue.");
    }
  }
});
