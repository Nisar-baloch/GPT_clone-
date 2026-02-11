let messages = [];
let firstMessage = true;

// Load chat from localStorage
const saved = localStorage.getItem("chat_messages");
if (saved) {
  messages = JSON.parse(saved);
  messages.forEach(m => addMessage(m.role, m.content));
  firstMessage = messages.length === 0;
}

function saveMessages() {
  localStorage.setItem("chat_messages", JSON.stringify(messages));
}

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("w-64");
  sidebar.classList.toggle("w-0");
}

function toggleMenu() {
  document.getElementById("toolMenu").classList.toggle("hidden");
}

function openFolder() {
  document.getElementById("folderInput").click();
}

function openFile() {
  document.getElementById("fileInput").click();
}

function newChat() {
  document.getElementById("chatBox").innerHTML = "";
  messages = [];
  firstMessage = true;
  localStorage.removeItem("chat_messages");
}

function addMessage(role, text) {
  const chatBox = document.getElementById("chatBox");
  const wrapper = document.createElement("div");
  wrapper.className = "flex " + (role === "user" ? "justify-end" : "justify-start");

  const bubble = document.createElement("div");
  bubble.className = "max-w-md px-4 py-2 rounded-lg " +
    (role === "user" ? "bg-blue-600 rounded-br-none" : "bg-slate-700 rounded-bl-none");

  bubble.innerText = text;
  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTyping() {
  addMessage("assistant", "AI is typing...");
}

function generateChatTitle(text) {
  return text.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 25) + "...";
}

function addChatToSidebar(title) {
  const item = document.createElement("div");
  item.className = "p-2 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer";
  item.innerText = title;
  document.getElementById("chatList").prepend(item);
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  messages.push({ role: "user", content: text });
  saveMessages();

  input.value = "";

  if (firstMessage) {
    addChatToSidebar(generateChatTitle(text));
    firstMessage = false;
  }

  showTyping();

  fetch("/api/chat/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: messages })
  })
  .then(res => {
    if (!res.ok) throw new Error("Server error: " + res.status);
    return res.json();
  })
  .then(data => {
    document.getElementById("chatBox").lastChild.remove();
    const reply = data.choices?.[0]?.message?.content || "No response.";
    typeEffect(reply);
  })
  .catch(err => {
    document.getElementById("chatBox").lastChild.remove();
    addMessage("assistant", "⚠️ " + err.message);
  });
}

function typeEffect(text) {
  let i = 0;
  const chatBox = document.getElementById("chatBox");
  const wrapper = document.createElement("div");
  wrapper.className = "flex justify-start";
  const bubble = document.createElement("div");
  bubble.className = "max-w-md px-4 py-2 rounded-lg bg-slate-700 rounded-bl-none";
  wrapper.appendChild(bubble);
  chatBox.appendChild(wrapper);

  function typing() {
    if (i < text.length) {
      bubble.innerText += text.charAt(i);
      chatBox.scrollTop = chatBox.scrollHeight;
      i++;
      setTimeout(typing, 15);
    } else {
      messages.push({ role: "assistant", content: text });
      saveMessages();
      speakText(text);
    }
  }
  typing();
}

function startListening() {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "en-US";
  rec.onresult = e => {
    document.getElementById("userInput").value = e.results[0][0].transcript;
    sendMessage();
  };
  rec.start();
}

function speakText(text) {
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  speechSynthesis.speak(speech);
}

document.getElementById("userInput").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});
