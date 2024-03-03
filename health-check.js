
const axios = require('axios');

let subscribers = new Set();
let latestBlockTime;
module.exports = (bot) => {
  bot.onText(/health check/i, (msg) => {
    const chatId = msg.chat.id;
    const submenu = {
      reply_markup: {
        keyboard: [["Subscribe"], ["Unsubscribe"]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };

    bot.sendMessage(chatId, "Choose an option:", submenu);
  });

  bot.onText(/subscribe/i, (msg) => {
    const chatId = msg.chat.id;
    subscribers.add(chatId);
  });

  bot.onText(/unsubscribe/i, (msg) => {
    const chatId = msg.chat.id;
    subscribers.delete(chatId);
    bot.sendMessage(
      chatId,
      "You have unsubscribed from the health check notifications."
    );
  });
  
  setInterval(async () => {
    try {
      const response = await axios.get(process.env.RPC);
  
      if (response.status === 200) {
        const newBlockTime = new Date(
          response.data.result.sync_info.latest_block_time
        );
  
        let message= 'Checking the status of the blockchain network.';
        if (latestBlockTime === undefined) {
          message = "You have successfully subscribed to the health check notifications.";
        } else if (newBlockTime.getTime() === latestBlockTime.getTime()) {
          message = "The blockchain network is halted.";
        } else {
          message = "The blockchain network is running normally.";
        }
  
        for (let chatId of subscribers) {
          bot.sendMessage(chatId, message);
        }
  
        latestBlockTime = newBlockTime;
      } else {
        for (let chatId of subscribers) {
          bot.sendMessage(
            chatId,
            "Failed to check the status of the blockchain network."
          );
        }
      }
    } catch (error) {
      console.error(error);
      for (let chatId of subscribers) {
        bot.sendMessage(
          chatId,
          "An error occurred while checking the status of the blockchain network."
        );
      }
    }
  }, 30000);
};


