document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const createTemplateBtn = document.getElementById("create-template-btn");
  const newChecklistBtn = document.getElementById("new-checklist-btn");
  const templateModal = document.getElementById("template-modal");
  const checklistModal = document.getElementById("checklist-modal");
  const templateForm = document.getElementById("template-form");
  const checklistForm = document.getElementById("checklist-form");
  const templateItems = document.getElementById("template-items");
  const addItemBtn = document.getElementById("add-item-btn");
  const closeButtons = document.querySelectorAll(".close");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");

  // Initialize templates and checklists from localStorage
  let templates = JSON.parse(localStorage.getItem("checklist_templates")) || [];
  let checklists = JSON.parse(localStorage.getItem("active_checklists")) || [];

  // Debug log
  console.log("Initial templates:", templates);

  // Initial render - moved to top to ensure templates are displayed on page load
  renderTemplates();
  renderChecklists();

  // Event Listeners
  createTemplateBtn.onclick = () => (templateModal.style.display = "block");
  newChecklistBtn.onclick = () => {
    populateTemplateSelect();
    checklistModal.style.display = "block";
  };

  // Update modal closing functionality
  function closeModal(modalElement) {
    modalElement.style.display = "none";
    // Reset forms if they exist in the modal
    const form = modalElement.querySelector("form");
    if (form) {
      form.reset();
      if (form.id === "template-form") {
        templateItems.innerHTML = "";
      }
    }
  }

  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
      closeModal(event.target);
    }
  };

  // Close button functionality
  closeButtons.forEach((btn) => {
    btn.onclick = () => {
      const modal = btn.closest(".modal");
      closeModal(modal);
    };
  });

  // Cancel button functionality
  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.onclick = () => {
      const modal = btn.closest(".modal");
      closeModal(modal);
    };
  });

  // Add template item
  addItemBtn.onclick = () => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "template-item";
    itemDiv.innerHTML = `
      <i class="fas fa-grip-vertical drag-handle"></i>
      <input type="text" placeholder="Enter item description" required />
      <button type="button" class="remove-item" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;
    templateItems.appendChild(itemDiv);
  };

  // Define template actions in global scope
  window.editTemplate = function (templateId) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Populate modal with template data
      document.getElementById("template-name").value = template.name;
      templateItems.innerHTML = template.items
        .map(
          (item) => `
        <div class="template-item">
          <i class="fas fa-grip-vertical drag-handle"></i>
          <input type="text" value="${item}" required />
          <button type="button" class="remove-item" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `
        )
        .join("");

      // Update form submission to handle edit
      templateForm.onsubmit = (e) => {
        e.preventDefault();
        const updatedName = document.getElementById("template-name").value;
        const updatedItems = Array.from(
          templateItems.querySelectorAll("input")
        ).map((input) => input.value);

        // Update template
        template.name = updatedName;
        template.items = updatedItems;

        saveTemplates();
        renderTemplates();
        templateModal.style.display = "none";
        templateForm.reset();
        templateItems.innerHTML = "";

        // Reset form submission to handle new templates
        setupNewTemplateSubmission();
      };

      templateModal.style.display = "block";
    }
  };

  // Add these functions to handle the modals
  let confirmCallback = null;

  function showSuccessModal(message) {
    document.getElementById("success-message").textContent = message;
    document.getElementById("success-modal").style.display = "block";
  }

  window.closeSuccessModal = function () {
    document.getElementById("success-modal").style.display = "none";
  };

  function showConfirmModal(message, callback) {
    document.getElementById("confirm-message").textContent = message;
    document.getElementById("confirm-modal").style.display = "block";
    confirmCallback = callback;
  }

  window.closeConfirmModal = function (confirmed) {
    document.getElementById("confirm-modal").style.display = "none";
    if (confirmCallback && confirmed) {
      confirmCallback();
    }
    confirmCallback = null;
  };

  // Function to setup new template submission
  function setupNewTemplateSubmission() {
    templateForm.onsubmit = (e) => {
      e.preventDefault();
      const templateName = document.getElementById("template-name").value;
      const items = Array.from(templateItems.querySelectorAll("input")).map(
        (input) => input.value
      );

      const newTemplate = {
        id: Date.now(),
        name: templateName,
        items: items,
      };

      templates.push(newTemplate);
      saveTemplates();
      renderTemplates();
      templateModal.style.display = "none";
      templateForm.reset();
      templateItems.innerHTML = "";
    };
  }

  // Initialize with new template submission handling
  setupNewTemplateSubmission();

  // Create new checklist
  checklistForm.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("checklist-name").value;
    const templateId = document.getElementById("template-select").value;
    const template = templates.find((t) => t.id === parseInt(templateId));

    const newChecklist = {
      id: Date.now(),
      name: name,
      templateId: template.id,
      items: template.items.map((item) => ({
        text: item,
        completed: false,
        timestamp: null,
      })),
      startTime: new Date().toISOString(),
      completedTime: null,
    };

    checklists.push(newChecklist);
    saveChecklists();
    renderChecklists();
    checklistModal.style.display = "none";
    checklistForm.reset();
  };

  // Helper functions
  function saveTemplates() {
    localStorage.setItem("checklist_templates", JSON.stringify(templates));
  }

  function saveChecklists() {
    localStorage.setItem("active_checklists", JSON.stringify(checklists));
  }

  function renderTemplates() {
    const templatesList = document.getElementById("templates-list");
    console.log("Rendering templates:", templates); // Debug log
    templatesList.innerHTML = templates
      .map(
        (template) => `
      <div class="template-item">
        <span>${template.name}</span>
        <div class="template-actions">
          <button class="edit-btn" onclick="editTemplate(${template.id})" title="Edit Template">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-btn" onclick="deleteTemplate(${template.id})" title="Delete Template">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join("");
  }

  function renderChecklists() {
    const checklistsContainer = document.getElementById("active-checklists");
    checklistsContainer.innerHTML = checklists
      .map((checklist) => {
        const progress = calculateProgress(checklist);
        return `
        <div class="checklist-card">
          <h3>
            ${checklist.name}
            <div class="checklist-actions">
              <span class="completion">${progress}%</span>
              <button class="delete-checklist-btn" onclick="deleteChecklist(${
                checklist.id
              })" title="Delete Checklist">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </h3>
          <div class="checklist-progress">
            <div class="progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="checklist-items">
            ${renderChecklistItems(checklist)}
          </div>
        </div>
      `;
      })
      .join("");
  }

  function renderChecklistItems(checklist) {
    return checklist.items
      .map(
        (item, index) => `
      <div class="checklist-item ${item.completed ? "completed" : ""}">
        <input 
          type="checkbox" 
          ${item.completed ? "checked" : ""} 
          onchange="toggleItem(${checklist.id}, ${index})"
        />
        <span>${item.text}</span>
      </div>
    `
      )
      .join("");
  }

  function calculateProgress(checklist) {
    const completed = checklist.items.filter((item) => item.completed).length;
    return Math.round((completed / checklist.items.length) * 100);
  }

  // Export/Import functionality
  exportBtn.onclick = () => {
    const data = {
      templates: templates,
      checklists: checklists,
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklists_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
  };

  // Update the import success alert
  importBtn.onclick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          templates = data.templates;
          checklists = data.checklists;
          saveTemplates();
          saveChecklists();
          renderTemplates();
          renderChecklists();
          showSuccessModal("Data imported successfully!");
        } catch (error) {
          showSuccessModal("Error: Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Add this function to populate the template select dropdown
  function populateTemplateSelect() {
    const templateSelect = document.getElementById("template-select");
    templateSelect.innerHTML = templates
      .map(
        (template) => `
            <option value="${template.id}">${template.name}</option>
        `
      )
      .join("");
  }

  // Add this function to handle checklist item toggling
  window.toggleItem = function (checklistId, itemIndex) {
    const checklist = checklists.find((c) => c.id === checklistId);
    if (checklist) {
      checklist.items[itemIndex].completed =
        !checklist.items[itemIndex].completed;
      checklist.items[itemIndex].timestamp = new Date().toISOString();

      if (checklist.items.every((item) => item.completed)) {
        checklist.completedTime = new Date().toISOString();
      } else {
        checklist.completedTime = null;
      }

      saveChecklists();
      renderChecklists();
    }
  };

  // Update the delete confirmations
  window.deleteTemplate = function (templateId) {
    showConfirmModal("Are you sure you want to delete this template?", () => {
      templates = templates.filter((t) => t.id !== templateId);
      saveTemplates();
      renderTemplates();
    });
  };

  window.deleteChecklist = function (checklistId) {
    showConfirmModal("Are you sure you want to delete this checklist?", () => {
      checklists = checklists.filter((c) => c.id !== checklistId);
      saveChecklists();
      renderChecklists();
    });
  };
});
