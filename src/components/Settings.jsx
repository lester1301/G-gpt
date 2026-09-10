function Settings({ isOpen, onClose, theme, onToggleTheme, user, chats, onClearAllChats }) {
  if (!isOpen) {
    return null;
  }

  const getUserInitial = () => {
    if (!user?.name) {
      return "U";
    }
    return user.name.charAt(0).toUpperCase();
  };

  const handleClearAllChats = () => {
    if (!chats || chats.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Delete all ${chats.length} conversation(s)? This cannot be undone.`
    );

    if (confirmed) {
      onClearAllChats();
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* ======================================
            HEADER
        ====================================== */}
        <div className="settings-header">
          <h2>Settings</h2>
          <button
            type="button"
            className="settings-close-btn"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="settings-body">
          {/* ====================================
              APPEARANCE
          ==================================== */}
          <div className="settings-section">
            <span className="settings-section-title">Appearance</span>

            <div className="theme-segmented">
              <button
                type="button"
                className={`theme-segment ${theme === "light" ? "active" : ""}`}
                onClick={() => theme !== "light" && onToggleTheme()}
              >
                ☀ Light
              </button>
              <button
                type="button"
                className={`theme-segment ${theme === "dark" ? "active" : ""}`}
                onClick={() => theme !== "dark" && onToggleTheme()}
              >
                ☾ Dark
              </button>
            </div>
          </div>

          {/* ====================================
              ACCOUNT
          ==================================== */}
          <div className="settings-section">
            <span className="settings-section-title">Account</span>

            <div className="settings-account-row">
              <div className="settings-account-avatar">{getUserInitial()}</div>
              <div className="settings-account-info">
                <span className="settings-account-name">
                  {user?.name || "User"}
                </span>
                <span className="settings-account-email">
                  {user?.email || ""}
                </span>
              </div>
            </div>
          </div>

          {/* ====================================
              DATA
          ==================================== */}
          <div className="settings-section">
            <span className="settings-section-title">Data</span>

            <button
              type="button"
              className="settings-danger-btn"
              onClick={handleClearAllChats}
              disabled={!chats || chats.length === 0}
            >
              Clear all conversations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;