// ===================== FLOATING EMOJIS =====================
const emojis = ["😂", "🔥", "⚡", "🎉", "😎", "💥"];

function createEmoji() {
  const emoji = document.createElement("div");
  emoji.classList.add("emoji");
  emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
  emoji.style.left = Math.random() * 100 + "vw"; // random horizontal position
  emoji.style.animationDuration = 3 + Math.random() * 5 + "s"; // random float speed
  document.body.appendChild(emoji);

  // remove after animation
  setTimeout(() => emoji.remove(), 8000);
}

// create a new emoji every second
setInterval(createEmoji, 1000);

// ===================== NAVIGATION FUNCTIONS =====================
function enterChat() {
  alert("Entering the secret chat room 🔥");
  // Later: redirect to chat page
  // window.location.href = "chat.html";
}

function goToPage(url) {
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("active"); // show loader only if exists

  setTimeout(() => {
    window.location.href = url;
  }, 800); // 0.8s delay for loader effect
}

// ===================== FRIEND STATUS UPDATES =====================
const statuses = ["Online", "Busy", "Sleeping"];
const statusColors = ["online", "busy", "sleeping"];

function updateStatuses() {
  const friends = ["Sam", "Basa", "Biya"];
  friends.forEach((friend) => {
    const statusSpan = document.getElementById(`status-${friend}`);
    if (!statusSpan) return; // skip if no element found

    // Randomly pick a status
    const randomIndex = Math.floor(Math.random() * statuses.length);
    statusSpan.innerText = statuses[randomIndex];

    // Remove old classes
    statusSpan.classList.remove("online", "busy", "sleeping");

    // Add new class for color/animation
    statusSpan.classList.add(statusColors[randomIndex]);
  });
}

// Update statuses every 5 seconds
setInterval(updateStatuses, 5000);

// ===================== FIREBASE IMPORT =====================
import { app, analytics } from "./firebaseConfig.js";

// ===================== USER AUTH CHECK =====================
const loggedInUser = localStorage.getItem("loggedInUser");
if (!loggedInUser) {
  window.location.href = "login.html"; // redirect if not logged in
}
