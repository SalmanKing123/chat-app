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
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

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
const storage = getStorage(app);

// =================== DOM ELEMENTS ===================
const chatContainer = document.getElementById("chat-container");
const messageInput = document.getElementById("messageInput");
const notificationContainer = document.getElementById("notification-container");
const bgUploadInput = document.getElementById("bg-upload");
const sendBtn = document.getElementById("sendBtn");

// =================== CURRENT USER ===================
const loggedInUser = localStorage.getItem("loggedInUser") || "You";

// =================== USER COLORS ===================
const userColors = {
  Sam: "#FF69B4",
  Basa: "#00FF7F",
  Biya: "#FFD700",
  [loggedInUser]: "#FFFF00",
};

// =================== NOTIFICATION SOUND ===================
const pingSound = new Audio("sounds/ping.mp3");

// =================== SEND MESSAGE ===================
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  sendBtn.disabled = true;

  await addDoc(collection(db, "messages"), {
    sender: loggedInUser,
    text: text,
    timestamp: serverTimestamp(),
  });

  messageInput.value = "";
  sendBtn.disabled = false;
}
sendBtn.addEventListener("click", sendMessage);
window.sendMessage = sendMessage;

// =================== EDIT & DELETE ===================
async function editMessage(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText.trim() !== "") {
    await updateDoc(doc(db, "messages", id), { text: newText.trim() });
  }
}

async function deleteMessage(id) {
  if (confirm("Delete this message?")) {
    await deleteDoc(doc(db, "messages", id));
  }
}

// =================== BACK BUTTON ===================
function goBack() {
  window.location.href = "index.html";
}
window.goBack = goBack;

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    docData.sender === loggedInUser ? "you" : "friend"
  );

  const textSpan = document.createElement("span");
  textSpan.textContent = docData.text;
  textSpan.style.backgroundColor = userColors[docData.sender] || "#CCCCCC";
  textSpan.style.padding = "8px 12px";
  textSpan.style.borderRadius = "15px";
  textSpan.style.display = "inline-block";
  msgDiv.appendChild(textSpan);

  const timeSpan = document.createElement("span");
  if (docData.timestamp && docData.timestamp.toDate) {
    const d = docData.timestamp.toDate();
    timeSpan.textContent = ` ${d.getHours()}:${d
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }
  timeSpan.style.fontSize = "12px";
  timeSpan.style.marginLeft = "5px";
  msgDiv.appendChild(timeSpan);

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
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// =================== LOAD MESSAGES ===================
let lastMessageId = null;
const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc")
);

onSnapshot(messagesQuery, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const data = change.doc.data();
      renderMessage(data, change.doc.id);

      if (change.doc.id !== lastMessageId && data.sender !== loggedInUser) {
        pingSound.play().catch(() => {});
        showNotification(`${data.sender}: ${data.text}`);
      }

      lastMessageId = change.doc.id;
    }
  });
});

// =================== NOTIFICATIONS ===================
function showNotification(text) {
  const notif = document.createElement("div");
  notif.classList.add("notification");
  notif.innerText = text;
  notificationContainer.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

// =================== GLOBAL CHAT BACKGROUND ===================
const chatBgRef = doc(db, "chatSettings", "global");

onSnapshot(chatBgRef, (snap) => {
  if (snap.exists()) {
    const bgURL = snap.data().background;
    if (bgURL) {
      chatContainer.style.backgroundImage = `url(${bgURL})`;
      chatContainer.style.backgroundSize = "cover";
      chatContainer.style.backgroundPosition = "center";
    }
  }
});

// Upload new background
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    chatContainer.style.backgroundImage = `url(${ev.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  const storageRef = ref(storage, `chat-backgrounds/global-${Date.now()}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  await updateDoc(chatBgRef, { background: downloadURL });
});

// =================== INITIALIZE BACKGROUND ===================
async function loadInitialBackground() {
  const snap = await getDoc(chatBgRef);
  if (snap.exists()) {
    const bgURL = snap.data().background;
    if (bgURL) {
      chatContainer.style.backgroundImage = `url(${bgURL})`;
      chatContainer.style.backgroundSize = "cover";
      chatContainer.style.backgroundPosition = "center";
    }
  }
}
loadInitialBackground();

// =================== HIDE LOADER ===================
const loader = document.getElementById("loader");
if (loader) loader.style.display = "none";

// Scroll to bottom initially
chatContainer.scrollTop = chatContainer.scrollHeight;
