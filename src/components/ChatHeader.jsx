function ChatHeader({ user }) {
  // Get user's first letter for avatar
  const getUserInitial = () => {
    if (!user?.name) {
      return "G";
    }
    return user.name.charAt(0).toUpperCase();
  };

  return (
    <header className="chat-header">
      {/* ======================================
          LEFT SIDE
      ====================================== */}
      <div className="chat-header-left">
        <div className="chat-header-title">
          <h2>G-GPT</h2>
          <span className="chat-header-status">AI Assistant</span>
        </div>
      </div>

      {/* ======================================
          RIGHT SIDE
          (logout already lives in the sidebar's
          user card, so this only shows identity)
      ====================================== */}
      <div className="chat-header-right">
        <div className="header-user">
          <div className="header-user-avatar">{getUserInitial()}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || "User"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ChatHeader;