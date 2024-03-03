module.exports = (bot) => {
    bot.onText(/account/i, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'You chose Account.');
    });
  };