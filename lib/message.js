import { __dirname } from './utils.js';
import fs from 'fs';
import { join } from 'path';
import { commands, menu } from './plugins.js';
import { prefix, botName, messageLoading } from './config.js';
import process from 'process';
import 'readline';

const usePremium = process.argv.includes("--use-premium");
const groupOnly = process.argv.includes("--group-only");

let answerData = [];

const dataUser = {
  'admin': JSON.parse(fs.readFileSync(join(__dirname, "../permissions/admin.json"))),
  'premium': JSON.parse(fs.readFileSync(join(__dirname, '../permissions/premium.json')))
};

const promote = {
  'read': async userId => {
    const isAdmin = dataUser?.["admin"]?.["data"]?.["find"](member => member === userId) || false;
    const isPremium = dataUser?.['premium']?.["data"]?.["find"](member => member === userId) || false;
    if (isAdmin !== false) {
      return {
        'exist': true,
        'id': isAdmin,
        'status': "admin"
      };
    } else {
      return isPremium !== false ? {
        'exist': true,
        'id': isPremium,
        'status': 'premium'
      } : {
        'exist': false,
        'id': userId,
        'status': "normal"
      };
    }
  },
  'create': async (type, userId) => {
    if (type === 'premium') {
      dataUser?.["premium"]?.['data']?.["push"](userId);
      const premiumJSON = JSON.stringify(dataUser?.['premium'], undefined, 2);
      fs.writeFileSync(join(__dirname, "../permissions/premium.json"), premiumJSON, "utf8");
      return 'ok';
    } else {
      if (type === "admin") {
        dataUser?.["admin"]?.["data"]?.["push"](userId);
        const adminJSON = JSON.stringify(dataUser?.["admin"], undefined, 2);
        fs.writeFileSync(join(__dirname, '../permissions/admin.json'), adminJSON, "utf8");
        return 'ok';
      } else {
        return "Error adding user";
      }
    }
  },
  'delete': async (type, userId) => {
    if (type === "premium") {
      const newPremiumJSON = {
        'data': dataUser?.["premium"]?.['data']?.["filter"](member => member !== userId)
      };
      fs.writeFileSync(join(__dirname, '../permissions/premium.json'), JSON.stringify(newPremiumJSON, undefined, 2), 'utf8');
      return 'ok';
    } else {
      if (type === "admin") {
        const newAdminJSON = {
          'data': dataUser?.["admin"]?.["data"]?.["filter"](member => member !== userId)
        };
        fs.writeFileSync(join(__dirname, "../permissions/admin.json"), JSON.stringify(newAdminJSON, undefined, 2), "utf8");
        return 'ok';
      } else {
        return "Error deleteing user";
      }
    }
  }
};

export default (async (conn, msg, dbNya) => {
  for (const m of msg.messages) {
    m.reply = async (chats, text) => {
      const replyMessage = await conn.sendMessage(chats, {
        'text': text
      }, {
        'quoted': m
      });
      return replyMessage;
    };
    await conn.readMessages([m?.['key']]);
    let msgData = {
      'id': m?.["key"]?.["remoteJid"],
      'personalId': m?.['key']?.['remoteJid']["endsWith"]("@g.us") ? m?.["key"]?.["participant"] : m?.["key"]?.["remoteJid"],
      'username': m?.["pushName"],
      'text': m?.["message"]?.["conversation"] || (m?.["message"]?.["videoMessage"] || m?.["message"]?.["imageMessage"])?.["caption"] || m?.["message"]?.["extendedTextMessage"]?.["text"]
    };
    const cmd = {
      'args': msgData?.["text"]?.["split"](" ")?.["slice"](1),
      'commandName': msgData?.["text"]?.["split"](" ")?.['slice'](0, 1)[0]?.["slice"](1),
      'messagePrefix': msgData?.["text"]?.["slice"](0, 1),
      'phoneNumber': msgData?.["personalId"]?.["split"]('@')[0],
      'groupId': !msgData?.['id']?.["endsWith"]("@s.whatsapp.net") ? msgData?.['id']?.['split']('@')[0] : "not found",
      'thisGroup': !msgData?.['id']?.['endsWith']("@s.whatsapp.net")
    };
    const replyData = {
      'remoteJid': msgData?.['id'],
      'id': m?.["message"]?.["extendedTextMessage"]?.['contextInfo']?.["stanzaId"] || "not found",
      'fromMe': false,
      'participant': m?.["message"]?.["extendedTextMessage"]?.["contextInfo"]?.["participant"] || "not found"
    };
    const Data = {
      'id': msgData?.['id'],
      'personalId': msgData?.["personalId"],
      'commandName': cmd?.["commandName"],
      'args': cmd?.["args"],
      'msgPrefix': cmd?.["messagePrefix"],
      'globalPrefix': prefix,
      'phoneNumber': cmd?.["phoneNumber"],
      'user': msgData?.["username"],
      'reply': replyData,
      'media': m.message?.["imageMessage"] || m.message?.['videoMessage'] || m.message?.['audioMessage'],
      'group': {
        'status': cmd?.["thisGroup"],
        'id': cmd?.["groupId"]
      },
      'adminControl': {
        'promote': promote,
        'dataUser': dataUser
      },
      'storage': dbNya
    };
    const {
      id: userId,
      status: userStatus
    } = await promote.read(msgData?.["personalId"]);
    if (prefix === cmd?.["messagePrefix"]) {
      await conn.sendMessage(msgData?.['id'], {
        'react': {
          'text': '📖',
          'key': m?.["key"]
        }
      });
      if (/^(menu)$/i.test(cmd?.['commandName'])) {
        const menuData = await menu(msgData?.["username"]);
        const menuJSON = {
          'text': menuData,
          'contextInfo': {
            'externalAdReply': {
              'title': botName,
              'thumbnail': fs.readFileSync(join(__dirname, '../src/menu.jpg')),
              'mediaType': 1,
              'renderLargerThumbnail': true
            }
          }
        };
        await conn.sendMessage(msgData?.['id'], menuJSON, {
          'quoted': m
        });
      }
      for (const command of commands) {
        if (command.cmd.test(cmd?.["commandName"])) {
          console.log("Command " + cmd?.['commandName'] + " summoning, from data\n", {
            'argument': cmd?.['args'],
            'commandName': cmd?.["commandName"],
            'callingForUser': msgData?.["username"]
          });
          let loadingMsg = "Loading";
          const loadingMsgEdit = await conn.sendMessage(msgData?.['id'], {
            'text': loadingMsg
          });
          const loadingMsgData = setInterval(async () => {
            loadingMsg += '.';
            if (loadingMsg.endsWith("....")) {
              loadingMsg = "Loading";
            }
            console.log(loadingMsg);
            await conn.sendMessage(msgData?.['id'], {
              'text': loadingMsg,
              'edit': loadingMsgEdit.key
            });
          }, 1000);
          if (/^(info)$/i.test(cmd?.['args'][0])) {
            await m?.["reply"](msgData?.['id'], command?.["desc"]);
          } else {
            if (groupOnly && cmd?.["thisGroup"] !== true) {
              await m.reply(msgData?.['id'], "Your use private chat, this bot use group only, please use command in group");
            } else {
              if (usePremium && command['public'] && userStatus === 'normal') {
                try {
                  const cmdAnswer = await command(conn, Data, m);
                  if (cmdAnswer?.["mode"] === "quest") {
                    answerData.push(cmdAnswer);
                  }
                } catch (err) {
                  await m.reply(msgData?.['id'], "Error message: " + err);
                }
              } else {
                if (!usePremium && !command.admin) {
                  try {
                    const cmdAnswer = await command(conn, Data, m);
                    if (cmdAnswer?.["mode"] === 'quest') {
                      answerData.push(cmdAnswer);
                    }
                  } catch (err) {
                    await m.reply(msgData?.['id'], "Error message: " + err);
                  }
                } else {
                  if (usePremium && userStatus !== "premium" && usePremium && userStatus !== 'admin') {
                    await m.reply(msgData?.['id'], "You are not premium user, please register with the admin to become a premium user.");
                  } else {
                    if (command.admin && userStatus !== 'admin') {
                      await m.reply(msgData?.['id'], "your not admin, this command for admin");
                    } else {
                      if (userStatus === "admin" && command.admin) {
                        try {
                          const cmdAnswer = await command(conn, Data, m);
                          if (cmdAnswer?.["mode"] === "quest") {
                            answerData.push(cmdAnswer);
                          }
                        } catch (err) {
                          await m.reply(msgData?.['id'], "Error message: " + err);
                        }
                      } else {
                        if (userStatus === "admin") {
                          try {
                            const cmdAnswer = await command(conn, Data, m);
                            if (cmdAnswer?.["mode"] === "quest") {
                              answerData.push(cmdAnswer);
                            }
                          } catch (err) {
                            await m.reply(msgData?.['id'], "Error message: " + err);
                          }
                        } else {
                          if (userStatus === 'premium' && usePremium) {
                            try {
                              const cmdAnswer = await command(conn, Data, m);
                              if (cmdAnswer?.["mode"] === 'quest') {
                                answerData.push(cmdAnswer);
                              }
                            } catch (err) {
                              await m.reply(msgData?.['id'], "Error message: " + err);
                            }
                          } else {
                            if (!usePremium && userStatus === "normal") {
                              try {
                                const cmdAnswer = await command(conn, Data, m);
                                if (cmdAnswer?.["mode"] === "quest") {
                                  answerData.push(cmdAnswer);
                                }
                              } catch (err) {
                                await m.reply(msgData?.['id'], "Error message: " + err);
                              }
                            } else {
                              await m.reply(msgData?.['id'], "User no matched from data permissions");
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          clearInterval(loadingMsgData);
        } else {
          if (command.answerCommand?.["test"](cmd?.['commandName'])) {
            let loadings = "Loading";
            const loadingsTimer = setInterval(async () => {
              loadings += '.';
              if (loadings.endsWith("....")) {
                loadings = 'Loading';
              }
              console.log(messageLoading);
              if (messageLoading == true) {
                console.log(loadings);
                await m.reply(msgData?.['id'], loadings);
              }
            }, 1000);
            const ans = await command.answer(answerData, conn, Data, m);
            if (ans === 'ok') {
              answerData.splice(0, answerData.length);
            }
            clearInterval(loadingsTimer);
          }
        }
      }
      await conn.sendMessage(msgData?.['id'], {
        'react': {
          'text': '✅',
          'key': m?.['key']
        }
      });
    }
    console.log("replying to", m?.['key']?.["remoteJid"], "\nType " + msg.type + "\nMessage from " + msgData.username + " \n " + msgData?.["text"] + "\n");
  }
});