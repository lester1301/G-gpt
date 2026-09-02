import mongoose from "mongoose";

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
  },
  {
    timestamps: true,
  }
);


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

      trim: true,
    },

    messages: {
      type: [messageSchema],

      default: [],
    },
  },
  {
    timestamps: true,
  }
);


const Chat = mongoose.model(
  "Chat",
  chatSchema
);


export default Chat;