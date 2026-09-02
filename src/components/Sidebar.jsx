function Sidebar({
  user,
  onLogout,
  chats = [],
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}) {

  // ==========================================
  // USER AVATAR
  // ==========================================

  const getUserInitial = () => {

    if (!user?.name) {
      return "G";
    }

    return user.name
      .charAt(0)
      .toUpperCase();

  };


  // ==========================================
  // CHAT DATE GROUP
  // ==========================================

  const getChatDate = (chat) => {

    if (!chat?.createdAt) {
      return new Date();
    }

    return new Date(chat.createdAt);

  };


  const isToday = (date) => {

    const today = new Date();

    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );

  };


  const isYesterday = (date) => {

    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );

  };


  // ==========================================
  // GROUP CHATS
  // ==========================================

  const todayChats = chats.filter(
    (chat) =>
      isToday(
        getChatDate(chat)
      )
  );


  const yesterdayChats = chats.filter(
    (chat) =>
      isYesterday(
        getChatDate(chat)
      )
  );


  const olderChats = chats.filter(
    (chat) => {

      const date =
        getChatDate(chat);

      return (
        !isToday(date) &&
        !isYesterday(date)
      );

    }
  );


  // ==========================================
  // CHAT BUTTON
  // ==========================================

 const renderChat = (chat) => {
  const handleDelete = (event) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );

    if (!confirmed) {
      return;
    }

    onDeleteChat(chat._id);
  };

  return (
    <div
      key={chat._id}
      className={`history-chat-wrapper ${
        activeChat === chat._id
          ? "active"
          : ""
      }`}
    >

      <button
        type="button"
        className={`history-chat ${
          activeChat === chat._id
            ? "active"
            : ""
        }`}
        onClick={() =>
          onSelectChat(chat._id)
        }
      >

        <span className="history-chat-icon">
          💬
        </span>

        <span className="history-chat-title">
          {chat.title || "New Chat"}
        </span>

      </button>


      <button
        type="button"
        className="chat-delete-btn"
        onClick={handleDelete}
        title="Delete chat"
        aria-label={`Delete ${chat.title || "chat"}`}
      >
        ⋮
      </button>

    </div>
  );
};

  // ==========================================
  // EMPTY HISTORY
  // ==========================================

  const renderEmptyMessage = () => {

    return (

      <div className="history-empty">

        No previous chats

      </div>

    );

  };


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <aside className="sidebar">

      {/* ======================================
          SIDEBAR HEADER
      ====================================== */}

      <div className="sidebar-header">

        <div className="sidebar-logo">

          G-GPT

        </div>

      </div>


      {/* ======================================
          NEW CHAT
      ====================================== */}

      <div className="sidebar-new-chat">

        <button
          type="button"
          className="new-chat-btn"
          onClick={onNewChat}
        >

          <span className="new-chat-icon">
            +
          </span>

          <span>
            New Chat
          </span>

        </button>

      </div>


      {/* ======================================
          CHAT HISTORY
      ====================================== */}

      <div className="sidebar-history">


        {/* ====================================
            TODAY
        ==================================== */}

        <div className="history-section">

          <div className="history-title">

            Today

          </div>


          <div className="history-list">

            {todayChats.length > 0
              ? todayChats.map(
                  renderChat
                )
              : renderEmptyMessage()}

          </div>

        </div>


        {/* ====================================
            YESTERDAY
        ==================================== */}

        <div className="history-section">

          <div className="history-title">

            Yesterday

          </div>


          <div className="history-list">

            {yesterdayChats.length > 0
              ? yesterdayChats.map(
                  renderChat
                )
              : renderEmptyMessage()}

          </div>

        </div>


        {/* ====================================
            OLDER
        ==================================== */}

        {olderChats.length > 0 && (

          <div className="history-section">

            <div className="history-title">

              Older

            </div>


            <div className="history-list">

              {olderChats.map(
                renderChat
              )}

            </div>

          </div>

        )}

      </div>


      {/* ======================================
          SIDEBAR BOTTOM
      ====================================== */}

      <div className="sidebar-bottom">


        {/* ====================================
            SETTINGS
        ==================================== */}

        <button
          type="button"
          className="sidebar-bottom-btn"
        >

          <span className="sidebar-bottom-icon">
            ⚙
          </span>

          <span>
            Settings
          </span>

        </button>


        {/* ====================================
            HELP
        ==================================== */}

        <button
          type="button"
          className="sidebar-bottom-btn"
        >

          <span className="sidebar-bottom-icon">
            ?
          </span>

          <span>
            Help
          </span>

        </button>


        {/* ====================================
            USER
        ==================================== */}

        <div className="sidebar-user">

          <div className="sidebar-user-info">


            {/* Avatar */}

            <div className="sidebar-user-avatar">

              {getUserInitial()}

            </div>


            {/* User details */}

            <div className="sidebar-user-details">

              <div className="sidebar-user-name">

                {user?.name ||
                  "User"}

              </div>


              <div className="sidebar-user-email">

                {user?.email ||
                  ""}

              </div>

            </div>

          </div>


          {/* ==================================
              LOGOUT
          ================================== */}

          <button
            type="button"
            className="logout-btn"
            onClick={onLogout}
            title="Logout"
            aria-label="Logout"
          >

            ↪

          </button>

        </div>

      </div>

    </aside>

  );

}

export default Sidebar;