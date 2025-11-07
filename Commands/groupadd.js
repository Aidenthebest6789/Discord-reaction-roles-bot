const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('groupadd')
    .setDescription('Add role(s) to a group.')
    .addStringOption(o=>o.setName('name').setDescription('Group name').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role to add').setRequired(true)),
  async execute({ interaction, database }){
    await interaction.deferReply({ ephemeral:true });
    const name = interaction.options.getString('name');
    const role = interaction.options.getRole('role');
    const data = database.read();
    if(!data.guilds[interaction.guildId] || !data.guilds[interaction.guildId].groups[name]) return interaction.editReply('Group not found.');
    const guild = data.guilds[interaction.guildId];
    if(!guild.groups[name].includes(role.id)) guild.groups[name].push(role.id);
    database.write(data);
    await interaction.editReply('Role added to group.');
  }
};
