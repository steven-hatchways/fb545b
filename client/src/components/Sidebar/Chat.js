import React, {useMemo} from 'react';
import { Box, Badge } from '@material-ui/core';
import { BadgeAvatar, ChatContent } from '../Sidebar';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: 8,
    height: 80,
    boxShadow: '0 2px 10px 0 rgba(88,133,196,0.05)',
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      cursor: 'grab',
    },
  },
  unread: {
    marginRight: 20
  }
}));

const Chat = ({ conversation, setActiveChat }) => {
  const classes = useStyles();
  const { otherUser, currentUser } = conversation;

  const handleClick = async (conversation) => {
    await setActiveChat(conversation.otherUser.username);
  };

  if(currentUser === undefined) {
    debugger;
  }

  const countUnreadMessages = useMemo(() => {
    return conversation.messages
      .filter(m => m.senderId !== currentUser.id)
      .filter(m => {
        if(currentUser?.lastReadMessage?.createdAt === undefined) {
           return true; // If we don't have a last read message, every message is unread
        }
        else if(m.createdAt > currentUser.lastReadMessage.createdAt) {
          return true;
        }
        else {
          return false;
        }
      })
      .length;
  }, [conversation.messages, currentUser.id, currentUser?.lastReadMessage?.createdAt]);

  return (
    <Box onClick={() => handleClick(conversation)} className={classes.root}>
      <BadgeAvatar
        photoUrl={otherUser.photoUrl}
        username={otherUser.username}
        online={otherUser.online}
        sidebar={true}
      />
      <ChatContent conversation={conversation} hasUnreadMessages={countUnreadMessages > 0} />
      <Badge
          badgeContent={countUnreadMessages}
          color="primary"
          className={classes.unread}
      />
    </Box>
  );
};

export default Chat;
