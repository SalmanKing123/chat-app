// Import Firebase SDKs
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD0mDWg5NLpS1X1TrJ09QSZwTbV8rOdLpI",
  authDomain: "chat-app-cc84a.firebaseapp.com",
  projectId: "chat-app-cc84a",
  storageBucket: "chat-app-cc84a.firebasestorage.app",
  messagingSenderId: "188306449397",
  appId: "1:188306449397:web:e23bc1ca9a1db3dcbeb6bc",
  measurementId: "G-PR6YGH0LLL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// =================== USER CHECK ===================
const loggedInUser = localStorage.getItem("loggedInUser");
if (!loggedInUser) window.location.href = "login.html";

document.getElementById("usernameDisplay").innerText = `👤 ${loggedInUser}`;

const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("messageInput");
const notificationContainer = document.getElementById("notification-container");
const typingIndicator = document.getElementById("typing-indicator");

// =================== SOUNDS ===================
const sendSound = new Audio("sounds/send.mp3");
const hoverSound = new Audio("sounds/hover.mp3");

document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    hoverSound.currentTime = 0;
    hoverSound.play();
  });
});

// =================== NOTIFICATIONS ===================
function showNotification(message) {
  if (message.sender === loggedInUser) return; // don't notify for own messages

  const notif = document.createElement("div");
  notif.classList.add("notification");
  notif.innerText = `${message.sender}: ${message.text}`;
  notificationContainer.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000);
}

// =================== RENDER MESSAGES ===================
function renderMessages(messages) {
  chatContainer.innerHTML = "";

  messages.forEach((msg) => {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message");

    if (msg.sender === loggedInUser) {
      msgDiv.classList.add("you");
      msgDiv.innerText = `🤖 ${msg.sender}: ${msg.text}`;
    } else {
      msgDiv.classList.add("friend");
      msgDiv.innerText = `${msg.sender}: ${msg.text}`;
      showNotification(msg);
    }

    chatContainer.appendChild(msgDiv);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// =================== SEND MESSAGE ===================
export async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "messages"), {
      sender: loggedInUser,
      text,
      timestamp: serverTimestamp(),
    });

    messageInput.value = "";
    sendSound.currentTime = 0;
    sendSound.play();
  } catch (e) {
    console.error("Error sending message: ", e);
  }
}

// =================== LOAD MESSAGES IN REAL-TIME ===================
const q = query(collection(db, "messages"), orderBy("timestamp", "asc"));
onSnapshot(q, (snapshot) => {
  const msgs = [];
  snapshot.forEach((doc) => msgs.push(doc.data()));
  renderMessages(msgs);
});

// =================== GO BACK ===================
function goBack() {
  const loader = document.getElementById("loader");
  loader.classList.add("active");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
}
window.goBack = goBack;
window.sendMessage = sendMessage; // expose for button onclick
