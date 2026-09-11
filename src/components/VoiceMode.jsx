import { useEffect, useRef, useState } from "react";

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition;

// Strip markdown symbols so the spoken text doesn't include
// asterisks, hashes, backticks, etc.
function cleanTextForSpeech(text) {
  return text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/[*_#>~-]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .trim();
}

function VoiceMode({ isOpen, onClose, onSendMessage, lastAssistantMessage, isLoading }) {
  // "idle" | "listening" | "thinking" | "speaking"
  const [status, setStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const hasSpokenRef = useRef(false);

  // ==========================================
  // SETUP SPEECH RECOGNITION
  // ==========================================
  useEffect(() => {
    if (!isOpen || !SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.onend = () => {
      setTranscript((currentTranscript) => {
        const finalText = currentTranscript.trim();
        if (finalText) {
          setStatus("thinking");
          hasSpokenRef.current = false;
          onSendMessage(finalText);
        } else {
          setStatus("idle");
        }
        return "";
      });
    };

    recognition.onerror = () => {
      setStatus("idle");
    };

    recognitionRef.current = recognition;

    // Start listening as soon as Voice Mode opens
    setStatus("listening");
    recognition.start();

    return () => {
      recognition.stop();
      window.speechSynthesis.cancel();
    };
  }, [isOpen]);

  // ==========================================
  // SPEAK THE RESPONSE ONCE IT FINISHES LOADING
  // ==========================================
  useEffect(() => {
    if (!isOpen) return;
    if (status !== "thinking") return;
    if (isLoading) return; // still streaming, wait for it to finish
    if (!lastAssistantMessage || hasSpokenRef.current) return;

    hasSpokenRef.current = true;
    setStatus("speaking");

    const utterance = new SpeechSynthesisUtterance(
      cleanTextForSpeech(lastAssistantMessage)
    );

    utterance.onend = () => {
      if (recognitionRef.current) {
        setStatus("listening");
        recognitionRef.current.start();
      }
    };

    utterance.onerror = () => {
      setStatus("idle");
    };

    window.speechSynthesis.speak(utterance);
  }, [isLoading, status, isOpen, lastAssistantMessage]);

  const handleClose = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  if (!SpeechRecognitionAPI) {
    return (
      <div className="voice-mode-overlay">
        <div className="voice-mode-unsupported">
          <p>
            Voice mode isn't supported in this browser. Try Chrome or Edge.
          </p>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const statusLabel = {
    idle: "Tap the mic to start",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  }[status];

  return (
    <div className="voice-mode-overlay">
      <button
        type="button"
        className="voice-mode-close"
        onClick={handleClose}
        aria-label="Close voice mode"
      >
        ✕
      </button>

      <div className={`voice-mode-orb voice-mode-orb-${status}`}>
        <div className="voice-mode-orb-core" />
      </div>

      <p className="voice-mode-status">{statusLabel}</p>

      {transcript && <p className="voice-mode-transcript">{transcript}</p>}
    </div>
  );
}

export default VoiceMode;