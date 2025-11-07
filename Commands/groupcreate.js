const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('groupcreate')
    .setDescription('Create a role group name where users may only pick one role.')
    .addStringOption(o=>o.setName('name').setDescription('Group name').setRequired(true)),
  async execute({ interaction, database }){
    await interaction.deferReply({ ephemeral:true });
    const name = interaction.options.getString('name');
    const data = database.read();
    if(!data.guilds[interaction.guildId]) data.guilds[interaction.guildId] = { messages:{}, groups:{}, timedRoles:[], autoroles:[] };
    const guild = data.guilds[interaction.guildId];
    if(guild.groups[name]) return interaction.editReply('Group already exists.');
    guild.groups[name] = [];
    database.write(data);
    await interaction.editReply('Group created.');
  }
};
