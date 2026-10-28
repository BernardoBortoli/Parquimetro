

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
      return { success: false, message: "Insira uma quantia valida." };
    }

    const cents = Math.round(amount * 100);

    if (Math.abs(amount * 100 - cents) > 0.000001) {
      return {
        success: false,
        message: "Use no máximo duas casas decimais."
      };
    }

    if (cents < 100) {
      return {
        success: false,
        message: "Pagamento insuficiente. Valor minimo: R$ 1.00."
      };
    }

    if (cents > this.maxPayment) {
      return {
        success: false,
        message: "O pagamento maximo é de R$ 1,000.00."
      };
    }

    const tier = [...this.tiers]
      .reverse()
      .find(option => cents >= option.price);

    if (!tier) {
      return {
        success: false,
        message: "Pagamento insuficiente. O valor minimo é de R$ 2.00."
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
  message.className = "Erro";
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
    timerStatus.textContent = "Tempo de estacionamento expirado!";
    timerStatus.className = "Erro";

    amountInput.disabled = false;
    calculateButton.disabled = false;

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

  timerStatus.textContent = "Sessão ativa";
  timerStatus.className = "Sucesso";

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
    displayError("Insira uma quantia valida entre R$ 0.01 e R$ 1,000.00, com no máximo duas casas decimais.");
    return;
  }

  const amount = Number(rawValue);
  const result = meter.calculate(amount);

  if (!result.success) {
    displayError(result.message);
    return;
  }

  message.textContent = "Pagamento realizado com sucesso!";
  message.className = "Sucesso";

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
  timerStatus.textContent = "Pronto para iniciar uma nova sessão";
  timerStatus.className = "";
});