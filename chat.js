// =================== GET LOGGED-IN USER ===================
const loggedInUser = localStorage.getItem("loggedInUser");
const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("messageInput");
const notificationContainer = document.getElementById("notification-container");
const typingIndicator = document.getElementById("typing-indicator");

// Redirect to login if no user
if (!loggedInUser) window.location.href = "login.html";

// Load previous messages
let messages = JSON.parse(localStorage.getItem("chatMessages")) || [];

// =================== SOUNDS ===================
const sendSound = new Audio("sounds/send.mp3");
const hoverSound = new Audio("sounds/hover.mp3");

// Play hover sound for all buttons
document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

// =================== NOTIFICATIONS ===================
function showNotification(message) {
  const notif = document.createElement("div");
  notif.classList.add("notification");
  notif.innerText = `${message.sender}: ${message.text}`;
  notificationContainer.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000);
}

// =================== TYPING INDICATOR ===================
function showTypingIndicator(duration = 2000) {
  typingIndicator.classList.add("active");
  setTimeout(() => {
    typingIndicator.classList.remove("active");
  }, duration);
}

// Simulate friend reply
function autoReply(text) {
  showTypingIndicator();
  setTimeout(() => {
    messages.push({
      sender: "Friend",
      text,
      reactions: {},
    });
    renderMessages();
  }, 2000); // duration matches typing indicator
}

// =================== RENDER MESSAGES ===================
function renderMessages() {
  chatContainer.innerHTML = "";

  messages.forEach((msg, index) => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");
    msgDiv.style.position = "relative";

    if (msg.sender === loggedInUser) {
      msgDiv.classList.add("you");
      msgDiv.innerText = `🤖 ${loggedInUser}: ${msg.text}`;
    } else {
      msgDiv.classList.add("friend");
      msgDiv.innerText = `${msg.sender}: ${msg.text}`;

      if (!msg.notified) {
        showNotification(msg);
        msg.notified = true;
      }
    }

    // =================== EDIT & DELETE BUTTONS ===================
    if (msg.sender === loggedInUser) {
      const actionsDiv = document.createElement("div");
      actionsDiv.style.marginTop = "5px";

      const editBtn = document.createElement("button");
      editBtn.innerText = "✏️";
      editBtn.classList.add("action-btn");
      editBtn.style.marginRight = "5px";
      editBtn.onclick = () => editMessage(index);

      const deleteBtn = document.createElement("button");
      deleteBtn.innerText = "🗑️";
      deleteBtn.classList.add("action-btn");
      deleteBtn.onclick = () => deleteMessage(index);

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
      msgDiv.appendChild(document.createElement("br"));
      msgDiv.appendChild(actionsDiv);
    }

    // =================== REACTIONS ===================
    const reactionsDiv = document.createElement("div");
    reactionsDiv.classList.add("reactions");
    const emojis = ["❤️", "😂", "😮", "👍", "👎"];
    emojis.forEach((emoji) => {
      const emojiBtn = document.createElement("span");
      emojiBtn.style.cursor = "pointer";
      emojiBtn.style.marginRight = "5px";

      emojiBtn.innerText =
        msg.reactions && msg.reactions[emoji]
          ? `${emoji} ${msg.reactions[emoji]}`
          : emoji;

      emojiBtn.addEventListener("click", () => {
        if (!msg.reactions) msg.reactions = {};
        msg.reactions[emoji] = msg.reactions[emoji]
          ? msg.reactions[emoji] + 1
          : 1;
        localStorage.setItem("chatMessages", JSON.stringify(messages));
        renderMessages();
      });

      reactionsDiv.appendChild(emojiBtn);
    });

    msgDiv.appendChild(document.createElement("br"));
    msgDiv.appendChild(reactionsDiv);

    chatContainer.appendChild(msgDiv);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
  localStorage.setItem("chatMessages", JSON.stringify(messages));
}

// =================== SEND MESSAGE ===================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  messages.push({
    sender: loggedInUser,
    text,
    reactions: {},
  });

  localStorage.setItem("chatMessages", JSON.stringify(messages));
  messageInput.value = "";
  renderMessages();

  // Play send sound
  sendSound.currentTime = 0;
  sendSound.play();

  // Example: simulate a reply from friend
  autoReply("Hey! This is a simulated reply...");
}

// =================== EDIT MESSAGE ===================
function editMessage(index) {
  const newText = prompt("Edit your message:", messages[index].text);
  if (newText !== null && newText.trim() !== "") {
    messages[index].text = newText.trim();
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    renderMessages();
  }
}

// =================== DELETE MESSAGE ===================
function deleteMessage(index) {
  if (confirm("Are you sure you want to delete this message?")) {
    messages.splice(index, 1);
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    renderMessages();
  }
}

// =================== PAGE NAVIGATION / LOADER ===================
function goBack() {
  const loader = document.getElementById("loader");
  loader.classList.add("active");

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}

// =================== INITIAL RENDER ===================
renderMessages();

// Pre-fill message if coming from profile
const currentChatFriend = localStorage.getItem("currentChatFriend");
if (currentChatFriend) {
  messageInput.value = `@${currentChatFriend} `;
  localStorage.removeItem("currentChatFriend");
}
