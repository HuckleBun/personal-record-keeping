// Budget page functionality will be added here

// Initialize data from localStorage
let payments = JSON.parse(localStorage.getItem("payments")) || {
  recurring: [],
  individual: [],
};

let monthlySalary = parseFloat(localStorage.getItem("monthlySalary")) || 0;
let monthlyBonus = parseFloat(localStorage.getItem("monthlyBonus")) || 0;
let bonuses = JSON.parse(localStorage.getItem("bonuses")) || [];

// DOM Elements
const modal = document.getElementById("payment-modal");
const bonusModal = document.getElementById("bonus-modal");
const modalTitle = document.getElementById("modal-title");
const paymentForm = document.getElementById("payment-form");
const bonusForm = document.getElementById("bonus-form");
const recurringFields = document.getElementById("recurring-fields");
const recurringPaymentsList = document.getElementById("recurring-payments");
const individualPaymentsList = document.getElementById("individual-payments");
const addRecurringBtn = document.getElementById("add-recurring");
const addIndividualBtn = document.getElementById("add-individual");
const addBonusBtn = document.getElementById("add-bonus");
const bonusList = document.getElementById("bonus-list");
const salaryInput = document.getElementById("monthly-salary");
const monthlyBonusInput = document.getElementById("monthly-bonus");

// Initialize salary and bonus inputs
salaryInput.value = monthlySalary || "";
monthlyBonusInput.value = monthlyBonus || "";

// Initialize date range picker
const dateRangePicker = flatpickr("#date-range", {
  mode: "range",
  dateFormat: "Y-m-d",
  onChange: function (selectedDates) {
    if (selectedDates.length === 2) {
      updatePaymentsList(selectedDates[0], selectedDates[1]);
    }
  },
});

// Set default date range to current month
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
dateRangePicker.setDate([firstDay, lastDay]);

// Event Listeners
addRecurringBtn.addEventListener("click", () => openModal("recurring"));
addIndividualBtn.addEventListener("click", () => openModal("individual"));
addBonusBtn.addEventListener("click", () => {
  bonusModal.style.display = "block";
  bonusForm.reset();
  // Set default date to today
  document.getElementById("bonus-date").value = new Date()
    .toISOString()
    .split("T")[0];
});

document.querySelectorAll(".close, .cancel-btn").forEach((element) => {
  element.addEventListener("click", closeModal);
});

paymentForm.addEventListener("submit", handlePaymentSubmit);

// Add salary input event listener
salaryInput.addEventListener("input", function () {
  monthlySalary = parseFloat(this.value) || 0;
  localStorage.setItem("monthlySalary", monthlySalary);
  updatePaymentsList();
});

// Add monthly bonus input event listener
monthlyBonusInput.addEventListener("input", function () {
  monthlyBonus = parseFloat(this.value) || 0;
  localStorage.setItem("monthlyBonus", monthlyBonus);
  updatePaymentsList();
});

// Close bonus modal
document
  .querySelectorAll("#bonus-modal .close, #bonus-modal .cancel-btn")
  .forEach((element) => {
    element.addEventListener("click", () => {
      bonusModal.style.display = "none";
    });
  });

// Handle bonus form submission
bonusForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const bonus = {
    id: Date.now().toString(),
    name: document.getElementById("bonus-name").value,
    amount: parseFloat(document.getElementById("bonus-amount").value),
    date: document.getElementById("bonus-date").value,
  };

  bonuses.push(bonus);
  saveBonuses();
  updateBonusList();
  updatePaymentsList();
  bonusModal.style.display = "none";
});

// Functions
function openModal(type) {
  modalTitle.textContent =
    type === "recurring" ? "Add Recurring Payment" : "Add Individual Payment";
  recurringFields.style.display = type === "recurring" ? "block" : "none";
  modal.style.display = "block";
  paymentForm.reset();
  paymentForm.dataset.type = type;
}

function closeModal() {
  modal.style.display = "none";
}

function handlePaymentSubmit(e) {
  e.preventDefault();

  const payment = {
    name: document.getElementById("payment-name").value,
    amount: parseFloat(document.getElementById("payment-amount").value),
    date: document.getElementById("payment-date").value,
    id: Date.now().toString(),
  };

  const type = paymentForm.dataset.type;

  if (type === "recurring") {
    payments.recurring.push({
      ...payment,
      recurring: true,
    });
  } else {
    payments.individual.push({
      ...payment,
      recurring: false,
    });
  }

  savePayments();
  updatePaymentsList();
  closeModal();
}

function deletePayment(id, type) {
  if (type === "recurring") {
    payments.recurring = payments.recurring.filter((p) => p.id !== id);
  } else {
    payments.individual = payments.individual.filter((p) => p.id !== id);
  }

  savePayments();
  updatePaymentsList();
}

function savePayments() {
  localStorage.setItem("payments", JSON.stringify(payments));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  // Add timezone offset to keep the date consistent
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(date.getTime() + timezoneOffset);

  return adjustedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Function to update recurring payment dates
function updateRecurringPaymentDates() {
  const today = new Date();
  let hasUpdates = false;

  payments.recurring = payments.recurring.map((payment) => {
    const paymentDate = new Date(payment.date);

    while (paymentDate < today) {
      // Move to next month
      paymentDate.setMonth(paymentDate.getMonth() + 1);
      hasUpdates = true;
    }

    return {
      ...payment,
      date: paymentDate.toISOString().split("T")[0], // Format as YYYY-MM-DD
    };
  });

  if (hasUpdates) {
    savePayments();
  }
}

// Call updateRecurringPaymentDates when loading the page
updateRecurringPaymentDates();

// Add updateRecurringPaymentDates to the updatePaymentsList function
function updatePaymentsList(startDate = firstDay, endDate = lastDay) {
  // Update recurring payment dates first
  updateRecurringPaymentDates();

  // Clear existing lists
  recurringPaymentsList.innerHTML = "";
  individualPaymentsList.innerHTML = "";

  let recurringTotal = 0;
  let individualTotal = 0;
  let additionalBonusTotal = bonuses.reduce(
    (total, bonus) => total + bonus.amount,
    0
  );
  let monthlyIncome = monthlySalary + monthlyBonus;

  // Sort and display recurring payments by date
  const sortedRecurring = [...payments.recurring].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  sortedRecurring.forEach((payment) => {
    recurringTotal += payment.amount;
    recurringPaymentsList.appendChild(
      createPaymentElement(payment, "recurring")
    );
  });

  // Sort and display individual payments by date
  const sortedIndividual = [...payments.individual].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  sortedIndividual.forEach((payment) => {
    const paymentDate = new Date(payment.date);
    if (paymentDate >= startDate && paymentDate <= endDate) {
      individualTotal += payment.amount;
      individualPaymentsList.appendChild(
        createPaymentElement(payment, "individual")
      );
    }
  });

  const totalExpenses = recurringTotal + individualTotal;
  const freeSpending = Math.max(
    0,
    monthlyIncome + additionalBonusTotal - totalExpenses
  );

  // Update all displays
  document.getElementById("salary-display").textContent =
    formatCurrency(monthlyIncome);
  document.getElementById("recurring-total").textContent =
    formatCurrency(recurringTotal);
  document.getElementById("individual-total").textContent =
    formatCurrency(individualTotal);
  document.getElementById("overall-total").textContent =
    formatCurrency(totalExpenses);
  document.getElementById("free-spend").textContent =
    formatCurrency(freeSpending);

  // Add color classes based on free spending amount
  const freeSpendElement = document.getElementById("free-spend");
  freeSpendElement.classList.remove(
    "text-danger",
    "text-warning",
    "text-success"
  );
  if (freeSpending <= 0) {
    freeSpendElement.classList.add("text-danger");
  } else if (freeSpending < monthlyIncome * 0.2) {
    // Less than 20% of salary
    freeSpendElement.classList.add("text-warning");
  } else {
    freeSpendElement.classList.add("text-success");
  }
}

function createPaymentElement(payment, type) {
  const div = document.createElement("div");
  div.className = "payment-item";
  div.innerHTML = `
        <div class="payment-info">
            <div class="payment-name">${payment.name}</div>
            <div class="payment-date">${formatDate(payment.date)}</div>
        </div>
        <div class="payment-amount">${formatCurrency(payment.amount)}</div>
        <button class="delete-payment" onclick="deletePayment('${
          payment.id
        }', '${type}')">
            <i class="fas fa-trash"></i>
        </button>
    `;
  return div;
}

function saveBonuses() {
  localStorage.setItem("bonuses", JSON.stringify(bonuses));
}

function deleteBonus(id) {
  bonuses = bonuses.filter((bonus) => bonus.id !== id);
  saveBonuses();
  updateBonusList();
  updatePaymentsList();
}

function updateBonusList() {
  bonusList.innerHTML = "";
  const sortedBonuses = [...bonuses].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedBonuses.forEach((bonus) => {
    const bonusElement = document.createElement("div");
    bonusElement.className = "bonus-item";
    bonusElement.innerHTML = `
            <div class="bonus-info">
                <div class="bonus-name">${bonus.name}</div>
                <div class="bonus-date">${formatDate(bonus.date)}</div>
            </div>
            <div class="bonus-amount">+${formatCurrency(bonus.amount)}</div>
            <button class="delete-bonus" onclick="deleteBonus('${bonus.id}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
    bonusList.appendChild(bonusElement);
  });
}

// Initial render
updatePaymentsList();

// Call updateBonusList on page load
updateBonusList();
