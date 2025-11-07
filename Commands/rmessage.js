const { SlashCommandBuilder } = require('discord.js');
module.exports = {
  data: new SlashCommandBuilder()
    .setName('rmessage')
    .setDescription('Create a reaction-role message.')
    .addChannelOption(o => o.setName('channel').setDescription('Channel to send message').setRequired(true))
    .addStringOption(o => o.setName('mappings').setDescription('Mappings as emoji:roleId or emoji:@role (comma separated)').setRequired(true)),
  async execute({ client, interaction, database, roleManager }){
    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.options.getChannel('channel');
    const mappings = interaction.options.getString('mappings');
    const pairs = mappings.split(',').map(s => s.trim()).filter(Boolean);
    const mapObj = {};
    for(const p of pairs){
      const [emojiRaw, roleRef] = p.split(':').map(x=>x && x.trim());
      if(!emojiRaw || !roleRef) continue;
      const roleId = roleRef.replace(/<@&/g,'').replace(/>/g,'').trim();
      const parsed = roleManager.normalizeEmojiInput(emojiRaw);
      if(!parsed) continue;
      console.log(`rmessage parsed: ${emojiRaw} -> ${parsed.key}`);
      mapObj[parsed.key] = roleId;
    }
    if(Object.keys(mapObj).length === 0) return interaction.editReply('No valid mappings provided.');
    const sent = await channel.send({ content: 'React below to get roles' });
    for(const eKey of Object.keys(mapObj)){
      try{
        if(eKey.startsWith('id:')){
          // react with custom emoji by id won't work without name; best-effort: skip reacting
        } else if(eKey.startsWith('u:')){
          const emoji = eKey.slice(2);
          await sent.react(emoji).catch(()=>{});
        }
      }catch(e){}
    }
    const data = database.read();
    if(!data.guilds[interaction.guildId]) data.guilds[interaction.guildId] = { messages:{}, groups:{}, timedRoles:[], autoroles:[] };
    data.guilds[interaction.guildId].messages[sent.id] = mapObj;
    database.write(data);
    await interaction.editReply('Reaction role message created. Save the message ID if you need to edit it later.');
  }
};
