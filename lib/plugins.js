import fs from 'fs';
import { frontText, __dirname, time, getUptime } from './utils.js';
import { join } from 'path';
import { prefix, botName } from './config.js';

const uptime = await getUptime();
const pluginsPath = join(__dirname, "../plugins");

async function getPlugins() {
  const pluginFiles = fs.readdirSync(pluginsPath).filter(plugin => plugin.endsWith(".js"));
  const plugins = [];

  for (const pluginFile of pluginFiles) {
    const plugin = await import(join(pluginsPath, pluginFile));
    plugins.push(plugin["default"]);
  }

  return plugins;
}

const plugins = await getPlugins();
const commandNames = plugins.flatMap(({ cmd }) => {
  const command = cmd?.toString()?.slice(0x3)?.slice(0x0, -0x4)?.split('|') || [];
  return command;
});

console.log(`This bot has ${plugins.length} plugins`);

async function listByCategory() {
  const plugins = await getPlugins();
  const categories = Array.from(new Set(plugins.map(p => p.category.toLowerCase()))).sort();
  const categoryData = categories.map(category => ({
    category: category.toLowerCase(),
    data: plugins.filter(p => p.category.toLowerCase() === category)
  }));
  
  return categoryData;
}

async function listedData() {
  const categoryData = await listByCategory();
  const listedCommands = [];

  for (const category of categoryData) {
    const commands = category.data.map(plugin => {
      const args = plugin.args !== undefined && plugin.args !== null ? plugin.args : '';
      const command = plugin.cmd?.toString()?.slice(0x3)?.slice(0x0, -0x4)?.split('|') || [];
      const commandString = command.map(c => `\n> ${prefix}${c} ${args}`);
      return commandString.join('');
    }).join('');

    const listedCategory = `    »»${frontText(category.category)}${commands}\n\n`;
    listedCommands.push(listedCategory);
  }

  return listedCommands.join('');
}

async function menu(username) {
  const currentTime = time.format("MMMM DD, YYYY HH:mm:ss");
  const botStats = {
    "Bot Name": botName,
    "Uptime": uptime,
    "Total Commands": plugins.length,
    "Current Time": currentTime 
  };

  const botStatsString = Object.keys(botStats).map(key => `${key}: ${botStats[key]}`).join('\n');
  const listedDataString = await listedData();
  const menuString = `Konnichiwa ${username}\n\n${botStatsString}\n\nUse 'info' to view information or description of the command. \nExample: \n${prefix}menu info\n\n}------Command List-------{\n${listedDataString}`;

  return menuString;
}

export { menu, plugins as commands, commandNames };
