// Floating emojis generator
const emojis = ["😂", "🔥", "⚡", "🎉", "😎", "💥"];

function createEmoji() {
  const emoji = document.createElement("div");
  emoji.classList.add("emoji");
  emoji.innerText = emojis[Math.floor(Math.random() * emojis.length)];
  emoji.style.left = Math.random() * 100 + "vw";
  emoji.style.animationDuration = 3 + Math.random() * 5 + "s";
  document.body.appendChild(emoji);

  // remove after animation
  setTimeout(() => emoji.remove(), 8000);
}

setInterval(createEmoji, 1000);

// Button action
function enterChat() {
  alert("Entering the secret chat room 🔥");
  // Later: redirect to chat page
  // window.location.href = "chat.html";
}

function goToPage(url) {
  const loader = document.getElementById("loader");
  loader.classList.add("active"); // show loader

  setTimeout(() => {
    window.location.href = url;
  }, 800); // 0.8s delay for loader effect
}

// Example: changing statuses dynamically every few seconds
const statuses = ["Online", "Busy", "Sleeping"];
const statusColors = ["online", "busy", "sleeping"];

function updateStatuses() {
  const friends = ["Sam", "Mohsin", "Arsh"];
  friends.forEach((friend) => {
    const statusSpan = document.getElementById(`status-${friend}`);
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
