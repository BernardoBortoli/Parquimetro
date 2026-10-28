

class ParkingMeter {
  constructor() {
    this.tiers = [
      { price: 200, minutes: 30 },
      { price: 400, minutes: 60 },
      { price: 700, minutes: 120 }
    ];

    this.maxPayment = 100000; // R$ 1,000.00
  }

  calculate(amount) {
    if (!Number.isFinite(amount)) {
      return { success: false, message: "Enter a valid amount." };
    }

    const cents = Math.round(amount * 100);

    if (Math.abs(amount * 100 - cents) > 0.000001) {
      return {
        success: false,
        message: "Use no more than two decimal places."
      };
    }

    if (cents < 100) {
      return {
        success: false,
        message: "Insufficient payment. Minimum amount: R$ 1.00."
      };
    }

    if (cents > this.maxPayment) {
      return {
        success: false,
        message: "Maximum payment is R$ 1,000.00."
      };
    }

    const tier = [...this.tiers]
      .reverse()
      .find(option => cents >= option.price);

    if (!tier) {
      return {
        success: false,
        message: "Insufficient payment. The cheapest parking option costs R$ 2.00."
      };
    }

    return {
      success: true,
      minutes: tier.minutes,
      price: tier.price / 100,
      change: (cents - tier.price) / 100
    };
  }
}

const meter = new ParkingMeter();

const amountInput = document.getElementById("amount");
const calculateButton = document.getElementById("calculate");
const message = document.getElementById("message");
const duration = document.getElementById("duration");
const change = document.getElementById("change");
const timerDisplay = document.getElementById("timer");
const timerStatus = document.getElementById("timerStatus");
const expiredDialog = document.getElementById("expiredDialog");
const closePopup = document.getElementById("closePopup");

let countdownInterval = null;
let parkingEndTime = null;
let sessionActive = false;

const currency = value =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

function displayError(text) {
  message.textContent = text;
  message.className = "error";
  duration.textContent = "";
  change.textContent = "";
}

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map(value => String(value).padStart(2, "0"))
    .join(":");
}

function stopCountdown() {
  if (countdownInterval !== null) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function updateCountdown() {
  const remainingSeconds = Math.max(
    0,
    Math.ceil((parkingEndTime - Date.now()) / 1000)
  );

  timerDisplay.textContent = formatTime(remainingSeconds);

  if (remainingSeconds <= 0) {
    stopCountdown();
    sessionActive = false;

    timerDisplay.textContent = "00:00:00";
    timerStatus.textContent = "Parking time expired!";
    timerStatus.className = "error";

    amountInput.disabled = false;
    calculateButton.disabled = false;

    // Show the expiry pop-up automatically.
    if (!expiredDialog.open) {
      expiredDialog.showModal();
    }
  }
}

function startCountdown(minutes) {
  stopCountdown();

  parkingEndTime = Date.now() + minutes * 60 * 1000;
  sessionActive = true;

  amountInput.disabled = true;
  calculateButton.disabled = true;

  timerStatus.textContent = "Parking session active";
  timerStatus.className = "success";

  updateCountdown();

  countdownInterval = setInterval(updateCountdown, 250);
}

function calculateParking() {
  if (sessionActive) return;

  const rawValue = amountInput.value.trim();

  if (
    rawValue === "" ||
    amountInput.validity.badInput ||
    !amountInput.validity.valid
  ) {
    displayError("Enter a valid amount between R$ 0.01 and R$ 1,000.00, with at most two decimal places.");
    return;
  }

  const amount = Number(rawValue);
  const result = meter.calculate(amount);

  if (!result.success) {
    displayError(result.message);
    return;
  }

  message.textContent = "Payment calculated successfully!";
  message.className = "success";

  duration.textContent =
    `Parking time: ${result.minutes} minutes` +
    (result.minutes === 60
      ? " (1 hour)"
      : result.minutes === 120
        ? " (2 hours)"
        : "");

  change.textContent =
    `Parking cost: ${currency(result.price)} | ` +
    `Change due: ${currency(result.change)}`;

  startCountdown(result.minutes);
}

calculateButton.addEventListener("click", calculateParking);

amountInput.addEventListener("keydown", event => {
  if (event.key === "Enter" && !sessionActive) {
    calculateParking();
  }
});

closePopup.addEventListener("click", () => {
  expiredDialog.close();
});

expiredDialog.addEventListener("close", () => {
  amountInput.value = "";
  amountInput.focus();
  timerStatus.textContent = "Ready for a new parking session";
  timerStatus.className = "";
});

