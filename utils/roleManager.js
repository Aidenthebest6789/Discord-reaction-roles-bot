const database = require('./database');
const CUSTOM_EMOJI_REGEX = /^<a?:([\w\d_~]+):(\d+)>$/;

// Normalize incoming emoji input (from user commands) to a stable key used in storage
function normalizeEmojiInput(raw){
  if(!raw || typeof raw !== 'string') return null;
  raw = raw.trim();
  // match custom emoji like <:name:123> or <a:name:123>
  const m = raw.match(CUSTOM_EMOJI_REGEX);
  if(m){
    const name = m[1];
    const id = m[2];
    console.log(`Parsed custom emoji input: ${name} (ID: ${id})`);
    return { key: `id:${id}`, raw: raw };
  }
  // otherwise treat as unicode emoji (or emoji shortcode). Store the raw string
  console.log(`Parsed unicode emoji input: ${raw}`);
  return { key: `u:${raw}`, raw: raw };
}

// Get emoji key from a ReactionEmoji object (reaction.emoji)
function getEmojiKeyFromReaction(emoji){
  if(!emoji) return null;
  // custom emoji (has id)
  if(emoji.id){
    // use numeric id prefixed to avoid confusion with unicode
    return `id:${emoji.id}`;
  }
  // unicode emoji: name holds the character(s)
  return `u:${emoji.name}`;
}

function getGuildData(guildId){
  const data = database.read();
  if(!data.guilds[guildId]) data.guilds[guildId] = { messages: {}, groups: {}, timedRoles: [], autoroles: [] };
  return data;
}

async function handleReaction(reaction, user, action){
  if(reaction.partial){
    try{ await reaction.fetch(); }catch{return;}
  }
  const msg = reaction.message;
  if(!msg || !msg.guild) return;
  const data = getGuildData(msg.guild.id);
  const guildInfo = data.guilds[msg.guild.id];
  const cfg = guildInfo.messages[msg.id];
  if(!cfg) return;
  const emojiKey = getEmojiKeyFromReaction(reaction.emoji);
  if(!emojiKey) return;
  const roleId = cfg[emojiKey];
  if(!roleId) return;
  const member = await msg.guild.members.fetch(user.id).catch(()=>null);
  if(!member) return;
  if(action === 'add'){
    // group enforcement
    const groups = guildInfo.groups || {};
    for(const [gname, roles] of Object.entries(groups)){
      if(roles.includes(roleId)){
        for(const r of roles){
          if(r !== roleId && member.roles.cache.has(r)){
            try{ await member.roles.remove(r, 'Reaction group enforcement'); }catch(e){ console.error(e); }
          }
        }
      }
    }
    try{ await member.roles.add(roleId, 'Reaction role assigned'); }catch(e){ console.error(e); }
  } else {
    try{ await member.roles.remove(roleId, 'Reaction role removed'); }catch(e){ console.error(e); }
  }
  database.write(data);
}

async function handleAutoRole(member){
  const data = database.read();
  const guildInfo = data.guilds[member.guild.id];
  if(!guildInfo || !guildInfo.autoroles) return;
  for(const rid of guildInfo.autoroles){
    try{ await member.roles.add(rid, 'Autorole'); }catch(e){ console.error(e); }
  }
}

function addTimedRole(guildId, userId, roleId, expiresAt){
  const data = database.read();
  const g = getGuildData(guildId).guilds[guildId];
  g.timedRoles = g.timedRoles || [];
  g.timedRoles.push({ userId, roleId, expiresAt });
  database.write(data);
}

function removeExpired(client){
  const now = Date.now();
  const data = database.read();
  let changed = false;
  for(const [gid, gdata] of Object.entries(data.guilds)){
    const pending = gdata.timedRoles || [];
    const remaining = [];
    for(const tr of pending){
      if(tr.expiresAt <= now){
        const guild = client.guilds.cache.get(gid);
        if(guild){
          guild.members.fetch(tr.userId).then(member => {
            if(member && member.roles.cache.has(tr.roleId)){
              member.roles.remove(tr.roleId, 'Timed role expired').catch(()=>{});
            }
          }).catch(()=>{});
        }
        changed = true;
      } else remaining.push(tr);
    }
    gdata.timedRoles = remaining;
  }
  if(changed) database.write(data);
}

function startCleanupTask(client){
  setInterval(()=> removeExpired(client), 60 * 1000);
}

module.exports = { normalizeEmojiInput, getEmojiKeyFromReaction, handleReaction, handleAutoRole, addTimedRole, getGuildData, startCleanupTask };
