import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function Message({
  role,
  content,
  isLoading,
}) {
  const isUser = role === "user";

  const [copied, setCopied] = useState(false);


  // ==========================================
  // COPY CODE
  // ==========================================

  const handleCopy = async (code) => {
    try {

      await navigator.clipboard.writeText(
        code
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {

      console.error(
        "Copy failed:",
        error
      );

    }
  };


  return (
    <div
      className={`message-row ${
        isUser
          ? "user-message"
          : "assistant-message"
      }`}
    >

      {/* ======================================
          AVATAR
      ====================================== */}

      <div className="message-avatar">
        {isUser ? "U" : "G"}
      </div>


      {/* ======================================
          MESSAGE CONTENT
      ====================================== */}

      <div className="message-content">

        <div className="message-name">
          {isUser ? "You" : "G-GPT"}
        </div>


        {/* ====================================
            MESSAGE TEXT
        ==================================== */}

        <div className="message-text">

          {/* ------------------------------------
              TYPING INDICATOR
          ------------------------------------ */}

          {isLoading ? (

            <div className="typing-indicator">

              <span></span>
              <span></span>
              <span></span>

            </div>

          ) : (

            /* ----------------------------------
               MARKDOWN
            ---------------------------------- */

            <ReactMarkdown
              remarkPlugins={[
                remarkGfm,
              ]}

              components={{

                // ==============================
                // CODE BLOCK
                // ==============================

                pre({ children }) {

                  return (
                    <div className="code-block-wrapper">

                      <div className="code-block-header">

                        <span>
                          Code
                        </span>

                        <button
                          type="button"
                          className="copy-code-btn"
                          onClick={() => {

                            const code =
                              children
                                ?.props
                                ?.children || "";

                            handleCopy(
                              String(code)
                            );

                          }}
                        >
                          {copied
                            ? "Copied!"
                            : "Copy"}
                        </button>

                      </div>


                      <pre>
                        {children}
                      </pre>

                    </div>
                  );
                },


                // ==============================
                // CODE
                // ==============================

                code({
                  inline,
                  children,
                  ...props
                }) {

                  if (inline) {

                    return (
                      <code
                        className="inline-code"
                        {...props}
                      >
                        {children}
                      </code>
                    );

                  }


                  return (
                    <code {...props}>
                      {children}
                    </code>
                  );

                },


                // ==============================
                // LINKS
                // ==============================

                a({
                  children,
                  href,
                  ...props
                }) {

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

      </div>

    </div>
  );
}

export default Message;