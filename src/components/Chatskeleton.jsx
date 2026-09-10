function ChatSkeleton() {
  return (
    <section className="chat-window">
      <div className="messages-container">
        <div className="skeleton-row skeleton-row-user">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line" style={{ width: "40%" }} />
          </div>
        </div>

        <div className="skeleton-row">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line" style={{ width: "85%" }} />
            <div className="skeleton-line" style={{ width: "65%" }} />
            <div className="skeleton-line" style={{ width: "72%" }} />
          </div>
        </div>

        <div className="skeleton-row skeleton-row-user">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line" style={{ width: "30%" }} />
          </div>
        </div>

        <div className="skeleton-row">
          <div className="skeleton-avatar" />
          <div className="skeleton-lines">
            <div className="skeleton-line" style={{ width: "60%" }} />
            <div className="skeleton-line" style={{ width: "45%" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ChatSkeleton;