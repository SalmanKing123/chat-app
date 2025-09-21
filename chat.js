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

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";
const userId = loggedInUser; // or Firebase Auth UID

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message");
  msgDiv.classList.add(docData.sender === loggedInUser ? "you" : "friend");
  msgDiv.innerText = `${docData.sender}: ${docData.text}`;

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
  orderBy("timestamp", "asc")
);

onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";
  snapshot.forEach((doc) => {
    renderMessage(doc.data(), doc.id);
  });
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

// =================== SEND ===================
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

// =================== UPLOAD CHAT BACKGROUND ===================
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 1️⃣ Render immediately using FileReader
  const reader = new FileReader();
  reader.onload = function (event) {
    chatContainer.style.backgroundImage = `url(${event.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  // 2️⃣ Upload file to Firebase Storage
  const storageRef = ref(storage, `chat-backgrounds/${userId}-${Date.now()}`);
  await uploadBytes(storageRef, file);

  // 3️⃣ Get download URL & save in Firestore
  const downloadURL = await getDownloadURL(storageRef);
  const userDocRef = doc(db, "users", userId);
  await updateDoc(userDocRef, { chatBackground: downloadURL });

  // 4️⃣ Set background immediately with the saved URL (optional, sync verification)
  chatContainer.style.backgroundImage = `url(${downloadURL})`;
  chatContainer.style.backgroundSize = "cover";
  chatContainer.style.backgroundPosition = "center";
});

// =================== LOAD USER BACKGROUND ON PAGE LOAD ===================
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

// Call on page load
loadUserBackground();

// =================== VOICE MESSAGES ===================
const voiceBtn = document.getElementById("voiceBtn");
let mediaRecorder;
let audioChunks = [];

voiceBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    // Start recording
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];

      // Upload to Firebase Storage
      const audioRef = ref(
        storage,
        `voice-messages/${loggedInUser}-${Date.now()}.webm`
      );
      await uploadBytes(audioRef, audioBlob);
      const downloadURL = await getDownloadURL(audioRef);

      // Add to Firestore
      await addDoc(collection(db, "messages"), {
        sender: loggedInUser,
        text: "[Voice Message]",
        audio: downloadURL,
        timestamp: serverTimestamp(),
      });
    };

    mediaRecorder.start();
    voiceBtn.textContent = "⏹️ Stop";
  } else {
    // Stop recording
    mediaRecorder.stop();
    voiceBtn.textContent = "🎤";
  }
});

// =================== RENDER AUDIO IN CHAT ===================
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
