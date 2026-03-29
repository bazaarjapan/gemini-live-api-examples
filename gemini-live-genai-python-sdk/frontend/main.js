const statusDiv = document.getElementById("status");
const statusDetail = document.getElementById("statusDetail");
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const sessionEndSection = document.getElementById("session-end-section");
const restartBtn = document.getElementById("restartBtn");
const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");
const screenBtn = document.getElementById("screenBtn");
const disconnectBtn = document.getElementById("disconnectBtn");
const textInput = document.getElementById("textInput");
const sendBtn = document.getElementById("sendBtn");
const videoPreview = document.getElementById("video-preview");
const videoPlaceholder = document.getElementById("video-placeholder");
const connectBtn = document.getElementById("connectBtn");
const chatLog = document.getElementById("chat-log");
const chatEmptyState = document.getElementById("chatEmptyState");
const voiceSelect = document.getElementById("voiceSelect");
const voiceDescription = document.getElementById("voiceDescription");
const sessionVoice = document.getElementById("sessionVoice");
const sessionHint = document.getElementById("sessionHint");
const mobileVoicePill = document.getElementById("mobileVoicePill");
const mobileHintPill = document.getElementById("mobileHintPill");

let currentGeminiMessageDiv = null;
let currentUserMessageDiv = null;
let currentMediaMode = null;

const mediaHandler = new MediaHandler();

const CONTROL_COPY = {
  mic: {
    idle: { title: "マイク開始", subtitle: "話しかける" },
    active: { title: "マイク停止", subtitle: "音声入力を止める" },
  },
  camera: {
    idle: { title: "カメラ開始", subtitle: "相手に映像を送る" },
    active: { title: "カメラ停止", subtitle: "カメラ送信を止める" },
  },
  screen: {
    idle: { title: "画面共有", subtitle: "作業画面を見せる" },
    active: { title: "共有停止", subtitle: "画面共有を止める" },
  },
  disconnect: {
    idle: { title: "切断", subtitle: "会話を終了する" },
  },
};

const voiceDescriptions = {
  Puck: "明るく軽快な話し方",
  Charon: "落ち着いて低めの話し方",
  Kore: "やわらかく自然な話し方",
  Fenrir: "力強くはっきりした話し方",
  Aoede: "上品でなめらかな話し方",
};

function setStatus(text, tone, detail) {
  statusDiv.textContent = text;
  statusDiv.className = `status ${tone}`;
  statusDetail.textContent = detail;
}

function setControlState(button, copy, isActive = false) {
  button.querySelector(".control-title").textContent = copy.title;
  button.querySelector(".control-subtitle").textContent = copy.subtitle;
  button.classList.toggle("is-active", isActive);
}

function updateVoiceDescription() {
  const description = voiceDescriptions[voiceSelect.value] || "";
  voiceDescription.textContent = description;
  sessionVoice.textContent = `声: ${voiceSelect.value} / ${description}`;
  mobileVoicePill.textContent = `声: ${voiceSelect.value}`;
}

function updateSessionHint(text) {
  sessionHint.textContent = text;
  mobileHintPill.textContent = text;
}

function hideEmptyState() {
  if (chatEmptyState) {
    chatEmptyState.classList.add("hidden");
  }
}

function showEmptyState() {
  if (chatEmptyState) {
    chatEmptyState.classList.remove("hidden");
  }
}

function appendMessage(type, text) {
  hideEmptyState();
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${type}`;
  msgDiv.textContent = text;
  chatLog.appendChild(msgDiv);
  chatLog.scrollTop = chatLog.scrollHeight;
  return msgDiv;
}

function resetControlStates() {
  setControlState(micBtn, CONTROL_COPY.mic.idle, false);
  setControlState(cameraBtn, CONTROL_COPY.camera.idle, false);
  setControlState(screenBtn, CONTROL_COPY.screen.idle, false);
  setControlState(disconnectBtn, CONTROL_COPY.disconnect.idle, false);
  currentMediaMode = null;
}

function stopVisualStream() {
  mediaHandler.stopVideo(videoPreview);
  videoPlaceholder.classList.remove("hidden");
  currentMediaMode = null;
  setControlState(cameraBtn, CONTROL_COPY.camera.idle, false);
  setControlState(screenBtn, CONTROL_COPY.screen.idle, false);
}

function handleJsonMessage(msg) {
  if (msg.type === "interrupted") {
    mediaHandler.stopAudioPlayback();
    currentGeminiMessageDiv = null;
    currentUserMessageDiv = null;
    updateSessionHint("割り込みました。続けて話しかけるかテキストを送ってください");
    return;
  }

  if (msg.type === "turn_complete") {
    currentGeminiMessageDiv = null;
    currentUserMessageDiv = null;
    updateSessionHint("応答が完了しました。続けて話しかけるかテキストを送ってください");
    return;
  }

  if (msg.type === "user") {
    if (currentUserMessageDiv) {
      currentUserMessageDiv.textContent += msg.text;
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      currentUserMessageDiv = appendMessage("user", msg.text);
    }
    return;
  }

  if (msg.type === "gemini") {
    if (currentGeminiMessageDiv) {
      currentGeminiMessageDiv.textContent += msg.text;
      chatLog.scrollTop = chatLog.scrollHeight;
    } else {
      currentGeminiMessageDiv = appendMessage("gemini", msg.text);
    }
    return;
  }

  if (msg.type === "error") {
    setStatus("接続エラー", "error", msg.error || "セッションでエラーが発生しました");
    updateSessionHint("接続が不安定です。切断して再接続してください");
  }
}

const geminiClient = new GeminiClient({
  onOpen: () => {
    setStatus("接続完了", "connected", "マイク開始でライブ会話を始められます");
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    sessionEndSection.classList.add("hidden");
    updateVoiceDescription();
    updateSessionHint("まずはマイクを開始して話しかけてください");

    geminiClient.sendText(
      `System: 日本語で簡潔に自己紹介してください。
       このデモは Gemini Live API の会話デモであることを伝えてください。
       現在の声のキャラクターは「${voiceSelect.value}（${voiceDescriptions[voiceSelect.value]}）」です。
       音声入力は日本語として解釈し、日本語だけで応答してください。
       返答は常に自然な日本語だけを使ってください。`
    );
  },
  onMessage: (event) => {
    if (typeof event.data === "string") {
      try {
        handleJsonMessage(JSON.parse(event.data));
      } catch (error) {
        console.error("Parse error:", error);
      }
    } else {
      mediaHandler.playAudio(event.data);
    }
  },
  onClose: () => {
    setStatus("切断済み", "disconnected", "必要なら新しいセッションを開始してください");
    showSessionEnd();
  },
  onError: () => {
    setStatus("接続エラー", "error", "ネットワークまたは API 応答を確認してください");
  },
});

connectBtn.onclick = async () => {
  setStatus("接続しています...", "connected", "音声セッションを準備しています");
  connectBtn.disabled = true;

  try {
    await mediaHandler.initializeAudio();
    updateVoiceDescription();
    geminiClient.connect(voiceSelect.value);
  } catch (error) {
    console.error("Connection error:", error);
    setStatus("接続失敗", "error", error.message || "接続に失敗しました");
    connectBtn.disabled = false;
  }
};

disconnectBtn.onclick = () => {
  updateSessionHint("セッションを終了しています");
  geminiClient.disconnect();
};

micBtn.onclick = async () => {
  if (mediaHandler.isRecording) {
    mediaHandler.stopAudio();
    setControlState(micBtn, CONTROL_COPY.mic.idle, false);
    updateSessionHint("マイクを停止しました。再開するにはもう一度押してください");
    return;
  }

  try {
    await mediaHandler.startAudio((data) => {
      if (geminiClient.isConnected()) {
        geminiClient.send(data);
      }
    });
    setControlState(micBtn, CONTROL_COPY.mic.active, true);
    updateSessionHint("マイク入力中です。自然に話しかけてください");
  } catch (error) {
    alert("音声入力を開始できませんでした");
  }
};

cameraBtn.onclick = async () => {
  if (currentMediaMode === "camera") {
    stopVisualStream();
    updateSessionHint("カメラ送信を停止しました");
    return;
  }

  if (currentMediaMode === "screen") {
    stopVisualStream();
  }

  try {
    await mediaHandler.startVideo(videoPreview, (base64Data) => {
      if (geminiClient.isConnected()) {
        geminiClient.sendImage(base64Data);
      }
    });
    currentMediaMode = "camera";
    videoPlaceholder.classList.add("hidden");
    setControlState(cameraBtn, CONTROL_COPY.camera.active, true);
    setControlState(screenBtn, CONTROL_COPY.screen.idle, false);
    updateSessionHint("カメラ映像を送信中です");
  } catch (error) {
    alert("カメラにアクセスできませんでした");
  }
};

screenBtn.onclick = async () => {
  if (currentMediaMode === "screen") {
    stopVisualStream();
    updateSessionHint("画面共有を停止しました");
    return;
  }

  if (currentMediaMode === "camera") {
    stopVisualStream();
  }

  try {
    await mediaHandler.startScreen(
      videoPreview,
      (base64Data) => {
        if (geminiClient.isConnected()) {
          geminiClient.sendImage(base64Data);
        }
      },
      () => {
        stopVisualStream();
        updateSessionHint("画面共有が終了しました");
      }
    );
    currentMediaMode = "screen";
    videoPlaceholder.classList.add("hidden");
    setControlState(screenBtn, CONTROL_COPY.screen.active, true);
    setControlState(cameraBtn, CONTROL_COPY.camera.idle, false);
    updateSessionHint("画面を共有中です");
  } catch (error) {
    alert("画面共有を開始できませんでした");
  }
};

function sendText() {
  const text = textInput.value.trim();
  if (!text || !geminiClient.isConnected()) {
    return;
  }

  geminiClient.sendText(text);
  appendMessage("user", text);
  textInput.value = "";
  currentUserMessageDiv = null;
  currentGeminiMessageDiv = null;
  updateSessionHint("テキストを送信しました。Gemini の応答を待っています");
}

sendBtn.onclick = sendText;
textInput.onkeypress = (event) => {
  if (event.key === "Enter") {
    sendText();
  }
};

function resetUI() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  sessionEndSection.classList.add("hidden");

  mediaHandler.stopAudio();
  mediaHandler.stopAudioPlayback();
  stopVisualStream();
  resetControlStates();

  currentGeminiMessageDiv = null;
  currentUserMessageDiv = null;
  chatLog.innerHTML = "";
  chatLog.appendChild(chatEmptyState);
  showEmptyState();
  textInput.value = "";
  connectBtn.disabled = false;

  updateVoiceDescription();
  setStatus("未接続", "disconnected", "まずは声を選んで接続してください");
}

function showSessionEnd() {
  appSection.classList.add("hidden");
  sessionEndSection.classList.remove("hidden");
  mediaHandler.stopAudio();
  mediaHandler.stopAudioPlayback();
  stopVisualStream();
  resetControlStates();
}

restartBtn.onclick = () => {
  resetUI();
};

voiceSelect.onchange = () => {
  updateVoiceDescription();
};

updateVoiceDescription();
resetControlStates();
