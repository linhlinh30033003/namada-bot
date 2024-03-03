const TelegramBot = require('node-telegram-bot-api');
const account = require('./account');
const governance = require('./governance');
const healthCheck = require('./health-check');
const validator = require('./validators');
require('dotenv').config()

const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});


bot.onText(/\/(start|menu)/i, (msg) => {
  const chatId = msg.chat.id;
  const menu = {
    reply_markup: {
      keyboard: [['Account'], ['Governance'], ['Health Check'], ['Validator']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  };
  
  bot.sendMessage(chatId, 'Welcome! Please choose an option:', menu);
});

account(bot);
governance(bot);
healthCheck(bot);
validator(bot);
