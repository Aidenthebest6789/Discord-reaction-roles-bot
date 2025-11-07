const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder().setName('rlist').setDescription('List reaction role messages for this server.'),
  async execute({ interaction, database }){
    const data = database.read();
    const guild = data.guilds[interaction.guildId];
    if(!guild || !guild.messages || Object.keys(guild.messages).length===0) return interaction.reply('No reaction role messages configured.');
    const lines = [];
    for(const [mid, map] of Object.entries(guild.messages)){
      lines.push(`Message ID: ${mid}`);
      for(const [emojiKey, roleId] of Object.entries(map)){
        lines.push(`  ${emojiKey} → ${roleId}`);
      }
    }
    await interaction.reply({ content: lines.join('\n'), ephemeral:true });
  }
};
