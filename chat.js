// =================== IMPORTS ===================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// =================== FIREBASE CONFIG ===================
const firebaseConfig = {
  apiKey: "AIzaSyD0mDWg5NLpS1X1TrJ09QSZwTbV8rOdLpI",
  authDomain: "chat-app-cc84a.firebaseapp.com",
  projectId: "chat-app-cc84a",
  storageBucket: "chat-app-cc84a.firebasestorage.app",
  messagingSenderId: "188306449397",
  appId: "1:188306449397:web:e23bc1ca9a1db3dcbeb6bc",
  measurementId: "G-PR6YGH0LLL",
};

// =================== INIT ===================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =================== DOM ELEMENTS ===================
const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("messageInput");
const notificationContainer = document.getElementById("notification-container");
const typingIndicator = document.getElementById("typing-indicator");

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.classList.add(docData.sender === loggedInUser ? "you" : "friend");
  msgDiv.innerText = `${docData.sender}: ${docData.text}`;

  // Add edit/delete for your own messages
  if (docData.sender === loggedInUser) {
    const actionsDiv = document.createElement("div");
    actionsDiv.style.marginTop = "5px";

    const editBtn = document.createElement("button");
    editBtn.innerText = "✏️";
    editBtn.onclick = () => editMessage(id, docData.text);

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "🗑️";
    deleteBtn.onclick = () => deleteMessage(id);

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    msgDiv.appendChild(document.createElement("br"));
    msgDiv.appendChild(actionsDiv);
  }

  chatContainer.appendChild(msgDiv);
}

// =================== LOAD MESSAGES (REAL-TIME, ORDERED) ===================
const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc") // oldest → newest
);

onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";
  snapshot.forEach((doc) => {
    renderMessage(doc.data(), doc.id);
  });
  chatContainer.scrollTop = chatContainer.scrollHeight; // auto scroll down
});

// =================== SEND ===================
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    sender: loggedInUser,
    text: text,
    timestamp: serverTimestamp(), // ✅ correct ordering
  });

  messageInput.value = "";
}

// =================== EDIT ===================
async function editMessage(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText.trim() !== "") {
    await updateDoc(doc(db, "messages", id), {
      text: newText.trim(),
    });
  }
}

// =================== DELETE ===================
async function deleteMessage(id) {
  if (confirm("Delete this message?")) {
    await deleteDoc(doc(db, "messages", id));
  }
}

// =================== BACK ===================
function goBack() {
  window.location.href = "index.html";
}

// Expose functions globally
window.sendMessage = sendMessage;
window.goBack = goBack;
