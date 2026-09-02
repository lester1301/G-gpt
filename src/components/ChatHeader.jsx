function ChatHeader({ user, onLogout }) {
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

          <span className="chat-header-status">
            AI Assistant
          </span>

        </div>

      </div>


      {/* ======================================
          RIGHT SIDE
      ====================================== */}

      <div className="chat-header-right">

        {/* Logged-in user */}

        <div className="header-user">

          <div className="header-user-avatar">
            {getUserInitial()}
          </div>

          <div className="header-user-info">

            <span className="header-user-name">
              {user?.name || "User"}
            </span>

          </div>

        </div>


        {/* Logout */}

        <button
          type="button"
          className="header-logout-btn"
          onClick={onLogout}
          title="Logout"
          aria-label="Logout"
        >
          ↪
        </button>


        {/* Existing menu */}

        <button
          type="button"
          className="header-menu-btn"
          title="More options"
          aria-label="More options"
        >
          ⋮
        </button>

      </div>

    </header>
  );
}

export default ChatHeader;