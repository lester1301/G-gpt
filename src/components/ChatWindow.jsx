import { useEffect, useRef } from "react";

import Message from "./Message";

function ChatWindow({ messages, isLoading }) {

  // ==========================================
  // AUTO SCROLL REF
  // ==========================================

  const bottomRef = useRef(null);


  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });

  }, [messages]);


  return (
    <section className="chat-window">

      <div className="messages-container">

        {messages.length === 0 ? (

          <div className="empty-chat-content">

            <div className="g-gpt-icon">
              G
            </div>

            <h1>
              How can I help you today?
            </h1>

            <p>
              Ask me anything. I'm here to help.
            </p>

          </div>

        ) : (

          messages.map((message) => {

            const isEmptyAssistantMessage =
              message.role === "assistant" &&
              !message.content.trim();

            return (
              <Message
                key={message.id}
                role={message.role}
                content={
                  isEmptyAssistantMessage &&
                  isLoading
                    ? ""
                    : message.content
                }
                isLoading={
                  isEmptyAssistantMessage &&
                  isLoading
                }
              />
            );

          })

        )}


        {/* ====================================
            AUTO SCROLL TARGET
        ==================================== */}

        <div
          ref={bottomRef}
          className="chat-bottom-anchor"
        />

      </div>

    </section>
  );
}

export default ChatWindow;