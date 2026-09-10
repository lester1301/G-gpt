function Sidebar({
  user,
  onLogout,
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onOpenSettings,
}) {
  // ==========================================
  // GROUP CHATS BY DATE
  // ==========================================
  const groupChatsByDate = () => {
    const today = [];
    const yesterday = [];
    const older = [];

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    (chats || []).forEach((chat) => {
      const chatDate = new Date(chat.updatedAt || chat.createdAt);

      if (chatDate >= startOfToday) {
        today.push(chat);
      } else if (chatDate >= startOfYesterday) {
        yesterday.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { today, yesterday, older };
  };

  const { today, yesterday, older } = groupChatsByDate();

  const getUserInitial = () => {
    if (!user?.name) {
      return "U";
    }
    return user.name.charAt(0).toUpperCase();
  };

  const handleDelete = (event, chatId) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Delete this conversation? This cannot be undone."
    );

    if (confirmed) {
      onDeleteChat(chatId);
    }
  };

  const renderChatGroup = (title, groupChats) => (
    <div className="history-section" key={title}>
      <div className="history-title">{title}</div>
      <div className="history-list">
        {groupChats.length === 0 ? (
          <div className="history-empty">No previous chats</div>
        ) : (
          groupChats.map((chat) => (
            <div
              key={chat._id}
              className={`history-chat-wrapper ${
                activeChat === chat._id ? "active" : ""
              }`}
            >
              <button
                type="button"
                className="history-chat"
                onClick={() => onSelectChat(chat._id)}
              >
                <span className="history-chat-icon">💬</span>
                <span className="history-chat-title">{chat.title}</span>
              </button>

              <button
                type="button"
                className="chat-delete-btn"
                onClick={(event) => handleDelete(event, chat._id)}
                aria-label="Delete chat"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <aside className="sidebar">
      {/* ======================================
          HEADER / LOGO
      ====================================== */}
      <div className="sidebar-header">
        <span className="sidebar-logo">G-GPT</span>
      </div>

      {/* ======================================
          NEW CHAT
      ====================================== */}
      <div className="sidebar-new-chat">
        <button type="button" className="new-chat-btn" onClick={onNewChat}>
          <span className="new-chat-icon">+</span>
          New Chat
        </button>
      </div>

      {/* ======================================
          CHAT HISTORY
      ====================================== */}
      <div className="sidebar-history">
        {renderChatGroup("Today", today)}
        {renderChatGroup("Yesterday", yesterday)}
        {renderChatGroup("Older", older)}
      </div>

      {/* ======================================
          BOTTOM SECTION
      ====================================== */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-bottom-btn"
          onClick={onOpenSettings}
        >
          <span className="sidebar-bottom-icon">⚙</span>
          Settings
        </button>

        <button type="button" className="sidebar-bottom-btn">
          <span className="sidebar-bottom-icon">?</span>
          Help
        </button>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{getUserInitial()}</div>
            <div className="sidebar-user-details">
              <div className="sidebar-user-name">{user?.name || "User"}</div>
              <div className="sidebar-user-email">{user?.email || ""}</div>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            aria-label="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;