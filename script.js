const options = document.querySelectorAll(".option");
const price = document.querySelector("#price");
const timer = document.querySelector("#timer");
const status = document.querySelector("#status");
const start = document.querySelector("#start");
let selected = null;
let interval = null;

options.forEach(option => {
  option.addEventListener("click", () => {
    if (interval) return;
    options.forEach(item => item.classList.remove("selected"));
    option.classList.add("selected");
    selected = { minutes: Number(option.dataset.minutes), price: Number(option.dataset.price) };
    price.textContent = `Price: R$ ${selected.price.toFixed(2).replace(".", ",")}`;
    status.textContent = "Ready to start";
  });
});

start.addEventListener("click", () => {
  if (!selected || interval) {
    if (!selected) status.textContent = "Please select a parking option first.";
    return;
  }
  let remaining = selected.minutes * 60;
  start.disabled = true;
  options.forEach(option => option.disabled = true);
  status.textContent = "Parking session active";

  function updateTimer() {
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    timer.textContent = [hours, minutes, seconds].map(n => String(n).padStart(2, "0")).join(":");
    if (remaining <= 0) {
      clearInterval(interval);
      interval = null;
      status.textContent = "Parking time expired!";
      timer.textContent = "00:00:00";
      start.disabled = false;
      start.textContent = "Start New Session";
      options.forEach(option => option.disabled = false);
      selected = null;
      price.textContent = "Choose an option";
      options.forEach(option => option.classList.remove("selected"));
      return;
    }
    remaining--;
  }
  updateTimer();
  interval = setInterval(updateTimer, 1000);
});