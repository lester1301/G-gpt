import { useEffect, useRef, useState } from "react";

import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import ChatWindow from "./components/ChatWindow";
import MessageComposer from "./components/MessageComposer";
import MobileMenuButton from "./components/MobileMenuButton";
import EmptyChat from "./components/EmptyChat";

import Login from "./components/Login";
import Signup from "./components/Signup";

import "./App.css";

const API_URL = "http://localhost:5000";

function App() {

  // ==========================================
  // AUTH STATE
  // ==========================================

  const [user, setUser] = useState(null);

  const [authToken, setAuthToken] = useState(
    localStorage.getItem("g-gpt-token")
  );

  const [showSignup, setShowSignup] = useState(false);

  const [authChecking, setAuthChecking] = useState(true);


  // ==========================================
  // CHAT STATE
  // ==========================================

  const [messages, setMessages] = useState([]);

  const [chatId, setChatId] = useState(null);

  const [chats, setChats] = useState([]);

  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef(null);


  // ==========================================
  // MOBILE SIDEBAR STATE
  // ==========================================

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);


  // ==========================================
  // CHECK EXISTING LOGIN
  // ==========================================

  useEffect(() => {

    const checkAuthentication = async () => {

      const token =
        localStorage.getItem("g-gpt-token");


      if (!token) {

        setAuthChecking(false);

        return;
      }


      try {

        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


        if (!response.ok) {

          throw new Error(
            "Authentication expired"
          );

        }


        const data =
          await response.json();


        setUser(data.user);

        setAuthToken(token);


      } catch (error) {

        console.error(
          "Authentication check failed:",
          error
        );


        localStorage.removeItem(
          "g-gpt-token"
        );


        setUser(null);

        setAuthToken(null);


      } finally {

        setAuthChecking(false);

      }

    };


    checkAuthentication();

  }, []);


  // ==========================================
  // LOAD USER CHATS
  // ==========================================

  useEffect(() => {

    if (!user || !authToken) {
      return;
    }


    const loadChats = async () => {

      try {

        const response = await fetch(
          `${API_URL}/api/chats`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${authToken}`,
            },
          }
        );


        if (!response.ok) {

          throw new Error(
            "Failed to load chats"
          );

        }


        const data =
          await response.json();


        setChats(
          data.chats || []
        );


      } catch (error) {

        console.error(
          "Load chats error:",
          error
        );

      }

    };


    loadChats();

  }, [user, authToken]);


  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = (data) => {

    localStorage.setItem(
      "g-gpt-token",
      data.token
    );


    setAuthToken(data.token);

    setUser(data.user);

    setShowSignup(false);

    setMessages([]);

    setChatId(null);

    setMobileSidebarOpen(false);

  };


  // ==========================================
  // SIGNUP
  // ==========================================

  const handleSignup = () => {

    setShowSignup(false);

  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    if (abortControllerRef.current) {

      abortControllerRef.current.abort();

      abortControllerRef.current = null;

    }


    localStorage.removeItem(
      "g-gpt-token"
    );


    setAuthToken(null);

    setUser(null);

    setMessages([]);

    setChats([]);

    setChatId(null);

    setIsLoading(false);

    setShowSignup(false);

    setMobileSidebarOpen(false);

  };


  // ==========================================
  // CREATE NEW CHAT
  // ==========================================

  const handleNewChat = async () => {

    if (!authToken) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/api/chats`,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${authToken}`,

            "Content-Type":
              "application/json",
          },
        }
      );


      if (!response.ok) {

        throw new Error(
          "Failed to create new chat"
        );

      }


      const data =
        await response.json();


      const newChat =
        data.chat;


      setChatId(
        newChat._id
      );


      setMessages([]);


      setChats(
        (previousChats) => [
          newChat,
          ...previousChats,
        ]
      );


      // Close mobile sidebar
      setMobileSidebarOpen(false);


    } catch (error) {

      console.error(
        "New chat error:",
        error
      );

    }

  };


  // ==========================================
  // LOAD EXISTING CHAT
  // ==========================================

  const handleSelectChat = async (
    selectedChatId
  ) => {

    if (!authToken) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/api/chats/${selectedChatId}`,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${authToken}`,
          },
        }
      );


      if (!response.ok) {

        throw new Error(
          "Failed to load chat"
        );

      }


      const data =
        await response.json();


      const selectedChat =
        data.chat;


      setChatId(
        selectedChat._id
      );


      const formattedMessages =
        (selectedChat.messages || []).map(
          (message, index) => ({

            id:
              `${selectedChat._id}-${index}`,

            role:
              message.role,

            content:
              message.content,

          })
        );


      setMessages(
        formattedMessages
      );


      // Close mobile sidebar
      setMobileSidebarOpen(false);


    } catch (error) {

      console.error(
        "Select chat error:",
        error
      );

    }

  };


  // ==========================================
  // DELETE CHAT
  // ==========================================

  const handleDeleteChat = async (
    selectedChatId
  ) => {

    if (!authToken || !selectedChatId) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/api/chats/${selectedChatId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${authToken}`,
          },
        }
      );


      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(() => null);


        throw new Error(
          errorData?.message ||
          "Failed to delete chat"
        );

      }


      // Remove deleted chat
      setChats(
        (previousChats) =>
          previousChats.filter(
            (chat) =>
              chat._id !== selectedChatId
          )
      );


      // If current chat was deleted
      if (chatId === selectedChatId) {

        setChatId(null);

        setMessages([]);

      }


    } catch (error) {

      console.error(
        "Delete chat error:",
        error
      );

    }

  };


  // ==========================================
  // STOP GENERATING
  // ==========================================

  const handleStopGenerating = () => {

    if (abortControllerRef.current) {

      abortControllerRef.current.abort();

      abortControllerRef.current = null;

    }


    setIsLoading(false);

  };


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async (text) => {

    if (!authToken) {
      return;
    }


    // Prevent empty messages
    if (!text || !text.trim()) {
      return;
    }


    let currentChatId =
      chatId;


    // ----------------------------------------
    // CREATE ABORT CONTROLLER
    // ----------------------------------------

    const abortController =
      new AbortController();


    abortControllerRef.current =
      abortController;


    // ----------------------------------------
    // CREATE CHAT IF NEEDED
    // ----------------------------------------

    if (!currentChatId) {

      try {

        const createResponse =
          await fetch(
            `${API_URL}/api/chats`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${authToken}`,

                "Content-Type":
                  "application/json",
              },
            }
          );


        if (!createResponse.ok) {

          throw new Error(
            "Failed to create chat"
          );

        }


        const createData =
          await createResponse.json();


        currentChatId =
          createData.chat._id;


        setChatId(
          currentChatId
        );


        setChats(
          (previousChats) => [
            createData.chat,
            ...previousChats,
          ]
        );


      } catch (error) {

        console.error(
          "Create chat error:",
          error
        );


        abortControllerRef.current =
          null;


        return;

      }

    }


    // ----------------------------------------
    // USER MESSAGE
    // ----------------------------------------

    const userMessage = {

      id:
        `${Date.now()}-user`,

      role:
        "user",

      content:
        text,

    };


    setMessages(
      (previousMessages) => [
        ...previousMessages,
        userMessage,
      ]
    );


    setIsLoading(true);


    // ----------------------------------------
    // ASSISTANT MESSAGE
    // ----------------------------------------

    const assistantMessageId =
      `${Date.now()}-assistant`;


    const assistantMessage = {

      id:
        assistantMessageId,

      role:
        "assistant",

      content:
        "",

    };


    setMessages(
      (previousMessages) => [
        ...previousMessages,
        assistantMessage,
      ]
    );


    try {

      // --------------------------------------
      // SEND TO BACKEND
      // --------------------------------------

      const response =
        await fetch(
          `${API_URL}/api/chat`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${authToken}`,
            },

            body:
              JSON.stringify({
                message: text,
                chatId: currentChatId,
              }),

            signal:
              abortController.signal,
          }
        );


      if (!response.ok) {

        const errorData =
          await response
            .json()
            .catch(() => null);


        throw new Error(
          errorData?.error ||
          "Failed to connect to G-GPT server"
        );

      }


      if (!response.body) {

        throw new Error(
          "Streaming is not supported"
        );

      }


      // --------------------------------------
      // STREAM READER
      // --------------------------------------

      const reader =
        response.body.getReader();


      const decoder =
        new TextDecoder();


      let fullResponse = "";


      // --------------------------------------
      // READ STREAM
      // --------------------------------------

      while (true) {

        const {
          value,
          done,
        } = await reader.read();


        if (done) {
          break;
        }


        const chunk =
          decoder.decode(
            value,
            {
              stream: true,
            }
          );


        fullResponse +=
          chunk;


        // ------------------------------------
        // UPDATE ASSISTANT MESSAGE
        // ------------------------------------

        setMessages(
          (previousMessages) =>
            previousMessages.map(
              (message) =>
                message.id ===
                assistantMessageId
                  ? {
                      ...message,

                      content:
                        fullResponse,
                    }
                  : message
            )
        );

      }


      // --------------------------------------
      // UPDATE CHAT TITLE
      // --------------------------------------

      const currentChat =
        chats.find(
          (chat) =>
            chat._id === currentChatId
        );


      if (
        currentChat &&
        currentChat.title === "New Chat"
      ) {

        const newTitle =
          text
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 50);


        try {

          const titleResponse =
            await fetch(
              `${API_URL}/api/chats/${currentChatId}/title`,
              {
                method: "PATCH",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${authToken}`,
                },

                body:
                  JSON.stringify({
                    title: newTitle,
                  }),
              }
            );


          if (!titleResponse.ok) {

            throw new Error(
              "Failed to update chat title"
            );

          }


          const titleData =
            await titleResponse.json();


          // Update sidebar
          setChats(
            (previousChats) =>
              previousChats.map(
                (chat) =>
                  chat._id === currentChatId
                    ? titleData.chat
                    : chat
              )
          );


        } catch (error) {

          console.error(
            "Chat title update error:",
            error
          );

        }

      }


    } catch (error) {

      // ======================================
      // USER STOPPED GENERATION
      // ======================================

      if (
        error.name === "AbortError"
      ) {

        console.log(
          "G-GPT generation stopped by user."
        );

        return;

      }


      // ======================================
      // OTHER CHAT ERROR
      // ======================================

      console.error(
        "Chat Error:",
        error
      );


      setMessages(
        (previousMessages) =>
          previousMessages.map(
            (message) =>
              message.id ===
              assistantMessageId
                ? {
                    ...message,

                    content:
                      "Sorry, something went wrong. Please try again.",
                  }
                : message
          )
      );


    } finally {

      setIsLoading(false);

      abortControllerRef.current =
        null;

    }

  };


  // ==========================================
  // AUTH CHECK SCREEN
  // ==========================================

  if (authChecking) {

    return (
      <div className="auth-loading">

        <div className="auth-loading-logo">
          G
        </div>

        <p>
          Loading G-GPT...
        </p>

      </div>
    );

  }


  // ==========================================
  // LOGIN / SIGNUP
  // ==========================================

  if (!user) {

    if (showSignup) {

      return (
        <Signup
          onSignup={handleSignup}

          onShowLogin={() =>
            setShowSignup(false)
          }
        />
      );

    }


    return (
      <Login
        onLogin={handleLogin}

        onShowSignup={() =>
          setShowSignup(true)
        }
      />
    );

  }


  // ==========================================
  // MAIN G-GPT APPLICATION
  // ==========================================

  return (

    <div className="app">

      {/* ======================================
          MOBILE MENU BUTTON
      ====================================== */}

      <MobileMenuButton
        isOpen={mobileSidebarOpen}

        onClick={() =>
          setMobileSidebarOpen(
            (previous) => !previous
          )
        }
      />


      {/* ======================================
          MOBILE SIDEBAR BACKDROP
      ====================================== */}

      {mobileSidebarOpen && (

        <div
          className="mobile-sidebar-backdrop"

          onClick={() =>
            setMobileSidebarOpen(false)
          }
        />

      )}


      {/* ======================================
          SIDEBAR
      ====================================== */}

      <div
        className={`sidebar-wrapper ${
          mobileSidebarOpen
            ? "mobile-sidebar-open"
            : ""
        }`}
      >

        <Sidebar
          user={user}

          onLogout={handleLogout}

          chats={chats}

          activeChat={chatId}

          onNewChat={handleNewChat}

          onSelectChat={handleSelectChat}

          onDeleteChat={handleDeleteChat}
        />

      </div>


      {/* ======================================
          CHAT AREA
      ====================================== */}

      <main className="chat-area">

        <ChatHeader
          user={user}

          onLogout={handleLogout}
        />


        {/* ====================================
            EMPTY CHAT
        ==================================== */}

        {messages.length === 0 ? (

          <EmptyChat
            user={user}

            onPromptClick={
              handleSendMessage
            }

          />

        ) : (

          <ChatWindow
            messages={messages}

            isLoading={isLoading}
          />

        )}


        {/* ====================================
            MESSAGE COMPOSER
        ==================================== */}

        <MessageComposer
          onSendMessage={
            handleSendMessage
          }

          onStop={
            handleStopGenerating
          }

          disabled={
            isLoading
          }
        />

      </main>

    </div>

  );

}

export default App;