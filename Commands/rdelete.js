const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rdelete')
    .setDescription('Delete a reaction role message configuration.')
    .addStringOption(o=>o.setName('messageid').setDescription('Message ID to delete').setRequired(true)),
  async execute({ interaction, database }){
    await interaction.deferReply({ ephemeral:true });
    const mid = interaction.options.getString('messageid');
    const data = database.read();
    const guild = data.guilds[interaction.guildId];
    if(!guild || !guild.messages[mid]) return interaction.editReply('Message not found.');
    delete guild.messages[mid];
    database.write(data);
    await interaction.editReply('Configuration removed.');
  }
};
