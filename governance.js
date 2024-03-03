const {getCurrentEpoch} = require('./util');

module.exports = (bot) => {
  let proposalsData = {};
  let notifications = new Set();

  let user_ids = new Set();
  bot.onText(/governance/i, (msg) => {
    const chatId = msg.chat.id;

    const submenu = {
      reply_markup: {
        keyboard: [
          ["List Proposals"],
          ["Query Proposal"], ["Query Proposal Result"],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    };
    user_ids.add(msg.from.id);
    bot.sendMessage(chatId, "Choose an option:", submenu);
  });

  bot.onText(/List Proposals/i, async (msg) => {
    let proposals = Object.assign({}, proposalsData);
    let currentEpoch;
    try {
      currentEpoch = await getCurrentEpoch();
    } catch (e) {
      console.error(`Failed to get current epoch: ${e}`);
      bot.sendMessage(msg.chat.id, "Failed to get current epoch");
      return;
    }

    let props = [];
    for (let id in proposals) {
      let proposal = proposals[id];
      let start = parseInt(proposal["Start Epoch"]);
      let end = parseInt(proposal["End Epoch"]);
      if (start <= currentEpoch && currentEpoch <= end) {
        let title = proposal["Content"].get("title");
        props.push(`#${id} (ends on start of epoch ${end + 1}): ${title}\n\n`);
      }
    }

    let messages = [];
    if (props.length > 0) {
      let propsText = `Current epoch: ${currentEpoch}; Active proposals:\n\n`;
      for (let prop of props) {
        if (propsText.length + prop.length > 4090) {
          messages.push(propsText);
          propsText = prop;
        } else {
          propsText += prop;
        }
      }
      messages.push(propsText);
    } else {
      messages.push(
        `There are no active proposals in the current (${currentEpoch}) epoch`
      );
    }

    for (let msg of messages) {
      bot.sendMessage(msg.chat.id, msg);
    }
  });

  async function check_new_proposals() {
    let current_epoch = await get_current_epoch();
    let latest = Math.max(...Array.from(proposalsData.keys()));
    let new_proposals = await query_proposals(latest);

    for (let prop of new_proposals) {
      let id = parseInt(prop["Proposal Id"]);
      if (!(id in proposalsData)) {
        proposalsData[id] = prop;
      }
    }

    let messages = [];
    let current_message = "";
    for (let id in proposalsData) {
      let proposal = proposalsData[id];
      let start = parseInt(proposal["Start Epoch"]);
      if (notifications.has(id) || start !== current_epoch) {
        continue;
      }

      console.log(`sending notifications for prop #${id}`);
      notifications.add(id);

      let notification_text = format_notification(proposal);
      if (current_message.length + notification_text.length > 4090) {
        messages.push(current_message);
        current_message = notification_text;
      } else {
        current_message += `${notification_text}\n\n`;
      }
    }

    if (messages.length > 0 || current_message !== "") {
      messages.push(current_message);
      for (let user_id of user_ids) {
        for (let message of messages) {
          bot.sendMessage(user_id, message);
        }
      }
    }
  }

  setInterval(check_new_proposals, 60000);
};
