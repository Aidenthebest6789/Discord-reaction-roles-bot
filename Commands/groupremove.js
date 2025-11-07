const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('groupremove')
    .setDescription('Remove role from a group.')
    .addStringOption(o=>o.setName('name').setDescription('Group name').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role to remove').setRequired(true)),
  async execute({ interaction, database }){
    await interaction.deferReply({ ephemeral:true });
    const name = interaction.options.getString('name');
    const role = interaction.options.getRole('role');
    const data = database.read();
    if(!data.guilds[interaction.guildId] || !data.guilds[interaction.guildId].groups[name]) return interaction.editReply('Group not found.');
    const guild = data.guilds[interaction.guildId];
    guild.groups[name] = guild.groups[name].filter(r=>r!==role.id);
    database.write(data);
    await interaction.editReply('Role removed from group.');
  }
};
