const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('radd')
    .setDescription('Add a role mapping to an existing reaction message.')
    .addStringOption(o=>o.setName('messageid').setDescription('Message ID').setRequired(true))
    .addStringOption(o=>o.setName('mapping').setDescription('emoji:roleId').setRequired(true)),
  async execute({ interaction, database, roleManager }){
    await interaction.deferReply({ ephemeral:true });
    const mid = interaction.options.getString('messageid');
    const mapping = interaction.options.getString('mapping');
    const [emojiRaw, roleRef] = mapping.split(':').map(s=>s && s.trim());
    if(!emojiRaw || !roleRef) return interaction.editReply('Invalid mapping.');
    const roleId = roleRef.replace(/<@&/g,'').replace(/>/g,'');
    const parsed = roleManager.normalizeEmojiInput(emojiRaw);
    if(!parsed) return interaction.editReply('Invalid emoji provided.');
    const data = database.read();
    const guild = data.guilds[interaction.guildId];
    if(!guild || !guild.messages[mid]) return interaction.editReply('Message not found in config.');
    guild.messages[mid][parsed.key] = roleId;
    database.write(data);
    // try to add reaction to message (best effort)
    try{
      const msg = await interaction.channel.messages.fetch(mid).catch(()=>null);
      if(msg && parsed.key.startsWith('u:')){
        await msg.react(parsed.raw).catch(()=>{});
      }
    }catch(e){}
    await interaction.editReply('Mapping added.');
  }
};
