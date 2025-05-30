document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const addTopicBtn = document.getElementById("add-topic-btn");
  const addTopicModal = document.getElementById("add-topic-modal");
  const editContentModal = document.getElementById("edit-content-modal");
  const topicsList = document.getElementById("topics-list");
  const topicContent = document.getElementById("topic-content");

  let currentTopic = null;

  // Initialize Sortable for topics list only
  new Sortable(topicsList, {
    animation: 150,
    handle: ".drag-handle",
    onEnd: function () {
      saveTopicsOrder();
    },
  });

  // Load topics from localStorage
  function loadTopics() {
    console.log("Loading topics..."); // Debug
    const topics =
      JSON.parse(localStorage.getItem("documentation_topics")) || [];
    console.log("Topics from storage:", topics); // Debug
    topicsList.innerHTML = "";

    topics.forEach((topic) => {
      const topicElement = createTopicElement(topic);
      topicsList.appendChild(topicElement);
    });
  }

  // Create topic element with drag handle and delete button
  function createTopicElement(topic) {
    const div = document.createElement("div");
    div.className = "topic-item";
    div.innerHTML = `
      <i class="fas fa-grip-vertical drag-handle"></i>
      <span class="topic-title">${topic.title}</span>
      <div class="topic-description-tooltip">${topic.description}</div>
      <button class="delete-topic" title="Delete Topic">
        <i class="fas fa-trash"></i>
      </button>
    `;

    div.querySelector(".topic-title").onclick = (e) =>
      showTopicContent(topic, e.target);
    div.querySelector(".delete-topic").onclick = (e) => {
      e.stopPropagation();
      deleteTopic(topic);
    };

    return div;
  }

  // Delete topic
  function deleteTopic(topic) {
    if (confirm(`Are you sure you want to delete "${topic.title}"?`)) {
      const topics =
        JSON.parse(localStorage.getItem("documentation_topics")) || [];
      const updatedTopics = topics.filter((t) => t.id !== topic.id);
      localStorage.setItem(
        "documentation_topics",
        JSON.stringify(updatedTopics)
      );
      loadTopics();
    }
  }

  // Show topic content
  function showTopicContent(topic, clickedElement) {
    currentTopic = topic;

    // Remove active class from all topics
    document.querySelectorAll(".topic-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active class to clicked topic
    if (clickedElement) {
      clickedElement.closest(".topic-item").classList.add("active");
    }

    // Update content display
    topicContent.innerHTML = `
      <button class="edit-btn" title="Edit Content">
        <i class="fas fa-edit"></i>
      </button>
      <h2 class="content-title">${topic.title}</h2>
      <div class="topic-content">${topic.content || ""}</div>
    `;

    // Add edit button functionality
    topicContent.querySelector(".edit-btn").onclick = () =>
      openEditContentModal(topic);
  }

  // Tab switching functionality
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;

      // Update active states
      document
        .querySelectorAll(".tab-btn")
        .forEach((btn) => btn.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((content) => content.classList.remove("active"));

      button.classList.add("active");
      document
        .querySelector(`.tab-content[data-tab="${tab}"]`)
        .classList.add("active");
    });
  });

  // Save topics order
  function saveTopicsOrder() {
    const topics = Array.from(topicsList.children).map((item) => {
      const title = item.querySelector(".topic-title").textContent;
      return JSON.parse(localStorage.getItem("documentation_topics")).find(
        (t) => t.title === title
      );
    });
    localStorage.setItem("documentation_topics", JSON.stringify(topics));
  }

  // Add Topic Button click handler
  addTopicBtn.addEventListener("click", function () {
    console.log("Add Topic button clicked"); // Debug
    addTopicModal.style.display = "block";
  });

  // Handle topic form submission
  document
    .getElementById("topic-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Form submitted"); // Debug

      const title = document.getElementById("topic-title").value.trim();
      const description = document
        .getElementById("topic-description")
        .value.trim();

      if (title && description) {
        // Create new topic
        const newTopic = {
          id: Date.now(),
          title,
          description,
          content: "",
        };

        // Save to localStorage
        const topics =
          JSON.parse(localStorage.getItem("documentation_topics")) || [];
        topics.push(newTopic);
        localStorage.setItem("documentation_topics", JSON.stringify(topics));
        console.log("Saved new topic:", newTopic); // Debug

        // Add to UI
        const topicElement = createTopicElement(newTopic);
        topicsList.appendChild(topicElement);

        // Close modal and reset form
        addTopicModal.style.display = "none";
        document.getElementById("topic-form").reset();
      }
    });

  // Update the Edit Content Modal functionality
  function openEditContentModal(topic) {
    editContentModal.style.display = "block";
    // Set content in rich text editor only
    document.getElementById("rich-text-editor").innerHTML = topic.content || "";
  }

  // Update the content form submission handler
  document.getElementById("content-form").onsubmit = async (e) => {
    e.preventDefault();

    if (!currentTopic) return;

    // Get content from rich text editor only (remove markdown option)
    const content = document.getElementById("rich-text-editor").innerHTML;

    // Update topic content
    const topics =
      JSON.parse(localStorage.getItem("documentation_topics")) || [];
    const topicIndex = topics.findIndex((t) => t.id === currentTopic.id);

    if (topicIndex !== -1) {
      topics[topicIndex] = {
        ...topics[topicIndex],
        content,
      };

      // Save to localStorage
      localStorage.setItem("documentation_topics", JSON.stringify(topics));

      // Update UI
      showTopicContent(topics[topicIndex]);
    }

    // Close modal and reset form
    editContentModal.style.display = "none";
    document.getElementById("content-form").reset();
  };

  // Convert image to base64
  function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Add these modal close handlers if they're not working
  document.querySelectorAll(".close, .cancel-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.preventDefault();
      const modal = btn.closest(".modal");
      if (modal) {
        modal.style.display = "none";
        const form = modal.querySelector("form");
        if (form) form.reset();
      }
    };
  });

  // Close modal when clicking outside
  window.onclick = (e) => {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
      const form = e.target.querySelector("form");
      if (form) form.reset();
    }
  };

  // Initialize rich text editor buttons
  function initRichTextEditor() {
    const toolbar = document.querySelector(".rich-text-toolbar");
    const editor = document.getElementById("rich-text-editor");
    const imageUploadBtn = toolbar.querySelector(".image-upload-btn");
    const imageInput = document.getElementById("toolbar-image-upload");

    // Regular toolbar buttons
    toolbar.querySelectorAll("button[data-command]").forEach((button) => {
      button.addEventListener("click", () => {
        const command = button.dataset.command;
        document.execCommand(command, false, null);

        // Toggle active state for buttons
        if (["bold", "italic", "underline"].includes(command)) {
          button.classList.toggle("active");
        } else if (command.startsWith("justify")) {
          toolbar
            .querySelectorAll('[data-command^="justify"]')
            .forEach((btn) => btn.classList.remove("active"));
          button.classList.add("active");
        }
      });
    });

    // Update button states when editor content changes
    editor.addEventListener("keyup", updateToolbarState);
    editor.addEventListener("mouseup", updateToolbarState);

    function updateToolbarState() {
      // Check states of different formatting options
      toolbar
        .querySelector('[data-command="bold"]')
        .classList.toggle("active", document.queryCommandState("bold"));
      toolbar
        .querySelector('[data-command="italic"]')
        .classList.toggle("active", document.queryCommandState("italic"));
      toolbar
        .querySelector('[data-command="underline"]')
        .classList.toggle("active", document.queryCommandState("underline"));

      // Check alignment states
      const alignments = ["justifyLeft", "justifyCenter", "justifyRight"];
      alignments.forEach((align) => {
        toolbar
          .querySelector(`[data-command="${align}"]`)
          .classList.toggle("active", document.queryCommandState(align));
      });
    }

    // Image upload button
    imageUploadBtn.addEventListener("click", () => {
      imageInput.click();
    });

    imageInput.addEventListener("change", async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = await convertImageToBase64(file);

        // Insert image at cursor position
        insertImageAtCursor(imageUrl);

        // Add to image grid
        const imageGrid = document.getElementById("image-grid");
        const imageItem = createImageElement(imageUrl);
        imageGrid.appendChild(imageItem);

        // Reset input
        e.target.value = "";
      }
    });

    // Keep focus in editor when using toolbar buttons
    toolbar.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) {
        e.preventDefault();
      }
    });
  }

  // Initialize both editors
  initRichTextEditor();

  // Load topics on page load
  loadTopics();

  // Add image insertion at cursor position
  function insertImageAtCursor(imageUrl) {
    const editor = document.getElementById("rich-text-editor");
    const img = `<img src="${imageUrl}" alt="Inserted image" />`;

    if (document.activeElement === editor) {
      document.execCommand("insertHTML", false, img);
    } else {
      editor.innerHTML += img;
    }
  }

  // Add filter functionality
  const topicsFilter = document.getElementById("topics-filter");

  topicsFilter.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    const topics = document.querySelectorAll(".topic-item");
    let hasResults = false;

    topics.forEach((topic) => {
      const title = topic
        .querySelector(".topic-title")
        .textContent.toLowerCase();
      const description = topic
        .querySelector(".topic-description-tooltip")
        .textContent.toLowerCase();

      if (title.includes(searchTerm) || description.includes(searchTerm)) {
        topic.style.display = "flex";
        hasResults = true;
      } else {
        topic.style.display = "none";
      }
    });

    // Show/hide no results message
    const noResults =
      document.querySelector(".no-results") || createNoResultsElement();
    noResults.style.display = hasResults ? "none" : "block";
  });

  function createNoResultsElement() {
    const div = document.createElement("div");
    div.className = "no-results";
    div.textContent = "No topics found";
    topicsList.appendChild(div);
    return div;
  }

  // Clear filter when clicking the x button
  topicsFilter.addEventListener("search", function () {
    if (this.value === "") {
      document.querySelectorAll(".topic-item").forEach((topic) => {
        topic.style.display = "flex";
      });
      const noResults = document.querySelector(".no-results");
      if (noResults) noResults.style.display = "none";
    }
  });

  // Add import/export functionality
  document
    .getElementById("export-docs-btn")
    .addEventListener("click", function () {
      // Get documentation data from localStorage
      const docs = localStorage.getItem("documentation_topics");

      if (!docs) {
        alert("No documentation data to export!");
        return;
      }

      // Create blob and download link
      const blob = new Blob([docs], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      // Set filename with current date
      const date = new Date().toISOString().split("T")[0];
      a.download = `documentation_backup_${date}.json`;
      a.href = url;
      a.click();

      // Cleanup
      URL.revokeObjectURL(url);
    });

  document
    .getElementById("import-docs-btn")
    .addEventListener("click", function () {
      // Create file input
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = function (e) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          try {
            // Validate JSON format
            const data = JSON.parse(e.target.result);

            // Basic validation that it's documentation data
            if (!Array.isArray(data)) {
              throw new Error("Invalid documentation data format");
            }

            // Save to localStorage
            localStorage.setItem("documentation_topics", JSON.stringify(data));

            // Reload topics
            loadTopics();

            alert("Documentation imported successfully!");
          } catch (error) {
            alert("Error importing documentation: Invalid file format");
            console.error(error);
          }
        };

        reader.readAsText(file);
      };

      input.click();
    });
});
