const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Set or clear autorole(s) for new members. Use "clear" action to remove all.')
    .addStringOption(o=>o.setName('action').setDescription('add or clear').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role to add')),
  async execute({ interaction, database }){
    await interaction.deferReply({ ephemeral:true });
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    const data = database.read();
    if(!data.guilds[interaction.guildId]) data.guilds[interaction.guildId] = { messages:{}, groups:{}, timedRoles:[], autoroles:[] };
    const guild = data.guilds[interaction.guildId];
    if(action === 'clear'){
      guild.autoroles = [];
      database.write(data);
      return interaction.editReply('Autoroles cleared.');
    } else {
      if(!role) return interaction.editReply('Provide a role to add.');
      guild.autoroles = guild.autoroles || [];
      if(!guild.autoroles.includes(role.id)) guild.autoroles.push(role.id);
      database.write(data);
      return interaction.editReply('Autorole added.');
    }
  }
};
