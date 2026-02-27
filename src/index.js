const { Client, GatewayIntentBits, Events } = require('discord.js');

const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,  
        GatewayIntentBits.MessageContent,
    ],
});

// PASTIKAN TOKEN ANDA SUDAH DI-RESET DAN MASUKKAN YANG BARU DI SINI
const TOKEN = 'mytoken';

client.once(Events.ClientReady, (readyClient) => {
    console.log(`Bot ${readyClient.user.tag} sudah online!`);
    console.log(`Silakan masuk ke Voice Channel di Discord dan ketik !join di chat.`);
});

client.on(Events.MessageCreate, (message) => {
    if (message.author.bot) return;

    // Command: !join
    if (message.content === 'bahlil!join') {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply('Kamu harus masuk ke Voice Channel dulu sebelum memanggilku!');
        }

        joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
            selfDeaf: false, 
            selfMute: true 
        });
        
        message.reply(`Siap bos! Aku sudah masuk ke **${voiceChannel.name}** 🫡`);
    }

    // Command: !leave
    if (message.content === 'bahli!leave') {
        // Karena getVoiceConnection sudah diimpor di atas, baris ini tidak akan error lagi
        const connection = getVoiceConnection(message.guild.id);
        
        if (connection) {
            connection.destroy();
            message.reply('Aku pamit dulu dari Voice Channel! 👋');
        } else {
            message.reply('Aku kan tidak sedang berada di Voice Channel mana-pun.');
        }
    }
});

client.login(TOKEN);