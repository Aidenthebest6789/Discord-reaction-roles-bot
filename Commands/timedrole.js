const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('timedrole')
    .setDescription('Assign a role to a user for a limited time (minutes).')
    .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(true))
    .addRoleOption(o=>o.setName('role').setDescription('Role to give').setRequired(true))
    .addIntegerOption(o=>o.setName('minutes').setDescription('Duration in minutes').setRequired(true)),
  async execute({ interaction, database, roleManager }){
    await interaction.deferReply({ ephemeral:true });
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const minutes = interaction.options.getInteger('minutes');
    const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
    if(!member) return interaction.editReply('Member not found.');
    try { await member.roles.add(role.id, 'Timed role assigned'); } catch(e){ console.error(e); }
    const expires = Date.now() + minutes * 60 * 1000;
    roleManager.addTimedRole(interaction.guildId, user.id, role.id, expires);
    await interaction.editReply('Timed role assigned.');
  }
};
