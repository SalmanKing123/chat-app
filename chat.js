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
const bgUploadInput = document.getElementById("bg-upload");

// Add voice button dynamically
const chatInputDiv = document.querySelector(".chat-input");
const voiceBtn = document.createElement("button");
voiceBtn.id = "voiceBtn";
voiceBtn.textContent = "🎤";
chatInputDiv.appendChild(voiceBtn);

// Current user
const loggedInUser = localStorage.getItem("loggedInUser") || "You";
const userId = loggedInUser;

// =================== RENDER MESSAGE ===================
function renderMessage(docData, id) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add(
    "message",
    docData.sender === loggedInUser ? "you" : "friend"
  );

  // Text
  msgDiv.innerText = `${docData.sender}: ${docData.text || ""}`;

  // Audio
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
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// =================== LOAD MESSAGES ===================
const messagesQuery = query(
  collection(db, "messages"),
  orderBy("timestamp", "asc")
);
onSnapshot(messagesQuery, (snapshot) => {
  chatContainer.innerHTML = "";
  snapshot.forEach((doc) => renderMessage(doc.data(), doc.id));
});

// =================== SEND MESSAGE ===================
async function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "messages"), {
      sender: loggedInUser,
      text,
      timestamp: serverTimestamp(),
    });
    messageInput.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
  }
}
window.sendMessage = sendMessage;

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

// =================== GO BACK ===================
function goBack() {
  window.location.href = "index.html";
}
window.goBack = goBack;

// =================== UPLOAD BACKGROUND ===================
bgUploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Show locally
  const reader = new FileReader();
  reader.onload = (event) => {
    chatContainer.style.backgroundImage = `url(${event.target.result})`;
    chatContainer.style.backgroundSize = "cover";
    chatContainer.style.backgroundPosition = "center";
  };
  reader.readAsDataURL(file);

  // Upload
  try {
    const storageRef = ref(storage, `chat-backgrounds/${userId}-${Date.now()}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", userId), { chatBackground: downloadURL });
    chatContainer.style.backgroundImage = `url(${downloadURL})`;
  } catch (err) {
    console.error("Error uploading background:", err);
  }
});

async function loadUserBackground() {
  try {
    const userSnap = await getDoc(doc(db, "users", userId));
    if (userSnap.exists() && userSnap.data().chatBackground) {
      const bgURL = userSnap.data().chatBackground;
      chatContainer.style.backgroundImage = `url(${bgURL})`;
      chatContainer.style.backgroundSize = "cover";
      chatContainer.style.backgroundPosition = "center";
    }
  } catch (err) {
    console.error("Error loading background:", err);
  }
}
loadUserBackground();

// =================== VOICE MESSAGES ===================
let mediaRecorder;
let audioChunks = [];

voiceBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
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
        } catch (err) {
          console.error("Error sending voice message:", err);
        }
      };

      mediaRecorder.start();
      voiceBtn.textContent = "⏹️ Stop";
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  } else {
    mediaRecorder.stop();
    voiceBtn.textContent = "🎤";
  }
});
