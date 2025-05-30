// Global variables
let notes = JSON.parse(localStorage.getItem("notes")) || [];
let categories = JSON.parse(localStorage.getItem("categories")) || [];
let activeNoteId = null;

// Global functions
function saveNotes() {
  try {
    localStorage.setItem("notes", JSON.stringify(notes));
  } catch (e) {
    console.error("Error saving notes to localStorage:", e);
  }
}

function saveCategories() {
  try {
    localStorage.setItem("categories", JSON.stringify(categories));
  } catch (e) {
    console.error("Error saving categories to localStorage:", e);
  }
}

function renderNotes() {
  const notesList = document.getElementById("notes-list");
  const searchInput = document.getElementById("search-notes");
  const categoryFilter = document.getElementById("category-filter");

  const searchTerm = searchInput.value.toLowerCase();
  const selectedTag = categoryFilter.value;

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm);
    const matchesTag =
      selectedTag === "all" || (note.tags && note.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  notesList.innerHTML = filteredNotes
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(
      (note) => `
                <div class="note-item ${
                  note.id === activeNoteId ? "active" : ""
                }" 
                     onclick="selectNote(${note.id})">
                    <h3>${note.title}</h3>
                    <div class="tags">
                        ${
                          note.tags
                            ? note.tags
                                .map((tag) => `<span class="tag">${tag}</span>`)
                                .join("")
                            : ""
                        }
                    </div>
                    <div class="timestamp">
                        Last updated: ${new Date(
                          note.updatedAt
                        ).toLocaleString()}
                    </div>
                </div>
            `
    )
    .join("");
}

window.selectNote = function (noteId) {
  const noteContent = document.getElementById("note-content");
  activeNoteId = noteId;
  const note = notes.find((n) => n.id === noteId);
  if (note) {
    noteContent.innerHTML = `
            <div class="note-header">
                <div class="note-title">
                    <h2>${note.title}</h2>
                    <div class="tags">
                        ${
                          note.tags
                            ? note.tags
                                .map((tag) => `<span class="tag">${tag}</span>`)
                                .join("")
                            : ""
                        }
                    </div>
                </div>
                <div class="note-actions">
                    <button onclick="editNote(${
                      note.id
                    })" class="secondary-btn">
                        <i class="fas fa-edit"></i>Edit
                    </button>
                    <button onclick="deleteNote(${
                      note.id
                    })" class="secondary-btn">
                        <i class="fas fa-trash"></i>Delete
                    </button>
                </div>
            </div>
            <div class="note-body">
                ${note.content}
            </div>
        `;
  }
  renderNotes();
};

// Keep the DOMContentLoaded event for initialization
document.addEventListener("DOMContentLoaded", function () {
  // Initialize event listeners and UI
  renderNotes();
  updateCategorySelects();

  // DOM Elements
  const newNoteBtn = document.getElementById("new-note-btn");
  const noteModal = document.getElementById("note-modal");
  const noteForm = document.getElementById("note-form");
  const notesList = document.getElementById("notes-list");
  const noteContent = document.getElementById("note-content");
  const searchInput = document.getElementById("search-notes");
  const categoryFilter = document.getElementById("category-filter");
  const exportBtn = document.getElementById("export-btn");
  const importBtn = document.getElementById("import-btn");
  const closeButtons = document.querySelectorAll(".close");
  const cancelButtons = document.querySelectorAll(".cancel-btn");
  const addCategoryBtn = document.getElementById("add-category-btn");
  const newCategoryInput = document.getElementById("new-category-input");
  const manageCategoriesBtn = document.getElementById("manage-categories-btn");

  // Add this after DOM Elements
  const noteTagsSelect = document.getElementById("note-tags");

  // Load data from localStorage
  notes = JSON.parse(localStorage.getItem("notes")) || [];
  categories = JSON.parse(localStorage.getItem("categories")) || [];

  // Save initial data if empty
  if (!localStorage.getItem("notes")) {
    localStorage.setItem("notes", JSON.stringify(notes));
  }
  if (!localStorage.getItem("categories")) {
    localStorage.setItem("categories", JSON.stringify(categories));
  }

  // Modal handling
  function closeModal(modalElement) {
    modalElement.style.display = "none";
    const form = modalElement.querySelector("form");
    if (form) {
      form.reset();
      if (form.id === "note-form") {
        document.getElementById("note-editor").innerHTML = "";
        const previewEl = document.querySelector(".selected-tags-preview");
        if (previewEl) previewEl.innerHTML = "";
      }
    }
  }

  // Close modal when clicking outside
  window.onclick = function (event) {
    if (event.target.classList.contains("modal")) {
      closeModal(event.target);
    }
  };

  // Close and cancel buttons
  closeButtons.forEach((btn) => {
    btn.onclick = () => closeModal(btn.closest(".modal"));
  });

  cancelButtons.forEach((btn) => {
    btn.onclick = () => closeModal(btn.closest(".modal"));
  });

  // Rich text editor functionality
  document.querySelectorAll(".rich-text-toolbar button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const command = button.dataset.command;
      document.execCommand(command, false, null);
      updateToolbarButtonStates();
    });
  });

  // Add event listener to the editor for real-time updates
  document
    .getElementById("note-editor")
    .addEventListener("keyup", updateToolbarButtonStates);
  document
    .getElementById("note-editor")
    .addEventListener("mouseup", updateToolbarButtonStates);

  // New note button
  newNoteBtn.onclick = () => {
    // Reset form and clear any previous data
    noteForm.reset();
    document.getElementById("note-editor").innerHTML = "";
    noteForm.dataset.mode = "create";
    activeNoteId = null; // Clear any active note

    // Show modal
    noteModal.style.display = "block";
  };

  // Note form submission
  noteForm.onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById("note-title").value;
    const selectedTags = Array.from(
      document.getElementById("note-tags").selectedOptions
    ).map((option) => option.value);
    const content = document.getElementById("note-editor").innerHTML;
    const mode = noteForm.dataset.mode;

    if (mode === "edit" && activeNoteId) {
      // Update existing note
      const noteIndex = notes.findIndex((n) => n.id === activeNoteId);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          title,
          tags: selectedTags,
          content,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      // Create new note
      const newNote = {
        id: Date.now(),
        title,
        tags: selectedTags,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      notes.push(newNote);
    }

    saveNotes();
    renderNotes();
    closeModal(noteModal);
    showSuccessModal(
      mode === "edit"
        ? "Note updated successfully!"
        : "Note created successfully!"
    );
  };

  // Search functionality
  searchInput.oninput = () => {
    renderNotes();
  };

  // Category filter
  categoryFilter.onchange = () => {
    renderNotes();
  };

  // Export/Import functionality
  exportBtn.onclick = () => {
    const data = {
      notes,
      categories,
    };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

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
          notes = data.notes;
          categories = data.categories;
          saveNotes();
          saveCategories();
          renderNotes();
          updateCategorySelects();
          showSuccessModal("Data imported successfully!");
        } catch (error) {
          showSuccessModal("Error: Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  function updateCategorySelects() {
    const tagSelect = document.getElementById("note-tags");
    const filterSelect = document.getElementById("category-filter");

    // Update filter dropdown
    filterSelect.innerHTML = `
            <option value="all">All Tags</option>
            ${categories
              .map(
                (cat) => `
            <option value="${cat}">${cat}</option>
        `
              )
              .join("")}
        `;

    // Update tags multiselect
    tagSelect.innerHTML = categories
      .map(
        (cat) => `
        <option value="${cat}">${cat}</option>
    `
      )
      .join("");
  }

  // Update editNote function to handle tag preview
  window.editNote = function (noteId) {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      document.getElementById("note-title").value = note.title;
      document.getElementById("note-editor").innerHTML = note.content;

      // Set selected tags
      const tagSelect = document.getElementById("note-tags");
      Array.from(tagSelect.options).forEach((option) => {
        option.selected = note.tags && note.tags.includes(option.value);
      });

      noteForm.dataset.mode = "edit";
      activeNoteId = noteId;
      noteModal.style.display = "block";
    }
  };

  window.deleteNote = function (noteId) {
    showConfirmModal("Are you sure you want to delete this note?", () => {
      notes = notes.filter((n) => n.id !== noteId);
      saveNotes();
      if (activeNoteId === noteId) {
        activeNoteId = null;
        noteContent.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-sticky-note"></i>
                        <p>Select a note to view or create a new one</p>
                    </div>
                `;
      }
      renderNotes();
      showSuccessModal("Note deleted successfully!");
    });
  };

  // Add these functions near the top with other modal handling functions
  function showSuccessModal(message) {
    document.getElementById("success-message").textContent = message;
    document.getElementById("success-modal").style.display = "block";
  }

  window.closeSuccessModal = function () {
    document.getElementById("success-modal").style.display = "none";
  };

  let confirmCallback = null;

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

  // Add these near your other modal-related code
  function showAddCategoryModal() {
    document.getElementById("add-category-modal").style.display = "block";
    document.getElementById("new-category-input").value = "";
    // Focus the input when modal opens
    setTimeout(() => {
      document.getElementById("new-category-input").focus();
    }, 100);
  }

  window.closeAddCategoryModal = function (confirmed) {
    const modal = document.getElementById("add-category-modal");
    if (confirmed) {
      const input = document.getElementById("new-category-input");
      const categoryName = input.value.trim();
      if (categoryName) {
        if (!categories.includes(categoryName)) {
          categories.push(categoryName);
          saveCategories();
          updateCategorySelects();
          // Refresh the manage tags modal immediately
          const categoriesList = document.getElementById("categories-list");
          categoriesList.innerHTML = categories
            .map(
              (category) => `
                        <div class="category-item">
                            <span>${category}</span>
                            <button onclick="deleteCategory('${category}')" class="delete-category-btn">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `
            )
            .join("");
          showSuccessModal("Tag added successfully!");
        } else {
          showSuccessModal("This tag already exists!");
        }
      }
    }
    modal.style.display = "none";
  };

  // Update the addNewCategory function
  function addNewCategory() {
    showAddCategoryModal();
  }

  // Add keyboard event listener for the new category input
  newCategoryInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      closeAddCategoryModal(true);
    } else if (event.key === "Escape") {
      closeAddCategoryModal(false);
    }
  });

  // Add this near the other event listeners
  addCategoryBtn.onclick = (e) => {
    e.preventDefault();
    showAddCategoryModal();
  };

  // Add this function to handle managing categories
  function showManageCategoriesModal() {
    const modal = document.getElementById("manage-categories-modal");
    const categoriesList = document.getElementById("categories-list");

    // Populate current categories
    categoriesList.innerHTML = categories
      .map(
        (category) => `
        <div class="category-item">
            <span>${category}</span>
            <button onclick="deleteCategory('${category}')" class="delete-category-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `
      )
      .join("");

    modal.style.display = "block";
  }

  // Update the deleteCategory function
  window.deleteCategory = function (categoryName) {
    showConfirmModal(
      `Are you sure you want to delete the tag "${categoryName}"?`,
      () => {
        // Remove category from categories array
        categories = categories.filter((cat) => cat !== categoryName);

        // Remove this category from all notes that use it
        notes = notes.map((note) => ({
          ...note,
          tags: note.tags
            ? note.tags.filter((tag) => tag !== categoryName)
            : [],
        }));

        saveCategories();
        saveNotes();
        updateCategorySelects();
        renderNotes();
        showManageCategoriesModal(); // Refresh the modal
      }
    );
  };

  // Add the click handler
  manageCategoriesBtn.onclick = showManageCategoriesModal;

  // Add this function to check and update button states
  function updateToolbarButtonStates() {
    document.querySelectorAll(".rich-text-toolbar button").forEach((button) => {
      const command = button.dataset.command;
      if (document.queryCommandState(command)) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });
  }
});
