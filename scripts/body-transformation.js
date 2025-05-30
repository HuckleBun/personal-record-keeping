// Initialize charts
let charts = {};

// Add to the top of the file with other state variables
let lastMeasurementBackup = null;
let expandedChart = null;
let currentMetric = null;

// Body transformation page functionality will be added here
document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM Content Loaded");

  // Initialize charts first
  await initializeCharts();

  // Initialize goals from localStorage or set defaults
  if (!localStorage.getItem("fitnessGoals")) {
    const defaultGoals = {
      water: 128, // 1 gallon in oz
      protein: 160, // grams
      calories: 2000,
    };
    localStorage.setItem("fitnessGoals", JSON.stringify(defaultGoals));
  }

  // Initialize water tracking buttons
  const quickAddButtons = document.querySelectorAll(".quick-add .add-btn");
  console.log("Found quick add buttons:", quickAddButtons.length);

  quickAddButtons.forEach((button) => {
    console.log("Adding click listener to button:", button.textContent);
    button.addEventListener("click", function () {
      console.log("Button clicked:", this.dataset.amount);
      const amount = parseInt(this.dataset.amount);
      if (!amount) {
        console.error("Invalid amount:", this.dataset.amount);
        return;
      }
      addWater(amount);
    });
  });

  // Set up date and load initial data
  const today = new Date();
  const dateInput = document.getElementById("selected-date");
  dateInput.valueAsDate = today;

  // Add event listeners for date navigation
  document.getElementById("prev-date").addEventListener("click", () => {
    const dateInput = document.getElementById("selected-date");
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() - 1);
    dateInput.valueAsDate = currentDate;
    loadDailyData(currentDate);
  });

  document.getElementById("next-date").addEventListener("click", () => {
    const dateInput = document.getElementById("selected-date");
    const currentDate = new Date(dateInput.value);
    currentDate.setDate(currentDate.getDate() + 1);
    dateInput.valueAsDate = currentDate;
    loadDailyData(currentDate);
  });

  document.getElementById("selected-date").addEventListener("change", (e) => {
    loadDailyData(new Date(e.target.value));
  });

  // Initialize activity checkboxes
  initializeActivityTracking();

  // Initialize modal buttons and forms
  initializeModals();

  // Initialize streak
  updateStreak();

  // Initialize measurements modal
  initializeMeasurementsModal();

  // Load initial data after everything is set up
  loadDailyData(today);

  // Update measurements when date changes
  document.getElementById("selected-date").addEventListener("change", (e) => {
    updateMeasurements(e.target.value);
  });

  // Initialize undo button
  const undoBtn = document.getElementById("undo-measurement");
  undoBtn.addEventListener("click", undoLastMeasurement);
  updateUndoButton();

  // Add date change listener for undo button state
  document
    .getElementById("selected-date")
    .addEventListener("change", updateUndoButton);

  // Initialize expanded graph modal
  initializeExpandedGraphModal();
});

// Initialize activity tracking
function initializeActivityTracking() {
  const checkboxes = [
    "water-done",
    "nutrition-done",
    "workout-done",
    "cardio-done",
    "prayer-done",
    "bible-done",
    "creatine-done",
  ].map((id) => document.getElementById(id));

  // Add event listeners to checkboxes
  checkboxes.forEach((checkbox) => {
    if (!checkbox) {
      console.error(`Checkbox with id ${checkbox} not found`);
      return;
    }

    checkbox.addEventListener("change", function () {
      const date = document.getElementById("selected-date").value;
      const activityType = this.id.replace("-done", "");
      saveActivityStatus(date, activityType, this.checked);
    });
  });
}

// Save activity status to localStorage
function saveActivityStatus(date, activityType, completed) {
  const key = `activity_${date}`;
  let activities = JSON.parse(localStorage.getItem(key) || "{}");
  activities[activityType] = completed;
  localStorage.setItem(key, JSON.stringify(activities));

  // Update streak after saving activity
  updateStreak();
}

// Check if all activities are completed for a given date
function areAllActivitiesCompleted(date) {
  const activities = JSON.parse(
    localStorage.getItem(`activity_${date}`) || "{}"
  );
  const requiredActivities = [
    "water",
    "nutrition",
    "workout",
    "cardio",
    "prayer",
    "bible",
    "creatine",
  ];
  return requiredActivities.every((activity) => activities[activity] === true);
}

// Calculate and update streak
function updateStreak() {
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

  let streakCount = 0;
  let checkDate = new Date(currentDate);

  // Check previous days until we find a break in the streak
  while (true) {
    const dateStr = checkDate.toISOString().split("T")[0];

    // If we find a day where not all activities were completed, break
    if (!areAllActivitiesCompleted(dateStr)) {
      break;
    }

    streakCount++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Update the streak display
  const streakElement = document.getElementById("streak-count");
  if (streakElement) {
    const oldStreak = parseInt(streakElement.textContent) || 0;
    streakElement.textContent = streakCount;

    // Only animate if streak increased
    if (streakCount > oldStreak) {
      // Remove existing animation class
      streakElement.classList.remove("streak-bump");

      // Force a reflow
      void streakElement.offsetWidth;

      // Add animation class
      streakElement.classList.add("streak-bump");

      // Remove the class after animation completes
      setTimeout(() => {
        streakElement.classList.remove("streak-bump");
      }, 500); // Match this to your animation duration
    }
  }
}

// Load activity status
function loadActivityStatus(date) {
  const activities = JSON.parse(
    localStorage.getItem(`activity_${date}`) || "{}"
  );

  // Set checkbox states for all activities
  const checkboxIds = [
    "water-done",
    "nutrition-done",
    "workout-done",
    "cardio-done",
    "prayer-done",
    "bible-done",
    "creatine-done",
  ];

  checkboxIds.forEach((id) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
      const activityType = id.replace("-done", "");
      checkbox.checked = activities[activityType] || false;
    } else {
      console.error(`Checkbox with id ${id} not found`);
    }
  });

  // Update streak when loading new date
  updateStreak();
}

function initializeModals() {
  // Add event listener for meal form
  document.getElementById("meal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("selected-date").value;
    const meal = {
      name: document.getElementById("meal-name").value,
      calories: parseInt(document.getElementById("calories").value),
      protein: parseInt(document.getElementById("meal-protein").value),
      timestamp: new Date().toISOString(),
    };

    // Save meal
    const meals = getArrayFromStorage(`meals_${date}`);
    meals.push(meal);
    localStorage.setItem(`meals_${date}`, JSON.stringify(meals));

    // Update display
    updateNutritionTotals(date);
    displayMealEntries(date);
    document.getElementById("meal-modal").style.display = "none";
    document.getElementById("meal-form").reset();
  });

  // Initialize modal buttons
  document.getElementById("log-meal").addEventListener("click", () => {
    document.getElementById("meal-modal").style.display = "block";
  });

  // Close modals
  document.querySelectorAll(".close, .cancel-btn").forEach((element) => {
    element.addEventListener("click", () => {
      document.querySelectorAll(".modal").forEach((modal) => {
        modal.style.display = "none";
      });
    });
  });
}

function getArrayFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];

    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error getting array from storage for key ${key}:`, error);
    return [];
  }
}

// Water tracking initialization
function initializeWaterTracking() {
  console.log("Initializing water tracking...");
  const quickAddButtons = document.querySelectorAll(".quick-add .add-btn");
  console.log("Found quick add buttons:", quickAddButtons.length);

  if (quickAddButtons.length === 0) {
    console.error("No water tracking buttons found! Check selectors.");
    return;
  }

  quickAddButtons.forEach((button) => {
    button.addEventListener("click", function () {
      console.log("Button clicked:", this.dataset.amount);
      if (!this.dataset.amount) {
        console.error("No amount specified on button");
        return;
      }
      const amount = parseInt(this.dataset.amount);
      if (isNaN(amount)) {
        console.error("Invalid amount:", this.dataset.amount);
        return;
      }
      addWater(amount);
    });
  });
}

// Workout logging
document.getElementById("add-workout").addEventListener("click", () => {
  document.getElementById("workout-modal").style.display = "block";
});

document.getElementById("workout-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("selected-date").value;
  const workout = {
    exercise: document.getElementById("exercise-name").value,
    sets: parseInt(document.getElementById("sets").value),
    reps: parseInt(document.getElementById("reps").value),
    weight: parseFloat(document.getElementById("weight").value),
  };

  // Save workout
  const workouts = JSON.parse(localStorage.getItem(`workouts_${date}`) || "[]");
  workouts.push(workout);
  localStorage.setItem(`workouts_${date}`, JSON.stringify(workouts));

  // Update display
  displayWorkouts(date);
  document.getElementById("workout-modal").style.display = "none";
  document.getElementById("workout-form").reset();
});

// Cardio logging
document.getElementById("add-cardio").addEventListener("click", () => {
  document.getElementById("cardio-modal").style.display = "block";
});

document.getElementById("cardio-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("selected-date").value;
  const cardio = {
    type: document.getElementById("cardio-type").value,
    duration: parseInt(document.getElementById("duration").value),
    intensity: document.getElementById("intensity").value,
    incline:
      document.getElementById("cardio-type").value === "incline-walking"
        ? parseFloat(document.getElementById("incline").value)
        : null,
    caloriesBurned: parseInt(
      document.getElementById("calories-burned").value || 0
    ),
  };

  // Save cardio
  const cardioSessions = JSON.parse(
    localStorage.getItem(`cardio_${date}`) || "[]"
  );
  cardioSessions.push(cardio);
  localStorage.setItem(`cardio_${date}`, JSON.stringify(cardioSessions));

  // Update display
  displayCardio(date);
  document.getElementById("cardio-modal").style.display = "none";
  document.getElementById("cardio-form").reset();
});

// Show/hide incline field based on cardio type
document.getElementById("cardio-type").addEventListener("change", (e) => {
  const inclineFields = document.querySelector(".incline-fields");
  inclineFields.style.display =
    e.target.value === "incline-walking" ? "block" : "none";
});

// Delete water entry
function deleteWaterEntry(date, index) {
  try {
    console.log(`Deleting water entry at index ${index} for date ${date}`);
    const entries = getArrayFromStorage(`water_${date}`);
    entries.splice(index, 1);
    localStorage.setItem(`water_${date}`, JSON.stringify(entries));

    // Update display
    updateWaterProgress(date);
    displayWaterEntries(date);
  } catch (error) {
    console.error("Error deleting water entry:", error);
  }
}

// Delete meal entry
function deleteMealEntry(date, index) {
  try {
    console.log(`Deleting meal entry at index ${index} for date ${date}`);
    const meals = getArrayFromStorage(`meals_${date}`);
    meals.splice(index, 1);
    localStorage.setItem(`meals_${date}`, JSON.stringify(meals));

    // Update display
    updateNutritionTotals(date);
    displayMealEntries(date);
  } catch (error) {
    console.error("Error deleting meal entry:", error);
  }
}

function addWater(amount) {
  try {
    console.log("Adding water amount:", amount);
    const date = document.getElementById("selected-date").value;
    console.log("Current date:", date);
    const key = `water_${date}`;

    // Get existing entries or initialize empty array
    const entries = getArrayFromStorage(key);
    console.log("Current entries:", entries);

    // Add new entry with timestamp
    entries.push({
      amount: amount,
      timestamp: new Date().toISOString(),
    });

    // Save entries
    localStorage.setItem(key, JSON.stringify(entries));
    console.log("Saved entries:", entries);

    // Update display
    updateWaterProgress(date);
    displayWaterEntries(date);
  } catch (error) {
    console.error("Error in addWater:", error);
    console.error("Error stack:", error.stack);
  }
}

function updateWaterProgress(date) {
  try {
    console.log("Updating water progress for date:", date);
    const entries = getArrayFromStorage(`water_${date}`);
    const totalWater = entries.reduce(
      (total, entry) => total + entry.amount,
      0
    );

    const goals = JSON.parse(localStorage.getItem("fitnessGoals")) || {
      water: 128,
      protein: 160,
      calories: 2000,
    };

    // Get the progress bar element
    const progressBar = document.getElementById("water-progress");
    if (!progressBar) {
      console.error("Progress bar element not found");
      return;
    }

    // Get the progress text element
    const progressText = document.querySelector(
      ".tracking-card:first-child .progress-text"
    );
    if (!progressText) {
      console.error("Progress text element not found");
      return;
    }

    // Calculate and update progress
    const percentage = Math.min((totalWater / goals.water) * 100, 100);
    console.log("Progress percentage:", percentage);

    // Update the progress bar width
    progressBar.style.width = `${percentage}%`;

    // Convert to gallons for display (128 oz = 1 gallon)
    const gallons = (totalWater / 128).toFixed(2);
    const goalGallons = (goals.water / 128).toFixed(2);

    // Update the text display
    progressText.textContent = `${totalWater}oz / ${goals.water}oz (${gallons} / ${goalGallons} gal)`;

    console.log("Progress updated successfully");
  } catch (error) {
    console.error("Error in updateWaterProgress:", error);
  }
}

function displayWaterEntries(date) {
  const entriesList = document.getElementById("water-entries");
  const entries = getArrayFromStorage(`water_${date}`);

  entriesList.innerHTML = "";

  entries.forEach((entry, index) => {
    const time = new Date(entry.timestamp).toLocaleTimeString();
    const entryElement = document.createElement("div");
    entryElement.className = "entry-item";
    entryElement.innerHTML = `
      <div class="entry-info">
        <span class="entry-amount">${entry.amount}oz</span>
        <span class="entry-time">${time}</span>
      </div>
      <button class="delete-entry" onclick="deleteWaterEntry('${date}', ${index})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    entriesList.appendChild(entryElement);
  });
}

function displayMealEntries(date) {
  const entriesList = document.getElementById("meal-entries");
  const meals = getArrayFromStorage(`meals_${date}`);

  entriesList.innerHTML = "";

  meals.forEach((meal, index) => {
    const time = new Date(meal.timestamp).toLocaleTimeString();
    const entryElement = document.createElement("div");
    entryElement.className = "entry-item";
    entryElement.innerHTML = `
      <div class="entry-info">
        <span class="entry-amount">${meal.name}</span>
        <span class="entry-details">${meal.calories}kcal | ${meal.protein}g protein</span>
        <span class="entry-time">${time}</span>
      </div>
      <button class="delete-entry" onclick="deleteMealEntry('${date}', ${index})">
        <i class="fas fa-trash"></i>
      </button>
    `;
    entriesList.appendChild(entryElement);
  });
}

function updateNutritionTotals(date) {
  try {
    console.log("Updating nutrition totals for date:", date);
    const meals = getArrayFromStorage(`meals_${date}`);
    const goals = JSON.parse(localStorage.getItem("fitnessGoals")) || {
      water: 128,
      protein: 160,
      calories: 2000,
    };

    console.log("Current meals:", meals);
    console.log("Goals:", goals);

    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.calories,
        protein: acc.protein + meal.protein,
      }),
      { calories: 0, protein: 0 }
    );

    console.log("Calculated totals:", totals);

    // Update calories
    const caloriePercentage = Math.min(
      (totals.calories / goals.calories) * 100,
      100
    );
    console.log("Calorie percentage:", caloriePercentage);

    const calorieProgress = document.getElementById("calorie-progress");
    if (!calorieProgress) {
      console.error("Calorie progress bar not found");
      return;
    }

    // Get all progress sections in the nutrition card
    const nutritionCard = document.querySelector(".tracking-card:nth-child(2)");
    if (!nutritionCard) {
      console.error("Nutrition card not found");
      return;
    }

    const progressSections =
      nutritionCard.querySelectorAll(".progress-section");
    if (progressSections.length < 2) {
      console.error("Progress sections not found");
      return;
    }

    // Get calorie text from first progress section
    const calorieText = progressSections[0].querySelector(".progress-text");
    if (!calorieText) {
      console.error("Calorie text element not found");
      return;
    }

    calorieProgress.style.width = `${caloriePercentage}%`;
    calorieText.textContent = `${totals.calories} / ${goals.calories} kcal`;
    console.log("Updated calorie progress");

    // Update protein
    const proteinPercentage = Math.min(
      (totals.protein / goals.protein) * 100,
      100
    );
    console.log("Protein percentage:", proteinPercentage);

    const proteinProgress = document.getElementById("protein-progress");
    if (!proteinProgress) {
      console.error("Protein progress bar not found");
      return;
    }

    // Get protein text from second progress section
    const proteinText = progressSections[1].querySelector(".progress-text");
    if (!proteinText) {
      console.error("Protein text element not found");
      return;
    }

    proteinProgress.style.width = `${proteinPercentage}%`;
    proteinText.textContent = `${totals.protein} / ${goals.protein}g`;
    console.log("Updated protein progress");
  } catch (error) {
    console.error("Error updating nutrition totals:", error);
    console.error("Error stack:", error.stack);
  }
}

// Initialize charts
function initializeCharts() {
  return new Promise((resolve) => {
    const chartConfigs = {
      weight: { label: "Weight (lbs)", color: "#3498db" },
      fat: { label: "Body Fat (%)", color: "#e74c3c" },
      water: { label: "Body Water (%)", color: "#2ecc71" },
      muscle: { label: "Muscle Mass (lbs)", color: "#9b59b6" },
      bmi: { label: "BMI", color: "#f1c40f" },
    };

    Object.entries(chartConfigs).forEach(([metric, config]) => {
      const ctx = document.getElementById(`${metric}-chart`);
      if (!ctx) {
        console.error(`Canvas element not found for ${metric}-chart`);
        return;
      }
      charts[metric] = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: config.label,
              data: [],
              borderColor: config.color,
              tension: 0.4,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                font: {
                  size: 10,
                },
              },
            },
            x: {
              ticks: {
                font: {
                  size: 10,
                },
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
      });
    });

    resolve();
  });
}

// Initialize measurements modal
function initializeMeasurementsModal() {
  const modal = document.getElementById("measurements-modal");
  const btn = document.getElementById("log-measurements");
  const form = document.getElementById("measurements-form");

  if (!modal || !btn || !form) {
    console.error("Required measurement modal elements not found");
    return;
  }

  btn.addEventListener("click", () => {
    const date = document.getElementById("selected-date").value;
    const today = new Date().toISOString().split("T")[0];

    // Check if measurements already exist for today
    const existingMeasurements = localStorage.getItem(`measurements_${date}`);

    if (existingMeasurements && date === today) {
      showToast(
        "Measurements already logged for today. Use undo to remove them first.",
        true
      );
      return;
    }

    modal.style.display = "block";
  });

  const closeBtn = modal.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      form.reset();
    });
  }

  const cancelBtn = modal.querySelector(".cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      form.reset();
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("selected-date").value;
    const today = new Date().toISOString().split("T")[0];

    // Double check that measurements don't exist for today
    const existingMeasurements = localStorage.getItem(`measurements_${date}`);
    if (existingMeasurements && date === today) {
      showToast(
        "Measurements already logged for today. Use undo to remove them first.",
        true
      );
      modal.style.display = "none";
      form.reset();
      return;
    }

    const measurements = {
      weight: parseFloat(document.getElementById("weight").value),
      bodyFat: parseFloat(document.getElementById("body-fat").value),
      bodyWater: parseFloat(document.getElementById("body-water").value),
      muscleMass: parseFloat(document.getElementById("muscle-mass").value),
      timestamp: new Date().toISOString(),
    };

    // Calculate BMI
    const heightInMeters = 1.75; // You might want to make this configurable
    measurements.bmi =
      (measurements.weight * 0.45359237) / (heightInMeters * heightInMeters);

    saveMeasurements(date, measurements);
    updateMeasurements(date);
    modal.style.display = "none";
    form.reset();
  });
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const icon = toast.querySelector("i");

  // Update icon and class based on type
  if (isError) {
    icon.className = "fas fa-exclamation-circle";
    toast.classList.add("error");
  } else {
    icon.className = "fas fa-check-circle";
    toast.classList.remove("error");
  }

  toastMessage.textContent = message;
  toast.classList.add("show");

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function updateUndoButton() {
  const undoBtn = document.getElementById("undo-measurement");
  const logBtn = document.getElementById("log-measurements");
  const date = document.getElementById("selected-date").value;
  const today = new Date().toISOString().split("T")[0];

  // Check if measurements exist for the selected date
  const hasMeasurements = localStorage.getItem(`measurements_${date}`) !== null;

  // Only enable undo for today's measurements
  undoBtn.disabled = date !== today || !lastMeasurementBackup;

  // Update the log measurements button state
  if (date === today) {
    if (hasMeasurements) {
      logBtn.disabled = true;
      logBtn.title = "Undo today's measurements first to log new ones";
    } else {
      logBtn.disabled = false;
      logBtn.title = "Log new measurements";
    }
  } else {
    logBtn.disabled = true;
    logBtn.title = "Can only log measurements for today";
  }
}

function saveMeasurements(date, measurements) {
  const key = `measurements_${date}`;
  // Store the previous state (either the previous measurements or null if none existed)
  lastMeasurementBackup = {
    date,
    measurements: localStorage.getItem(key),
  };

  localStorage.setItem(key, JSON.stringify(measurements));
  updateUndoButton();
  showToast("Measurements saved successfully");
}

function undoLastMeasurement() {
  if (!lastMeasurementBackup) {
    showToast("No measurements to undo", true);
    return;
  }

  const { date, measurements } = lastMeasurementBackup;
  if (measurements) {
    // Restore previous measurements
    localStorage.setItem(`measurements_${date}`, measurements);
  } else {
    // If there were no previous measurements, remove the current ones
    localStorage.removeItem(`measurements_${date}`);
  }

  lastMeasurementBackup = null;
  updateUndoButton();
  updateMeasurements(date);
  showToast("Last measurement undone");
}

function updateMeasurements(date) {
  const measurements = JSON.parse(
    localStorage.getItem(`measurements_${date}`) || "{}"
  );

  // Reset all values if no measurements exist
  if (Object.keys(measurements).length === 0) {
    document.getElementById("weight-value").textContent = "0 lbs";
    document.getElementById("fat-value").textContent = "0%";
    document.getElementById("water-value").textContent = "0%";
    document.getElementById("muscle-value").textContent = "0 lbs";
    document.getElementById("bmi-value").textContent = "0";
  } else {
    document.getElementById(
      "weight-value"
    ).textContent = `${measurements.weight.toFixed(1)} lbs`;
    document.getElementById(
      "fat-value"
    ).textContent = `${measurements.bodyFat.toFixed(1)}%`;
    document.getElementById(
      "water-value"
    ).textContent = `${measurements.bodyWater.toFixed(1)}%`;
    document.getElementById(
      "muscle-value"
    ).textContent = `${measurements.muscleMass.toFixed(1)} lbs`;
    document.getElementById("bmi-value").textContent =
      measurements.bmi.toFixed(1);
  }

  updateCharts();
}

function updateCharts() {
  if (!charts || Object.keys(charts).length === 0) {
    console.warn("Charts not yet initialized");
    return;
  }

  // Get last 7 days of data
  const dates = [];
  const data = {
    weight: [],
    fat: [],
    water: [],
    muscle: [],
    bmi: [],
  };

  const currentDate = new Date(document.getElementById("selected-date").value);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    dates.push(dateStr.split("-").slice(1).join("/"));

    const measurements = JSON.parse(
      localStorage.getItem(`measurements_${dateStr}`) || "{}"
    );
    if (Object.keys(measurements).length > 0) {
      data.weight.push(measurements.weight);
      data.fat.push(measurements.bodyFat);
      data.water.push(measurements.bodyWater);
      data.muscle.push(measurements.muscleMass);
      data.bmi.push(measurements.bmi);
    } else {
      data.weight.push(null);
      data.fat.push(null);
      data.water.push(null);
      data.muscle.push(null);
      data.bmi.push(null);
    }
  }

  Object.entries(charts).forEach(([metric, chart]) => {
    if (chart && typeof chart.update === "function") {
      chart.data.labels = dates;
      chart.data.datasets[0].data = data[metric];
      chart.update();
    }
  });
}

function loadDailyData(date) {
  try {
    const dateStr =
      typeof date === "string" ? date : date.toISOString().split("T")[0];
    console.log("Loading data for date:", dateStr);

    // Update undo button state
    updateUndoButton();

    // Load water
    updateWaterProgress(dateStr);
    displayWaterEntries(dateStr);

    // Load nutrition
    updateNutritionTotals(dateStr);
    displayMealEntries(dateStr);

    // Load activity status
    loadActivityStatus(dateStr);

    // Load measurements
    updateMeasurements(dateStr);
  } catch (error) {
    console.error("Error in loadDailyData:", error);
    console.error("Error stack:", error.stack);
  }
}

function displayWorkouts(date) {
  const workouts = JSON.parse(localStorage.getItem(`workouts_${date}`) || "[]");
  const workoutList = document.getElementById("workout-list");
  workoutList.innerHTML = "";

  workouts.forEach((workout) => {
    const workoutElement = document.createElement("div");
    workoutElement.className = "workout-item";
    workoutElement.innerHTML = `
            <div class="workout-info">
                <span class="workout-name">${workout.exercise}</span>
                <span class="workout-details">${workout.sets} sets × ${
      workout.reps
    } reps @ ${workout.weight}lbs</span>
            </div>
            <button class="delete-btn" onclick="deleteWorkout('${date}', ${workouts.indexOf(
      workout
    )})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    workoutList.appendChild(workoutElement);
  });
}

function displayCardio(date) {
  const cardioSessions = JSON.parse(
    localStorage.getItem(`cardio_${date}`) || "[]"
  );
  const cardioList = document.getElementById("cardio-list");
  cardioList.innerHTML = "";

  cardioSessions.forEach((cardio) => {
    const cardioElement = document.createElement("div");
    cardioElement.className = "cardio-item";
    cardioElement.innerHTML = `
            <div class="cardio-info">
                <span class="cardio-type">${formatCardioType(
                  cardio.type
                )}</span>
                <span class="cardio-details">
                    ${cardio.duration} mins | ${cardio.intensity} intensity
                    ${cardio.incline ? ` | ${cardio.incline}% incline` : ""}
                    ${
                      cardio.caloriesBurned
                        ? ` | ${cardio.caloriesBurned} calories`
                        : ""
                    }
                </span>
            </div>
            <button class="delete-btn" onclick="deleteCardio('${date}', ${cardioSessions.indexOf(
      cardio
    )})">
                <i class="fas fa-trash"></i>
            </button>
        `;
    cardioList.appendChild(cardioElement);
  });
}

function formatCardioType(type) {
  return type
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function deleteWorkout(date, index) {
  const workouts = JSON.parse(localStorage.getItem(`workouts_${date}`) || "[]");
  workouts.splice(index, 1);
  localStorage.setItem(`workouts_${date}`, JSON.stringify(workouts));
  displayWorkouts(date);
}

function deleteCardio(date, index) {
  const cardioSessions = JSON.parse(
    localStorage.getItem(`cardio_${date}`) || "[]"
  );
  cardioSessions.splice(index, 1);
  localStorage.setItem(`cardio_${date}`, JSON.stringify(cardioSessions));
  displayCardio(date);
}

// Settings
document.getElementById("goals-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const goals = {
    water: parseInt(document.getElementById("water-goal").value),
    protein: parseInt(document.getElementById("protein-goal").value),
    calories: parseInt(document.getElementById("calorie-goal").value),
  };
  localStorage.setItem("fitnessGoals", JSON.stringify(goals));
  loadDailyData(new Date(document.getElementById("selected-date").value));
  document.getElementById("settings-modal").style.display = "none";
});

// Add these new functions
function initializeExpandedGraphModal() {
  const modal = document.getElementById("graph-modal");
  const timeRange = document.getElementById("time-range");

  // Add click handlers to metric cards
  document.querySelectorAll(".metric-card").forEach((card) => {
    card.addEventListener("click", () => {
      const metricType = card
        .querySelector(".chart-container canvas")
        .id.replace("-chart", "");
      showExpandedGraph(metricType);
    });
  });

  // Close button handler
  const closeBtn = modal.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
      if (expandedChart) {
        expandedChart.destroy();
        expandedChart = null;
      }
    });
  }

  // Time range change handler
  timeRange.addEventListener("change", () => {
    if (currentMetric) {
      updateExpandedGraph(currentMetric, parseInt(timeRange.value));
    }
  });
}

function showExpandedGraph(metricType) {
  currentMetric = metricType;
  const modal = document.getElementById("graph-modal");
  const title = document.getElementById("graph-modal-title");
  const timeRange = document.getElementById("time-range");

  // Set modal title and icon based on metric type
  const metricConfig = {
    weight: { label: "Weight Progress", icon: "fa-weight" },
    fat: { label: "Body Fat Progress", icon: "fa-percentage" },
    water: { label: "Body Water Progress", icon: "fa-tint" },
    muscle: { label: "Muscle Mass Progress", icon: "fa-dumbbell" },
    bmi: { label: "BMI Progress", icon: "fa-calculator" },
  };

  const config = metricConfig[metricType];
  title.innerHTML = `<i class="fas ${config.icon}"></i> ${config.label}`;

  // Show modal
  modal.style.display = "block";

  // Update graph with selected time range
  updateExpandedGraph(metricType, parseInt(timeRange.value));
}

function updateExpandedGraph(metricType, days) {
  // Destroy existing chart if it exists
  if (expandedChart) {
    expandedChart.destroy();
  }

  const dates = [];
  const data = [];
  const currentDate = new Date();

  // Collect data for specified number of days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const formattedDate = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const measurements = JSON.parse(
      localStorage.getItem(`measurements_${dateStr}`) || "{}"
    );
    dates.push(formattedDate);

    // Get the appropriate measurement based on metric type
    let value = null;
    if (Object.keys(measurements).length > 0) {
      switch (metricType) {
        case "weight":
          value = measurements.weight;
          break;
        case "fat":
          value = measurements.bodyFat;
          break;
        case "water":
          value = measurements.bodyWater;
          break;
        case "muscle":
          value = measurements.muscleMass;
          break;
        case "bmi":
          value = measurements.bmi;
          break;
      }
    }
    data.push(value);
  }

  // Create new chart
  const ctx = document.getElementById("expanded-chart");
  const chartConfig = charts[metricType].config;

  expandedChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dates,
      datasets: [
        {
          label: chartConfig.data.datasets[0].label,
          data: data,
          borderColor: chartConfig.data.datasets[0].borderColor,
          tension: 0.4,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            font: { size: 12 },
          },
        },
        x: {
          ticks: {
            font: { size: 12 },
            maxRotation: 45,
            minRotation: 45,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });
}
