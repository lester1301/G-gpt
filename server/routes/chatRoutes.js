import express from "express";
import mongoose from "mongoose";
import Chat from "../models/Chat.js";

const router = express.Router();


// =====================================================
// GET ALL CHATS OF LOGGED-IN USER
// =====================================================

router.get("/", async (req, res) => {
  try {

    const userId = req.user.userId;


    const chats = await Chat.find({
      userId,
    })
      .sort({
        updatedAt: -1,
      })
      .select(
        "title createdAt updatedAt"
      );


    res.json({
      success: true,
      chats,
    });

  } catch (error) {

    console.error(
      "Get chats error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to load chats",
    });

  }
});


// =====================================================
// CREATE NEW CHAT
// =====================================================

router.post("/", async (req, res) => {
  try {

    const userId = req.user.userId;


    const chat = await Chat.create({

      userId,

      title:
        "New Chat",

      messages: [],

    });


    res.status(201).json({

      success: true,

      chat,

    });

  } catch (error) {

    console.error(
      "Create chat error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to create chat",

    });

  }
});


// =====================================================
// GET SINGLE CHAT
// =====================================================

router.get(
  "/:chatId",
  async (req, res) => {

    try {

      const {
        chatId,
      } = req.params;


      const userId =
        req.user.userId;


      if (
        !mongoose.Types.ObjectId.isValid(
          chatId
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid chat ID",

        });

      }


      const chat =
        await Chat.findOne({

          _id:
            chatId,

          userId,

        });


      if (!chat) {

        return res.status(404).json({

          success: false,

          message:
            "Chat not found",

        });

      }


      res.json({

        success: true,

        chat,

      });

    } catch (error) {

      console.error(
        "Get single chat error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to load chat",

      });

    }

  }
);


// =====================================================
// UPDATE CHAT TITLE
// =====================================================

router.patch("/:chatId/title", async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;

    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid chat ID",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    const chat = await Chat.findOneAndUpdate(
      {
        _id: chatId,
        userId,
      },
      {
        title: title.trim().slice(0, 50),
      },
      {
        new: true,
      }
    );

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    res.json({
      success: true,
      chat,
    });

  } catch (error) {
    console.error(
      "Update chat title error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update chat title",
    });
  }
});


// =====================================================
// DELETE CHAT
// =====================================================

router.delete(
  "/:chatId",
  async (req, res) => {

    try {

      const {
        chatId,
      } = req.params;


      const userId =
        req.user.userId;


      if (
        !mongoose.Types.ObjectId.isValid(
          chatId
        )
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid chat ID",

        });

      }


      const chat =
        await Chat.findOneAndDelete({

          _id:
            chatId,

          userId,

        });


      if (!chat) {

        return res.status(404).json({

          success: false,

          message:
            "Chat not found",

        });

      }


      res.json({

        success: true,

        message:
          "Chat deleted successfully",

      });

    } catch (error) {

      console.error(
        "Delete chat error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to delete chat",

      });

    }

  }
);


export default router;