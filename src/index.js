const { Client, GatewayIntentBits, Events, ActivityType } = require('discord.js');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,  
        GatewayIntentBits.MessageContent,
    ],
});

const TOKEN = 'my token';

// ==========================================
// 2. SETUP DISCORD PLAYER
// ==========================================
const player = new Player(client);

// ==========================================
// 3. EVENT: BOT MENYALA (READY)
// ==========================================
client.once(Events.ClientReady, async (readyClient) => {
    // Memuat semua senjata extractor (YouTube, Spotify, SoundCloud, dll)
    await player.extractors.loadMulti(DefaultExtractors);
    
    console.log(`Mantap bosku! Bot ${readyClient.user.tag} sudah online dan siap eksekusi!`);
    
    // Set status Discord ala Bahlil
    readyClient.user.setActivity('Jaga Pos Voice 🛡️', { type: ActivityType.Custom });
});

client.on(Events.MessageCreate, async (message) => {
    // Abaikan pesan dari sesama bot
    if (message.author.bot) return;

    // Pastikan pakai awalan yang benar
    const prefix = 'bahlil!';
    if (!message.content.startsWith(prefix)) return;

    // Pecah perintah dan argumennya
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const voiceChannel = message.member?.voice?.channel;

    // --- COMMAND: HELP ---
    if (command === 'help') {
        const helpText = `
**📋 Daftar Perintah Menteri Urusan Voice Channel:**
\`bahlil!join\` - Panggil saya buat nongkrong dan jaga pos 24/7.
\`bahlil!leave\` - Usir saya dari Voice Channel biar bisa pulang kampung.
\`bahlil!play <lagu/link>\` - Eksekusi lagu dari YouTube/Spotify.
\`bahlil!stop\` - Matikan musik, tapi saya tetap *standby* jaga pos.
\`bahlil!skip\` - Ganti barang ini sama lagu selanjutnya di antrean.
\`bahlil!pause\` - Rem dulu musiknya, istirahat bentar bos.
\`bahlil!resume\` - Gaspol lanjut putar musik yang tadi di-pause.
\`bahlil!queue\` - Cek daftar antrean investasi (lagu) kita.
        `;
        return message.reply(helpText);
    }

    // Syarat Mutlak: Bosku harus ada di Voice Channel dulu!
    const voiceCommands = ['join', 'leave', 'play', 'stop', 'skip', 'pause', 'resume', 'queue'];
    if (voiceCommands.includes(command) && !voiceChannel) {
        return message.reply('Loh bosku, masuk dulu lah ke Voice Channel. Masa saya suruh eksekusi sendirian di luar? Nggak masuk akal itu! 🤣');
    }

    // --- COMMAND: JOIN (Masuk 24/7 Tanpa Lagu) ---
    if (command === 'join') {
        // Bikin antrean dengan setelan kebal badai (anti-pulang)
        const queue = player.nodes.create(message.guild, {
            metadata: message,
            leaveOnEnd: false,   
            leaveOnEmpty: false, 
            leaveOnStop: false  
        });

        try {
            if (!queue.connection) {
                await queue.connect(voiceChannel);
            }
            return message.reply(`Siap bosku! Saya sudah amankan posisi di **${voiceChannel.name}**. Tinggal nunggu perintah eksekusi aja ini! 🫡`);
        } catch (error) {
            console.error(error);
            queue.delete();
            return message.reply('Waduh bos, ada kendala teknis ini. Pintu channel-nya digembok ya? Gagal masuk saya!');
        }
    }

    // --- COMMAND: LEAVE (Pulang Kampung) ---
    if (command === 'leave') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue) {
            return message.reply('Loh, saya kan memang lagi nggak di Voice Channel mana-mana bosku. Udah di rumah ini.');
        }
        
        queue.delete(); // Menghancurkan koneksi dan antrean
        return message.reply('Siap laksanakan! Pos jaga saya tinggalkan, saya pamit pulang dulu bosku. Panggil aja lagi kalau butuh! 👋');
    }

    // --- COMMAND: PLAY (Putar Lagu) ---
    if (command === 'play') {
        const query = args.join(' ');
        if (!query) {
            return message.reply('Eh bos, judul lagunya mana? Masa saya suruh tebak-tebakan? Kasih tau dong barangnya apa! (Contoh: \`bahlil!play koplo\`)');
        }

        const reply = await message.reply(`🔍 Sabar bosku, kita cari dulu barang ini: **${query}**... Jangan buru-buru, semua ada prosesnya!`);

        try {
            const { track } = await player.play(voiceChannel, query, {
                nodeOptions: { 
                    metadata: message,
                    leaveOnEnd: false,   // Kunci biar tetap lembur
                    leaveOnEmpty: false,
                    leaveOnStop: false
                }
            });
            reply.edit(`🎶 Mantap bosku! Kita eksekusi langsung lagu **${track.title}**. Tarik mang! 🕺`);
        } catch (error) {
            console.error(error);
            reply.edit('Waduh bos, barangnya macet ini. Nggak bisa diputar. Coba cari judul atau link lain dulu, jangan kasih kendor!');
        }
    }

    // --- COMMAND: STOP (Berhenti Nyanyi, Tetap Jaga Pos) ---
    if (command === 'stop') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) {
            return message.reply('Eh bosku, ini aja kita lagi nggak putar apa-apa. Mau distop apanya coba? Hahaha, ada-ada aja!');
        }
        
        queue.tracks.clear(); // Bersihkan antrean
        queue.node.stop();    // Hentikan lagu
        
        message.reply('Siap laksanakan! Musik sudah kita babat habis, tapi saya tetap *standby* jaga pos di sini ya bosku. Tinggal gas \`bahlil!play\` lagi! 🫡');
    }

    // --- COMMAND: SKIP (Lewati Lagu) ---
    if (command === 'skip') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) {
            return message.reply('Gimana mau di-skip bos? Barangnya aja nggak ada yang lagi muter. Hahaha!');
        }
        queue.node.skip();
        message.reply('Oke bosku, lagu ini kurang nendang ya? Kita skip, langsung eksekusi barang baru yang lebih mantap! ⏭️');
    }

    // --- COMMAND: PAUSE (Jeda Lagu) ---
    if (command === 'pause') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) {
            return message.reply('Apanya yang mau di-pause bos? Ini udah sunyi senyap daritadi.');
        }
        queue.node.setPaused(true);
        message.reply('Siap bos! Kita rem dulu barang ini. Istirahat bentar, jangan digas terus nanti mesinnya panas! ⏸️');
    }

    // --- COMMAND: RESUME (Lanjut Putar) ---
    if (command === 'resume') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue) {
            return message.reply('Antreannya kosong bosku, nggak ada yang bisa dilanjutin.');
        }
        queue.node.setPaused(false);
        message.reply('Lanjut bosku! Waktu istirahat habis, kita gaspol lagi eksekusi lagunya! ▶️');
    }

    // --- COMMAND: QUEUE (Cek Antrean) ---
    if (command === 'queue') {
        const queue = player.nodes.get(message.guild.id);
        if (!queue || !queue.isPlaying()) {
            return message.reply('Belum ada lagu yang masuk ini. Ayo bosku, masukin dong barangnya pakai command \`bahlil!play\`!');
        }

        const currentTrack = queue.currentTrack;
        const tracks = queue.tracks.toArray();

        let queueString = `**Lagi Dieksekusi:** ${currentTrack.title}\n\n**Daftar Antrean Investasi Kita:**\n`;
        
        if (tracks.length === 0) {
            queueString += 'Kosong bosku! Ayo tambah lagi lagunya biar rame.';
        } else {
            const trackList = tracks.slice(0, 5).map((track, i) => `${i + 1}. ${track.title}`);
            queueString += trackList.join('\n');
            if (tracks.length > 5) {
                queueString += `\n...dan ${tracks.length - 5} barang lainnya antre di belakang.`;
            }
        }

        message.reply(`Nih bosku laporannya!\n\n${queueString}`);
    }
});

// ==========================================
// 5. LOGIN BOT
// ==========================================
client.login(TOKEN);