import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Message({ role, content, isLoading, isLastAssistant, onRegenerate }) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // "up" | "down" | null

  // ==========================================
  // COPY CODE BLOCK
  // ==========================================
  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // ==========================================
  // COPY WHOLE MESSAGE
  // ==========================================
  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  // ==========================================
  // FEEDBACK (visual only for now)
  // ==========================================
  const handleFeedback = (value) => {
    setFeedback((previous) => (previous === value ? null : value));
  };

  return (
    <div
      className={`message-row ${
        isUser ? "user-message" : "assistant-message"
      }`}
    >
      {/* ======================================
          AVATAR
      ====================================== */}
      <div className="message-avatar">{isUser ? "U" : "G"}</div>

      {/* ======================================
          MESSAGE CONTENT
      ====================================== */}
      <div className="message-content">
        <div className="message-name">{isUser ? "You" : "G-GPT"}</div>

        {/* ====================================
            MESSAGE TEXT
        ==================================== */}
        <div className="message-text">
          {isLoading ? (
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ children }) {
                  return (
                    <div className="code-block-wrapper">
                      <div className="code-block-header">
                        <span>Code</span>
                        <button
                          type="button"
                          className="copy-code-btn"
                          onClick={() => {
                            const code = children?.props?.children || "";
                            handleCopy(String(code));
                          }}
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <pre>{children}</pre>
                    </div>
                  );
                },
                code({ className, children, ...props }) {
                  const codeText = String(children).replace(/\n$/, "");
                  const isBlock =
                    Boolean(className) || codeText.includes("\n");

                  if (!isBlock) {
                    return (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                a({ children, href, ...props }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {/* ====================================
            MESSAGE ACTIONS
            (hidden while streaming, and only the
            assistant gets regenerate / feedback)
        ==================================== */}
        {!isLoading && content && (
          <div className="message-actions">
            <button
              type="button"
              className="message-action-btn"
              onClick={handleCopyMessage}
              title="Copy message"
            >
              {messageCopied ? "✓ Copied" : "⧉ Copy"}
            </button>

            {!isUser && (
              <>
                {isLastAssistant && (
                  <button
                    type="button"
                    className="message-action-btn"
                    onClick={onRegenerate}
                    title="Regenerate response"
                  >
                    ↻ Regenerate
                  </button>
                )}

                <button
                  type="button"
                  className={`message-action-btn ${
                    feedback === "up" ? "active" : ""
                  }`}
                  onClick={() => handleFeedback("up")}
                  title="Good response"
                >
                  👍
                </button>

                <button
                  type="button"
                  className={`message-action-btn ${
                    feedback === "down" ? "active" : ""
                  }`}
                  onClick={() => handleFeedback("down")}
                  title="Bad response"
                >
                  👎
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;