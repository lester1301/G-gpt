import { useState } from "react";

function MessageComposer({
  onSendMessage,
  onStop,
  disabled,
}) {
  const [input, setInput] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const message = input.trim();

    if (!message || disabled) {
      return;
    }

    onSendMessage(message);

    setInput("");
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSubmit(event);
    }
  };

  return (
    <div className="composer-wrapper">

      <form
        className="message-composer"
        onSubmit={handleSubmit}
      >

        {/* ADD BUTTON */}
        <button
          type="button"
          className="composer-add-btn"
          disabled={disabled}
          aria-label="Add"
        >
          +
        </button>


        {/* MESSAGE INPUT */}
        <textarea
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? "G-GPT is thinking..."
              : "Message G-GPT..."
          }
          rows="1"
          disabled={disabled}
        />


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
            disabled={!input.trim()}
            aria-label="Send message"
          >
            ↑
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