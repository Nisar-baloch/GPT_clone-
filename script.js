
const ApiKey = "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";
let messages = [];
let firstMessage = true;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

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

  bubble.textContent = text;
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

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ApiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": window.location.href,
      "X-Title": "ChatGPT Clone"
    },
    body: JSON.stringify({
      "model": "openrouter/free",
      "messages": messages,
      "reasoning": {
        "enabled": true,
        "type": "enabled"
      }
    }),
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("chatBox").lastChild.remove();
    
    if (data.error) {
      const errorMsg = data.error.message || JSON.stringify(data.error);
      console.error("API Error:", data.error);
      addMessage("assistant", " Error: " + errorMsg);
      return;
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response format:", data);
      addMessage("assistant", " Invalid API response");
      return;
    }

    const reply = data.choices[0].message.content || "";
    if (!reply) {
      addMessage("assistant", " No response content from API");
      return;
    }
    const reasoning = data.choices[0].message.reasoning_details;
    
    // Add assistant message with reasoning
    messages.push({
      role: "assistant",
      content: reply,
      reasoning_details: reasoning
    });
    
    typeEffect(reply);
  })
  .catch(error => {
    document.getElementById("chatBox").lastChild.remove();
    console.error("Network error:", error);
    addMessage("assistant", " Connection error: " + error.message + "\n\nMake sure your API key is valid and set in the script.");
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
      bubble.textContent += text.charAt(i);
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
