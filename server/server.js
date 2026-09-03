import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { GoogleGenAI } from "@google/genai";

import User from "./models/User.js";
import Chat from "./models/Chat.js";
import authMiddleware from "./middleware/auth.js";
import chatRoutes from "./routes/chatRoutes.js";

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

// ==========================================
// APP SETUP
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// ENVIRONMENT CHECK
// ==========================================

if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY is not configured");
}

if (!process.env.MONGODB_URI) {
  console.warn("⚠️ MONGODB_URI is not configured");
}

if (!process.env.JWT_SECRET) {
  console.warn("⚠️ JWT_SECRET is not configured");
}

// ==========================================
// GEMINI AI
// ==========================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Allow local development + production frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://g-gpt-wheat.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// MONGODB CONNECTION
// ==========================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection error:",
      error.message
    );
  });

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message: "G-GPT server is running",
  });
});

// ==========================================
// SIGNUP
// ==========================================

app.post(
  "/api/auth/signup",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body;

      // Validate input
      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Name, email and password are required",
        });
      }

      // Validate password
      if (password.length < 6) {
        return res.status(400).json({
          error:
            "Password must be at least 6 characters",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // Check existing user
      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          error:
            "Email already registered",
        });
      }

      // Hash password
      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      // Create user
      const user =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
        });

      res.status(201).json({
        message:
          "Account created successfully",

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "❌ Signup Error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to create account",
      });
    }
  }
);

// ==========================================
// LOGIN
// ==========================================

app.post(
  "/api/auth/login",
  async (req, res) => {
    try {
      const {
        email,
        password,
      } = req.body;

      // Validate input
      if (
        !email ||
        !password
      ) {
        return res.status(400).json({
          error:
            "Email and password are required",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      // Find user
      const user =
        await User.findOne({
          email: normalizedEmail,
        });

      if (!user) {
        return res.status(401).json({
          error:
            "Invalid email or password",
        });
      }

      // Compare password
      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          error:
            "Invalid email or password",
        });
      }

      // Create JWT
      const token = jwt.sign(
        {
          userId:
            user._id.toString(),

          email:
            user.email,
        },

        process.env.JWT_SECRET,

        {
          expiresIn: "7d",
        }
      );

      res.json({
        message:
          "Login successful",

        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "❌ Login Error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to login",
      });
    }
  }
);

// ==========================================
// CURRENT USER
// ==========================================

app.get(
  "/api/auth/me",
  authMiddleware,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.userId
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      res.json({
        user,
      });
    } catch (error) {
      console.error(
        "❌ Auth Check Error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to get user",
      });
    }
  }
);

// ==========================================
// CHAT HISTORY ROUTES
// ==========================================

app.use(
  "/api/chats",
  authMiddleware,
  chatRoutes
);

// ==========================================
// GEMINI CHAT
// CONTEXT + STREAMING + SAVE
// ==========================================

app.post(
  "/api/chat",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        message,
        chatId,
      } = req.body;

      // --------------------------------------
      // VALIDATE MESSAGE
      // --------------------------------------

      if (
        !message ||
        !message.trim()
      ) {
        return res.status(400).json({
          error:
            "Message is required",
        });
      }

      // --------------------------------------
      // VALIDATE CHAT ID
      // --------------------------------------

      if (
        !chatId ||
        !mongoose.Types.ObjectId.isValid(
          chatId
        )
      ) {
        return res.status(400).json({
          error:
            "Valid chatId is required",
        });
      }

      // --------------------------------------
      // FIND USER'S CHAT
      // --------------------------------------

      const chat =
        await Chat.findOne({
          _id: chatId,
          userId: req.user.userId,
        });

      if (!chat) {
        return res.status(404).json({
          error:
            "Chat not found",
        });
      }

      // --------------------------------------
      // SAVE USER MESSAGE
      // --------------------------------------

      chat.messages.push({
        role: "user",
        content: message.trim(),
      });

      // --------------------------------------
      // CREATE CHAT TITLE
      // --------------------------------------

      if (
        chat.title === "New Chat"
      ) {
        chat.title =
          message
            .trim()
            .slice(0, 50);
      }

      await chat.save();

      // --------------------------------------
      // BUILD CONVERSATION HISTORY
      // --------------------------------------

      const conversation =
        chat.messages.map(
          (msg) => ({
            role:
              msg.role === "assistant"
                ? "model"
                : "user",

            parts: [
              {
                text:
                  msg.content,
              },
            ],
          })
        );

      // --------------------------------------
      // STREAMING HEADERS
      // --------------------------------------

      res.setHeader(
        "Content-Type",
        "text/plain; charset=utf-8"
      );

      res.setHeader(
        "Cache-Control",
        "no-cache, no-transform"
      );

      res.setHeader(
        "Connection",
        "keep-alive"
      );

      // Helps some proxies flush streaming data
      res.setHeader(
        "X-Accel-Buffering",
        "no"
      );

      // --------------------------------------
      // GEMINI REQUEST
      // --------------------------------------

      const responseStream =
        await ai.models.generateContentStream(
          {
            model:
              "gemini-3.6-flash",

            contents:
              conversation,
          }
        );

      // --------------------------------------
      // COLLECT AI RESPONSE
      // --------------------------------------

      let fullResponse = "";

      // --------------------------------------
      // STREAM AI RESPONSE
      // --------------------------------------

      for await (
        const chunk
        of responseStream
      ) {
        if (chunk.text) {
          fullResponse +=
            chunk.text;

          res.write(
            chunk.text
          );
        }
      }

      // --------------------------------------
      // SAVE AI RESPONSE
      // --------------------------------------

      if (
        fullResponse.trim()
      ) {
        chat.messages.push({
          role:
            "assistant",

          content:
            fullResponse.trim(),
        });
      }

      await chat.save();

      // --------------------------------------
      // END STREAM
      // --------------------------------------

      res.end();
    } catch (error) {
      console.error(
        "❌ Gemini API Error:",
        error
      );

      // If headers haven't been sent,
      // return a normal JSON error.
      if (!res.headersSent) {
        return res.status(500).json({
          error:
            "Failed to generate AI response",
        });
      }

      // If streaming already started,
      // close the response.
      res.end();
    }
  }
);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "❌ Server Error:",
      error.message
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      error:
        "Internal server error",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `🚀 G-GPT server running on port ${PORT}`
    );
  }
);