const Conversation = require("./conversation");
const User = require("./user");
const Message = require("./message");
const ConversationUser = require("./conversationUser");

// associations

Message.belongsTo(Conversation);
Conversation.hasMany(Message);

Conversation.belongsToMany(User, {
  through: ConversationUser,
  as: "users"
});

User.belongsToMany(Conversation, {
  through: ConversationUser,
  as: "conversations"
});

module.exports = {
  User,
  Conversation,
  Message,
  ConversationUser
};
