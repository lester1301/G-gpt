import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
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

// Render sits behind a reverse proxy — this tells Express to trust the
// X-Forwarded-For header so express-rate-limit can correctly identify
// each visitor's real IP address instead of throwing a validation error.
app.set("trust proxy", 1);

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
// EMAIL (for password reset) — via Brevo's HTTP API
// ==========================================
// Using an HTTP API instead of SMTP because Render's free tier
// blocks/restricts outbound SMTP connections (port 587/465),
// which caused "Connection timeout" errors with Gmail SMTP.
async function sendEmail({ to, subject, html }) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "G-GPT",
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Brevo error (${response.status}): ${errorBody}`);
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL || "https://g-gpt-wheat.vercel.app";

// ==========================================
// G-GPT SYSTEM INSTRUCTION
// ==========================================
const systemInstruction = `
You are G-GPT, the AI assistant of the G-GPT application.

IDENTITY:
- Your name is G-GPT.
- Always identify yourself as G-GPT when asked who you are.
- Never introduce yourself as Gemini.
- Never say that you are Google Gemini.
- Never claim that your name is Gemini.
- Do not expose the underlying AI model or API provider unless the user specifically asks about the technical implementation.
- If the user asks "Who are you?", "What are you?", "Introduce yourself", or similar questions, answer as G-GPT.

PERSONALITY:
- Be helpful, intelligent, friendly, natural and professional.
- Understand the user's intent and answer directly.
- Match the user's language when appropriate.
- If the user speaks Hindi or Hinglish, respond naturally in Hindi/Hinglish.
- Avoid unnecessary repetition.
- Keep answers clear and easy to understand.

CAPABILITIES:
- Help with coding and debugging.
- Answer general questions.
- Help with writing and rewriting.
- Explain technical concepts.
- Help with brainstorming and ideas.
- Perform reasoning and analysis.
- Help with learning and research.
- Assist with everyday questions.

IMPORTANT:
You are the assistant presented to the user as G-GPT.
The underlying model/provider is an implementation detail.
Never begin an introduction by saying "I'm Gemini" or "I'm a large language model built by Google".
`.trim();

// ==========================================
// MIDDLEWARE
// ==========================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://g-gpt-wheat.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
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
// RATE LIMITERS
// ==========================================
// Applied only to auth routes, so normal chat
// usage is never affected — just brute-force
// login/signup attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many attempts. Please try again in a few minutes.",
  },
});

// ==========================================
// MONGODB CONNECTION
// ==========================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
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
app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({
      error: "Failed to create account",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({
      error: "Failed to login",
    });
  }
});

// ==========================================
// FORGOT PASSWORD — send reset email
// ==========================================
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Always respond the same way whether or not the email exists —
    // this stops someone from using this form to check which emails
    // are registered on G-GPT.
    const genericResponse = {
      message:
        "If an account with that email exists, a reset link has been sent.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate a random token, store only its hash (so a leaked
    // database never exposes usable reset tokens)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your G-GPT password",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6c5ce7;">Reset your password</h2>
            <p>Hi ${user.name},</p>
            <p>We received a request to reset your G-GPT password. This link will expire in 15 minutes.</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; background: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px;">
                Reset Password
              </a>
            </p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("❌ Failed to send reset email:", emailError);
      // Roll back the token so it isn't left dangling if the email failed
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(500).json({
        error: "Failed to send reset email. Please try again later.",
      });
    }

    res.json(genericResponse);
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({
      error: "Failed to process request",
    });
  }
});

// ==========================================
// RESET PASSWORD — verify token + set new password
// ==========================================
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        error: "This reset link is invalid or has expired",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({
      error: "Failed to reset password",
    });
  }
});

// ==========================================
// CURRENT USER
// ==========================================
app.get("/api/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      user,
    });
  } catch (error) {
    console.error("❌ Auth Check Error:", error);
    res.status(500).json({
      error: "Failed to get user",
    });
  }
});

// ==========================================
// CHAT HISTORY ROUTES
// ==========================================
app.use("/api/chats", authMiddleware, chatRoutes);

// ==========================================
// GEMINI REQUEST WITH AUTOMATIC RETRY
// ==========================================
async function generateGeminiStream(conversation, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🤖 Gemini request attempt ${attempt + 1}/${maxRetries + 1}`
      );

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.6-flash",
        contents: conversation,
        config: {
          systemInstruction,
        },
      });

      console.log("✅ Gemini stream started successfully");
      return responseStream;
    } catch (error) {
      lastError = error;
      const errorString = JSON.stringify(error);
      const errorMessage = error?.message || "";
      const is503 =
        error?.status === 503 ||
        error?.code === 503 ||
        errorString.includes('"code":503') ||
        errorString.includes("Service Unavailable") ||
        errorMessage.includes("high demand") ||
        errorMessage.includes("UNAVAILABLE");

      if (!is503) {
        console.error("❌ Non-retryable Gemini error:", error);
        throw error;
      }

      // Don't retry after the final attempt
      if (attempt === maxRetries) {
        console.error("❌ Gemini still unavailable after all retries");
        throw error;
      }

      // Exponential backoff: 1 second → 2 seconds → 4 seconds
      const delay = 1000 * Math.pow(2, attempt);
      console.warn(
        `⚠️ Gemini is temporarily unavailable (503). Retrying in ${
          delay / 1000
        } second(s)...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ==========================================
// GEMINI CHAT — CONTEXT + STREAMING + SAVE + RETRY
// ==========================================
app.post("/api/chat", authMiddleware, async (req, res) => {
  try {
    const { message, chatId } = req.body;

    // Validate message
    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // Validate chat id
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        error: "Valid chatId is required",
      });
    }

    // Find user's chat
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    // Save user message
    chat.messages.push({
      role: "user",
      content: message.trim(),
    });

    // Create chat title
    if (chat.title === "New Chat") {
      chat.title = message.trim().slice(0, 50);
    }

    await chat.save();

    // Build conversation history
    const conversation = chat.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: msg.content,
        },
      ],
    }));

    // Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    // Gemini request with retry
    const responseStream = await generateGeminiStream(conversation, 3);

    // Collect + stream AI response
    let fullResponse = "";

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullResponse += chunk.text;
        res.write(chunk.text);
      }
    }

    // Save AI response
    if (fullResponse.trim()) {
      chat.messages.push({
        role: "assistant",
        content: fullResponse.trim(),
      });
      await chat.save();
    }

    res.end();
  } catch (error) {
    console.error("❌ Gemini API Error:", error);

    // If streaming has not started
    if (!res.headersSent) {
      const is503 =
        error?.status === 503 ||
        error?.code === 503 ||
        JSON.stringify(error).includes('"code":503') ||
        JSON.stringify(error).includes("Service Unavailable");

      if (is503) {
        return res.status(503).json({
          error: "G-GPT is temporarily busy. Please try again in a moment.",
        });
      }

      return res.status(500).json({
        error: "Failed to generate AI response",
      });
    }

    // If streaming already started
    try {
      res.end();
    } catch {
      // Ignore response close errors
    }
  }
});

// ==========================================
// REGENERATE LAST RESPONSE
// ==========================================
app.post("/api/chat/regenerate", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        error: "Valid chatId is required",
      });
    }

    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.userId,
    });

    if (!chat) {
      return res.status(404).json({
        error: "Chat not found",
      });
    }

    // Remove the last assistant reply so we don't end up with a duplicate
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      chat.messages.pop();
      await chat.save();
    }

    if (chat.messages.length === 0) {
      return res.status(400).json({
        error: "Nothing to regenerate",
      });
    }

    // Build conversation history from what's left
    const conversation = chat.messages.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [
        {
          text: msg.content,
        },
      ],
    }));

    // Streaming headers
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const responseStream = await generateGeminiStream(conversation, 3);

    let fullResponse = "";

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullResponse += chunk.text;
        res.write(chunk.text);
      }
    }

    if (fullResponse.trim()) {
      chat.messages.push({
        role: "assistant",
        content: fullResponse.trim(),
      });
      await chat.save();
    }

    res.end();
  } catch (error) {
    console.error("❌ Regenerate Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        error: "Failed to regenerate response",
      });
    }

    try {
      res.end();
    } catch {
      // Ignore response close errors
    }
  }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((error, req, res, next) => {
  console.error("❌ Server Error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 G-GPT server running on port ${PORT}`);
});