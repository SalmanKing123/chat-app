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
const typingIndicator = document.getElementById("typing-indicator");
const bgUploadInput = document.getElementById("bg-upload");
const sendBtn = document.getElementById("sendBtn");

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";
const userId = loggedInUser;

// =================== GLOBALS ===================
const notifiedMessages = new Set(); // track notifications

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    docData.sender === loggedInUser ? "you" : "friend"
  );

  msgDiv.innerText = `${docData.sender}: ${docData.text}`;

  // Render audio if exists
  if (docData.audio) {
    const audioEl = document.createElement("audio");
    audioEl.src = docData.audio;
    audioEl.controls = true;
    audioEl.style.display = "block";
    audioEl.style.marginTop = "5px";
    msgDiv.appendChild(audioEl);
  }

  // Add edit/delete for own messages
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

// =================== LOAD MESSAGES (REAL-TIME) ===================
const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc")
);

onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    renderMessage(data, doc.id);

    // Notifications for new messages only once
    if (data.sender !== loggedInUser && !notifiedMessages.has(doc.id)) {
      // Play ping sound
      const ping = new Audio("sounds/ping.mp3");
      ping.play();

      // Browser notification
      if (Notification.permission === "granted") {
        new Notification(`New message from ${data.sender}`, {
          body: data.text || "📢 New message",
          icon: "favicon.ico",
        });
      }

      notifiedMessages.add(doc.id);
    }
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
});

// =================== SEND MESSAGE ===================
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  await addDoc(collection(db, "messages"), {
    sender: loggedInUser,
    text,
    timestamp: serverTimestamp(),
  });

  messageInput.value = "";
}

// =================== EDIT / DELETE ===================
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

// =================== BACK ===================
function goBack() {
  window.location.href = "index.html";
}

// =================== UPLOAD CHAT BACKGROUND ===================
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    chatContainer.style.backgroundImage = `url(${event.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  const storageRef = ref(storage, `chat-backgrounds/${userId}-${Date.now()}`);
  await uploadBytes(storageRef, file);

  const downloadURL = await getDownloadURL(storageRef);
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { chatBackground: downloadURL });

  chatContainer.style.backgroundImage = `url(${downloadURL})`;
  chatContainer.style.backgroundSize = "cover";
  chatContainer.style.backgroundPosition = "center";
});

// =================== LOAD USER BACKGROUND ===================
async function loadUserBackground() {
  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    const bgURL = userSnap.data().chatBackground;
    if (bgURL) {
      chatContainer.style.backgroundImage = `url(${bgURL})`;
      chatContainer.style.backgroundSize = "cover";
      chatContainer.style.backgroundPosition = "center";
    }
  }
}

// =================== PERMISSIONS ===================
if (Notification.permission !== "granted") {
  Notification.requestPermission();
}

// =================== INIT ===================
loadUserBackground();

// =================== EVENT LISTENERS ===================
sendBtn.addEventListener("click", sendMessage);
window.sendMessage = sendMessage;
window.goBack = goBack;
