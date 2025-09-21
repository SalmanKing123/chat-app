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
const voiceBtn = document.getElementById("voiceBtn");
const bgUploadInput = document.getElementById("bg-upload");

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";
const userId = loggedInUser; // or Firebase Auth UID

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
sendBtn.addEventListener("click", sendMessage);

// =================== VOICE MESSAGES ===================
let mediaRecorder;
let audioChunks = [];

voiceBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      audioChunks = [];

      const audioRef = ref(
        storage,
        `voice-messages/${loggedInUser}-${Date.now()}.webm`
      );
      await uploadBytes(audioRef, audioBlob);
      const downloadURL = await getDownloadURL(audioRef);

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
    mediaRecorder.stop();
    voiceBtn.textContent = "🎤";
  }
});

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    docData.sender === loggedInUser ? "you" : "friend"
  );
  msgDiv.innerText = `${docData.sender}: ${docData.text}`;

  // Add audio player if message has audio
  if (docData.audio) {
    const audioEl = document.createElement("audio");
    audioEl.src = docData.audio;
    audioEl.controls = true;
    audioEl.style.display = "block";
    audioEl.style.marginTop = "5px";
    msgDiv.appendChild(audioEl);
  }

  // Edit/Delete for own messages
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

// =================== LOAD MESSAGES REAL-TIME ===================
const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc")
);
onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";
  snapshot.forEach((doc) => renderMessage(doc.data(), doc.id));
  chatContainer.scrollTop = chatContainer.scrollHeight;
});

// =================== EDIT/DELETE ===================
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
window.goBack = goBack;

// =================== CHAT BACKGROUND ===================
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Render immediately
  const reader = new FileReader();
  reader.onload = (ev) => {
    chatContainer.style.backgroundImage = `url(${ev.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  // Upload to Firebase Storage
  const storageRef = ref(storage, `chat-backgrounds/${userId}-${Date.now()}`);
  await uploadBytes(storageRef, file);

  // Save in Firestore
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
loadUserBackground();
