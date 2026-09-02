function EmptyChat({ user, onPromptClick }) {

  const firstName =
    user?.name?.split(" ")[0] ||
    user?.username ||
    "there";


  const suggestions = [
    {
      icon: "✦",
      title: "Explain something",
      text: "Explain a complex topic in a simple way",
    },

    {
      icon: "⌘",
      title: "Write some code",
      text: "Help me build a website or application",
    },

    {
      icon: "◈",
      title: "Learn something",
      text: "Teach me something interesting",
    },

    {
      icon: "✎",
      title: "Write something",
      text: "Help me write or improve my content",
    },
  ];


  return (

    <section className="empty-chat">

      {/* =====================================
          G LOGO
      ===================================== */}

      <div className="empty-chat-logo-wrap">

        <div className="empty-chat-glow"></div>

        <div className="empty-chat-logo">
          G
        </div>

      </div>


      {/* =====================================
          WELCOME
      ===================================== */}

      <div className="empty-chat-content">

        <p className="empty-chat-greeting">
          Hey {firstName} 👋
        </p>

        <h1>
          How can I help you
          <span> today?</span>
        </h1>

        <p className="empty-chat-description">
          Ask me anything. Build something,
          learn something, or just have a chat.
        </p>

      </div>


      {/* =====================================
          SUGGESTIONS
      ===================================== */}

      <div className="empty-chat-suggestions">

        {suggestions.map(
          (suggestion, index) => (

            <button
              key={index}
              type="button"
              className="suggestion-card"

              onClick={() =>
                onPromptClick(
                  suggestion.text
                )
              }
            >

              <div className="suggestion-icon">
                {suggestion.icon}
              </div>

              <div className="suggestion-text">

                <strong>
                  {suggestion.title}
                </strong>

                <span>
                  {suggestion.text}
                </span>

              </div>

              <div className="suggestion-arrow">
                →
              </div>

            </button>

          )
        )}

      </div>

    </section>

  );

}

export default EmptyChat;