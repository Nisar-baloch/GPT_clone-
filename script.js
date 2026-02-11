const ApiKey = "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";
let messages = [];
let firstMessage = true;

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
  input.value = "";

  if (firstMessage) {
    addChatToSidebar(generateChatTitle(text));
    firstMessage = false;
  }

  showTyping();

  fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openrouter/free",
      messages: messages,
    }),
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.choices[0].message.content;
    document.getElementById("chatBox").lastChild.remove();
    typeEffect(reply);
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
