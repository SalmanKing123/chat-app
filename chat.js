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
const sendBtn = document.getElementById("sendBtn");
const notificationContainer = document.getElementById("notification-container");
const bgUploadInput = document.getElementById("bg-upload");
const pingSound = document.getElementById("pingSound");

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";
const userId = loggedInUser;

// =================== FUNCTIONS ===================

// Render a message
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    docData.sender === loggedInUser ? "you" : "friend"
  );
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
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Send message
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  await addDoc(collection(db, "messages"), {
    sender: loggedInUser,
    text: text,
    timestamp: serverTimestamp(),
  });
  messageInput.value = "";
}

// Edit message
async function editMessage(id, oldText) {
  const newText = prompt("Edit your message:", oldText);
  if (newText && newText.trim() !== "") {
    await updateDoc(doc(db, "messages", id), { text: newText.trim() });
  }
}

// Delete message
async function deleteMessage(id) {
  if (confirm("Delete this message?")) {
    await deleteDoc(doc(db, "messages", id));
  }
}

// Go back
function goBack() {
  window.location.href = "index.html";
}

// =================== EVENT LISTENERS ===================
sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Background upload
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Show immediately
  const reader = new FileReader();
  reader.onload = (event) => {
    chatContainer.style.backgroundImage = `url(${event.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  // Upload to Firebase
  const storageRef = ref(storage, `chat-backgrounds/${userId}-${Date.now()}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { chatBackground: downloadURL });
  chatContainer.style.backgroundImage = `url(${downloadURL})`;
});

// Load background on page load
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
loadUserBackground();

// =================== REAL-TIME MESSAGE LISTENER ===================
let lastMessageId = null; // Track last message

const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc")
);

onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";

  snapshot.forEach((doc) => {
    renderMessage(doc.data(), doc.id);
  });

  // Play ping only for new message
  const lastDoc = snapshot.docs[snapshot.docs.length - 1];
  if (
    lastDoc &&
    lastDoc.id !== lastMessageId &&
    lastDoc.data().sender !== loggedInUser
  ) {
    pingSound.currentTime = 0;
    pingSound.play();

    // Show notification once
    showNotification(`${lastDoc.data().sender}: ${lastDoc.data().text}`);
  }

  if (lastDoc) lastMessageId = lastDoc.id;
});

// =================== NOTIFICATIONS ===================
function showNotification(text) {
  const notif = document.createElement("div");
  notif.classList.add("notification");
  notif.innerText = text;
  notificationContainer.appendChild(notif);
  setTimeout(() => notif.remove(), 3000); // auto remove
}
