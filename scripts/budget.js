// Budget page functionality will be added here

// Initialize data from localStorage
let payments;
try {
  payments = JSON.parse(localStorage.getItem("payments"));
  if (!payments || !payments.recurring || !payments.individual) {
    payments = { recurring: [], individual: [] };
  }
} catch (e) {
  payments = { recurring: [], individual: [] };
}

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

// Add event listener for expense history button and modal close
const showExpenseHistoryBtn = document.getElementById("show-expense-history");
const expenseHistoryModal = document.getElementById("expense-history-modal");
const expenseHistoryList = document.getElementById("expense-history-list");

if (showExpenseHistoryBtn && expenseHistoryModal && expenseHistoryList) {
  showExpenseHistoryBtn.addEventListener("click", () => {
    updateExpenseHistoryList();
    expenseHistoryModal.style.display = "block";
  });

  // Close modal on close button click
  expenseHistoryModal.querySelector(".close").addEventListener("click", () => {
    expenseHistoryModal.style.display = "none";
  });

  // Optional: close modal when clicking outside modal content
  expenseHistoryModal.addEventListener("click", (e) => {
    if (e.target === expenseHistoryModal) {
      expenseHistoryModal.style.display = "none";
    }
  });
}

function updateExpenseHistoryList() {
  expenseHistoryList.innerHTML = "";
  if (!payments.individual.length) {
    expenseHistoryList.innerHTML =
      '<div style="color:#95a5a6;text-align:center;padding:20px;font-style:italic;">No individual expenses recorded.</div>';
    return;
  }
  // Sort by most recent first
  const sorted = [...payments.individual].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  sorted.forEach((payment) => {
    const div = document.createElement("div");
    div.className = "payment-item";
    div.style.marginBottom = "10px";
    div.innerHTML = `
      <div class="payment-info">
        <div class="payment-name">${payment.name}</div>
        <div class="payment-date">${formatDate(payment.date)}</div>
      </div>
      <div class="payment-amount">${formatCurrency(payment.amount)}</div>
    `;
    expenseHistoryList.appendChild(div);
  });
}

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
  console.log("handlePaymentSubmit called, type:", paymentForm.dataset.type);
  e.preventDefault();
  try {
    const paymentDateValue = document.getElementById("payment-date").value;
    // Parse as local date
    const [year, month, day] = paymentDateValue.split("-");
    const paymentDateObj = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    const payment = {
      name: document.getElementById("payment-name").value,
      amount: parseFloat(document.getElementById("payment-amount").value),
      date: paymentDateValue,
      id: Date.now().toString(),
      originalDay: Number(day),
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
  } catch (err) {
    console.error("Error in handlePaymentSubmit:", err);
    alert(
      "An error occurred while submitting the payment. Check the console for details."
    );
  }
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
  const isNegative = amount < 0;
  const absoluteAmount = Math.abs(amount);
  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(absoluteAmount);

  return isNegative ? `-${formattedAmount}` : formattedAmount;
}

function formatDate(dateString) {
  // Parse as local date, not UTC
  const [year, month, day] = dateString.split("-");
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Function to update recurring payment dates
function updateRecurringPaymentDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Ignore time for comparison
  let hasUpdates = false;

  payments.recurring = payments.recurring.map((payment) => {
    // Parse payment.date as local date
    const [yearStr, monthStr, dayStr] = payment.date.split("-");
    let paymentDate = new Date(
      Number(yearStr),
      Number(monthStr) - 1,
      Number(dayStr)
    );
    paymentDate.setHours(0, 0, 0, 0);

    // Store the original day if not already present
    if (!payment.originalDay) {
      payment.originalDay = paymentDate.getDate();
    }

    // Move to the next month if the payment date is in the past or today
    if (paymentDate <= today) {
      let year = paymentDate.getFullYear();
      let month = paymentDate.getMonth();
      let originalDay = payment.originalDay;

      // Advance to next month
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }

      // Try to set to the original day in the next month
      let newDate = new Date(year, month, originalDay);
      console.log("Advancing recurring payment:", {
        year,
        month,
        originalDay,
        newDate: newDate.toISOString().split("T")[0],
      });

      // If the month is not as expected, the day overflowed (e.g., 31st in a 30-day month)
      if (newDate.getMonth() !== month) {
        // Set to the 1st of the next-next month
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
        newDate = new Date(year, month, 1);
        console.log("Day overflowed, fallback to:", {
          year,
          month,
          newDate: newDate.toISOString().split("T")[0],
        });
      }

      paymentDate = newDate;
      hasUpdates = true;
    }
    // Format as YYYY-MM-DD in local time
    const yyyy = paymentDate.getFullYear();
    const mm = String(paymentDate.getMonth() + 1).padStart(2, "0");
    const dd = String(paymentDate.getDate()).padStart(2, "0");
    return {
      ...payment,
      date: `${yyyy}-${mm}-${dd}`,
      originalDay: payment.originalDay,
    };
  });

  if (hasUpdates) {
    savePayments();
  }
}

// Call updateRecurringPaymentDates when loading the page
updateRecurringPaymentDates();

// Add updateRecurringPaymentDates to the updatePaymentsList function
function updatePaymentsList() {
  // Update recurring payment dates first
  updateRecurringPaymentDates();

  const freeSpendElement = document.getElementById("free-spend");

  // Clear existing lists
  recurringPaymentsList.innerHTML = "";
  individualPaymentsList.innerHTML = "";

  let recurringTotalFirstHalf = 0;
  let recurringTotalSecondHalf = 0;
  let individualTotalFirstHalf = 0;
  let individualTotalSecondHalf = 0;
  let additionalBonusTotal = bonuses.reduce(
    (total, bonus) => total + bonus.amount,
    0
  );
  let monthlyIncome = monthlySalary + monthlyBonus;
  let halfSalary = monthlySalary / 2;

  // Helper function to get the correct day of month
  function getDayOfMonth(dateString) {
    const [year, month, day] = dateString.split("-");
    const date = new Date(year, month - 1, day);
    return date.getDate();
  }

  // Get today's date and determine current pay period
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  let payPeriodStart, payPeriodEnd;
  if (currentDay <= 14) {
    // 1st to 14th
    payPeriodStart = new Date(currentYear, currentMonth, 1);
    payPeriodEnd = new Date(currentYear, currentMonth, 14);
  } else {
    // 15th to end of month
    payPeriodStart = new Date(currentYear, currentMonth, 15);
    payPeriodEnd = new Date(currentYear, currentMonth + 1, 0); // last day of month
  }

  // Sort and display recurring payments by date
  const sortedRecurring = [...payments.recurring].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  sortedRecurring.forEach((payment) => {
    const dayOfMonth = getDayOfMonth(payment.date);
    // Only add to the correct half
    if (dayOfMonth <= 14) {
      recurringTotalFirstHalf += payment.amount;
    } else {
      recurringTotalSecondHalf += payment.amount;
    }
  });

  // Filter and sort individual payments for current pay period
  const filteredIndividual = payments.individual.filter((payment) => {
    const [year, month, day] = payment.date.split("-");
    const paymentDate = new Date(year, month - 1, day);
    return paymentDate >= payPeriodStart && paymentDate <= payPeriodEnd;
  });
  const sortedIndividual = [...filteredIndividual].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  sortedIndividual.forEach((payment) => {
    const dayOfMonth = getDayOfMonth(payment.date);
    if (dayOfMonth <= 15) {
      individualTotalFirstHalf += payment.amount;
    } else {
      individualTotalSecondHalf += payment.amount;
    }
  });

  // Update summary cards
  document.getElementById("salary-display").textContent =
    formatCurrency(monthlyIncome);
  document.getElementById("recurring-total").textContent = formatCurrency(
    recurringTotalFirstHalf + recurringTotalSecondHalf
  );
  document.getElementById("individual-total").textContent = formatCurrency(
    individualTotalFirstHalf + individualTotalSecondHalf
  );
  document.getElementById("overall-total").textContent = formatCurrency(
    recurringTotalFirstHalf +
      recurringTotalSecondHalf +
      individualTotalFirstHalf +
      individualTotalSecondHalf
  );

  // Calculate free spending for each pay period
  const freeSpendingFirstHalf =
    halfSalary - (recurringTotalFirstHalf + individualTotalFirstHalf);
  const freeSpendingSecondHalf =
    halfSalary +
    monthlyBonus -
    (recurringTotalSecondHalf + individualTotalSecondHalf);

  // Create spans for each amount to allow individual styling
  const firstHalfSpan = document.createElement("span");
  firstHalfSpan.textContent = formatCurrency(freeSpendingFirstHalf);
  if (freeSpendingFirstHalf < 0) {
    firstHalfSpan.classList.add("negative-amount");
  }

  const secondHalfSpan = document.createElement("span");
  secondHalfSpan.textContent = formatCurrency(freeSpendingSecondHalf);
  if (freeSpendingSecondHalf < 0) {
    secondHalfSpan.classList.add("negative-amount");
  }

  freeSpendElement.innerHTML = "";
  freeSpendElement.appendChild(firstHalfSpan);
  freeSpendElement.appendChild(document.createTextNode(" / "));
  freeSpendElement.appendChild(secondHalfSpan);

  freeSpendElement.classList.remove(
    "text-danger",
    "text-warning",
    "text-success"
  );
  if (freeSpendingFirstHalf < 0 || freeSpendingSecondHalf < 0) {
    freeSpendElement.classList.add("text-danger");
  } else if (
    freeSpendingFirstHalf + freeSpendingSecondHalf <
    monthlyIncome * 0.2
  ) {
    freeSpendElement.classList.add("text-warning");
  } else {
    freeSpendElement.classList.add("text-success");
  }

  // Create and append recurring payment elements
  sortedRecurring.forEach((payment) => {
    const paymentElement = createPaymentElement(payment, "recurring");
    recurringPaymentsList.appendChild(paymentElement);
  });

  // Create and append filtered individual payment elements
  sortedIndividual.forEach((payment) => {
    const paymentElement = createPaymentElement(payment, "individual");
    individualPaymentsList.appendChild(paymentElement);
  });
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
