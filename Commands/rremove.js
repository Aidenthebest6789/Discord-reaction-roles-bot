const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rremove')
    .setDescription('Remove a mapping from a reaction message.')
    .addStringOption(o=>o.setName('messageid').setDescription('Message ID').setRequired(true))
    .addStringOption(o=>o.setName('emoji').setDescription('Emoji to remove').setRequired(true)),
  async execute({ interaction, database, roleManager }){
    await interaction.deferReply({ ephemeral:true });
    const mid = interaction.options.getString('messageid');
    const emojiRaw = interaction.options.getString('emoji');
    const parsed = roleManager.normalizeEmojiInput(emojiRaw);
    if(!parsed) return interaction.editReply('Invalid emoji input.');
    const data = database.read();
    const guild = data.guilds[interaction.guildId];
    if(!guild || !guild.messages[mid]) return interaction.editReply('Message not found.');
    delete guild.messages[mid][parsed.key];
    database.write(data);
    await interaction.editReply('Mapping removed.');
  }
};
