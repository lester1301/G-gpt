import { useEffect, useRef, useState } from "react";

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

const MAX_FILE_SIZE_MB = 8;

function MessageComposer({ onSendMessage, onStop, disabled, onOpenVoiceMode }) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, mimeType, data, previewUrl }
  const [attachmentError, setAttachmentError] = useState("");

  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==========================================
  // AUTO-RESIZE TEXTAREA
  // ==========================================
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input]);

  // ==========================================
  // SETUP SPEECH RECOGNITION (voice typing)
  // ==========================================
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognitionRef.current = recognition;

    return () => recognition.stop();
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ==========================================
  // FILE ATTACHMENT
  // ==========================================
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setAttachmentError("");

    // Some systems report an empty or incorrect MIME type for Word/Excel
    // files, so we also check the file extension as a fallback.
    const extension = file.name.split(".").pop()?.toLowerCase();
    const extensionMap = {
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      xls: "application/vnd.ms-excel",
      csv: "text/csv",
    };

    const resolvedType =
      ALLOWED_TYPES.includes(file.type) ? file.type : extensionMap[extension];

    if (!resolvedType) {
      setAttachmentError(
        "Supported files: images (PNG/JPEG/WEBP), PDF, Word (.docx), Excel (.xlsx/.xls), CSV, and plain text."
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setAttachmentError(`File is too large (max ${MAX_FILE_SIZE_MB}MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // reader.result looks like "data:image/png;base64,AAAA..."
      const base64Data = reader.result.split(",")[1];

      setAttachment({
        name: file.name,
        mimeType: resolvedType,
        data: base64Data,
        previewUrl: resolvedType.startsWith("image/") ? reader.result : null,
      });
    };
    reader.onerror = () => {
      setAttachmentError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    setAttachmentError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = input.trim();

    if ((!message && !attachment) || disabled) {
      return;
    }

    onSendMessage(message, attachment);
    setInput("");
    setAttachment(null);
    setAttachmentError("");
  };

  const handleKeyDown = (event) => {
    if (event.isComposing) return;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  };

  return (
    <div className="composer-wrapper">
      {/* ATTACHMENT PREVIEW */}
      {attachment && (
        <div className="attachment-preview">
          {attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="attachment-preview-thumb"
            />
          ) : (
            <span className="attachment-preview-icon">
              {attachment.mimeType === "application/pdf" && "📄"}
              {attachment.mimeType.includes("word") && "📝"}
              {(attachment.mimeType.includes("sheet") ||
                attachment.mimeType.includes("excel") ||
                attachment.mimeType === "text/csv") &&
                "📊"}
              {attachment.mimeType === "text/plain" && "📃"}
            </span>
          )}
          <span className="attachment-preview-name">{attachment.name}</span>
          <button
            type="button"
            className="attachment-remove-btn"
            onClick={handleRemoveAttachment}
            aria-label="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      {attachmentError && (
        <p className="attachment-error">{attachmentError}</p>
      )}

      <form className="message-composer" onSubmit={handleSubmit}>
        {/* HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(",")}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />

        {/* ADD BUTTON */}
        <button
          type="button"
          className="composer-add-btn"
          disabled={disabled}
          aria-label="Attach file"
          title="Attach an image, PDF, or text file"
          onClick={() => fileInputRef.current?.click()}
        >
          +
        </button>

        {/* MESSAGE INPUT */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? "Listening..."
              : disabled
              ? "G-GPT is thinking..."
              : "Message G-GPT..."
          }
          rows="1"
          disabled={disabled}
        />

        {/* VOICE TYPING MIC */}
        {SpeechRecognitionAPI && (
          <button
            type="button"
            className={`composer-mic-btn ${isListening ? "listening" : ""}`}
            onClick={handleToggleListening}
            disabled={disabled}
            aria-label={isListening ? "Stop listening" : "Voice typing"}
            title={isListening ? "Stop listening" : "Voice typing"}
          >
            🎤
          </button>
        )}

        {/* VOICE MODE */}
        <button
          type="button"
          className="composer-voice-mode-btn"
          onClick={onOpenVoiceMode}
          disabled={disabled}
          aria-label="Voice mode"
          title="Talk to G-GPT"
        >
          🔊
        </button>

        {/* SEND / STOP BUTTON */}
        {disabled ? (
          <button
            type="button"
            className="stop-btn"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
          >
            ■
          </button>
        ) : (
          <button
            type="submit"
            className="send-btn"
            disabled={disabled || (!input.trim() && !attachment)}
          >
            <span>G</span>
          </button>
        )}
      </form>

      <p className="composer-disclaimer">
        G-GPT can make mistakes. Check important information.
      </p>
    </div>
  );
}

export default MessageComposer;