const router = require("express").Router();
const { User, Conversation, Message } = require("../../db/models");
const { Op } = require("sequelize");
const onlineUsers = require("../../onlineUsers");

// get all conversations for a user, include latest message text for preview, and all messages
// include other user model so we have info on username/profile pic (don't include current user info)
router.get("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const userId = req.user.id;
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: {
          user1Id: userId,
          user2Id: userId,
        },
      },
      attributes: ["id"],
      order: [[Message, "createdAt", "DESC"]],
      include: [
        { model: Message, order: ["createdAt", "DESC"] },
        {
          model: User,
          as: "user1",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: User,
          as: "user2",
          where: {
            id: {
              [Op.not]: userId,
            },
          },
          attributes: ["id", "username", "photoUrl"],
          required: false,
        },
        {
          model: Message,
          as: "user1LastReadMessage",
          attributes: ["id"]
        },
        {
          model: Message,
          as: "user2LastReadMessage",
          attributes: ["id"]
        }
      ],
    });

    for (let i = 0; i < conversations.length; i++) {
      const convo = conversations[i];
      const convoJSON = convo.toJSON();

      // set a property "otherUser" and "currentUser" so that frontend will have easier access
      if (convoJSON.user1) {
        convoJSON.otherUser = convoJSON.user1;
        delete convoJSON.user1;

        convoJSON.otherUser.lastReadMessage = convoJSON.user1LastReadMessage;

        convoJSON.currentUser = {
          id: req.user.id,
          lastReadMessage: convoJSON.user2LastReadMessage
        };

      } else if (convoJSON.user2) {
        convoJSON.otherUser = convoJSON.user2;
        delete convoJSON.user2;

        convoJSON.otherUser.lastReadMessage = convoJSON.user2LastReadMessage;

        convoJSON.currentUser = {
          id: req.user.id,
          lastReadMessage: convoJSON.user1LastReadMessage
        };
      }

      delete convoJSON.user1LastReadMessage;
      delete convoJSON.user2LastReadMessage;

      // set property for online status of the other user
      if (onlineUsers.includes(convoJSON.otherUser.id)) {
        convoJSON.otherUser.online = true;
      } else {
        convoJSON.otherUser.online = false;
      }

      // set properties for notification count and latest message preview
      convoJSON.latestMessageText = convoJSON.messages[0].text;
      conversations[i] = convoJSON;
    }

    res.json(conversations);
  } catch (error) {
    next(error);
  }
});

router.post("/saveLastReadMessage",async (req, res, next) => {
  try {
    const conversationId = req.body.conversationId;
    const messageId = req.body.messageId;
    const userId = req.user.id;

    const conversationPromise = Conversation.findOne({
      where: { id: conversationId }
    });

    const messagePromise = Message.findOne({
      where: { id: messageId }
    });

    const [conversation, message] = await Promise.all(conversationPromise, messagePromise);

    if(conversation.user1Id === userId) {
      conversation.user1LastReadMessageId = message.id;
    }
    else if (conversation.user2Id === userId) {
      conversation.user2LastReadMessageId = message.id;
    }

    await conversation.save();

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
