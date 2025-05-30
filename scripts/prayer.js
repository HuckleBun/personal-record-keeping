// Initialize data from localStorage
let prayers = JSON.parse(localStorage.getItem("prayers")) || [];

// Save data to localStorage
function savePrayers() {
  try {
    localStorage.setItem("prayers", JSON.stringify(prayers));
  } catch (e) {
    console.error("Error saving prayers to localStorage:", e);
  }
}

// DOM Content Loaded Event Listener
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the page
  console.log("Prayer page initialized");
});
