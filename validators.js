module.exports = (bot) => {
    bot.onText(/validator/i, (msg) => {
      const chatId = msg.chat.id;
      bot.sendMessage(chatId, 'You chose Validator.');
    });
  };