import { useEffect, useRef } from "react";
import Message from "./Message";
import EmptyChat from "./EmptyChat";
import ChatSkeleton from "./ChatSkeleton";

function ChatWindow({
  messages,
  isLoading,
  isChatLoading,
  user,
  onPromptClick,
  onRegenerate,
}) {
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

  // ==========================================
  // SKELETON WHILE SWITCHING CHATS
  // ==========================================
  if (isChatLoading) {
    return <ChatSkeleton />;
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================
  if (messages.length === 0) {
    return <EmptyChat user={user} onPromptClick={onPromptClick} />;
  }

  // Find the last assistant message — only that one gets a Regenerate button
  const lastAssistantIndex = messages.reduce(
    (lastIndex, message, index) =>
      message.role === "assistant" ? index : lastIndex,
    -1
  );

  return (
    <section className="chat-window">
      <div className="messages-container">
        {messages.map((message, index) => {
          const isEmptyAssistantMessage =
            message.role === "assistant" && !message.content.trim();

          return (
            <Message
              key={message.id}
              role={message.role}
              content={
                isEmptyAssistantMessage && isLoading ? "" : message.content
              }
              isLoading={isEmptyAssistantMessage && isLoading}
              isLastAssistant={index === lastAssistantIndex}
              onRegenerate={() => onRegenerate(message.id)}
              attachment={message.attachment}
            />
          );
        })}

        {/* ====================================
            AUTO SCROLL TARGET
        ==================================== */}
        <div ref={bottomRef} className="chat-bottom-anchor" />
      </div>
    </section>
  );
}

export default ChatWindow;