import mongoose from "mongoose";

// ==========================================
// MESSAGE SCHEMA (embedded inside Chat)
// ==========================================
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },

    // ==========================================
    // ATTACHMENT (image / PDF / text file)
    // Optional — only present when the user attaches a file.
    // ==========================================
    attachment: {
      type: {
        name: String,
        mimeType: String,
        data: String, // base64-encoded file content
        extractedText: String,
      },
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ==========================================
// CHAT SCHEMA
// ==========================================
const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;