const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

// ================================
// 🔧 CLIENTE WHATSAPP (ESTABLE)
// ================================
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        protocolTimeout: 240000, // 🔥 evita timeout en Railway
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote'
        ]
    }
});

// ================================
// 📱 QR (solo si es necesario)
// ================================
client.on('qr', qr => {
    console.log('📱 Escanea este QR con tu WhatsApp');
    qrcode.generate(qr, { small: true });
});

// ================================
// ✅ BOT LISTO
// ================================
client.on('ready', async () => {
    console.log('✅ Bot conectado');

    const grupo = '120363300096178455@g.us';

    try {
        console.log('⏳ Cargando WhatsApp completamente...');

        // 🔥 CLAVE: fuerza carga real de WhatsApp Web
        await client.getChats();

        console.log('📤 Enviando mensaje inicial...');

        await client.sendMessage(grupo, '✅ Bot funcionando correctamente');

        console.log('📨 Mensaje inicial enviado');

    } catch (error) {
        console.error('❌ Error al enviar mensaje inicial:', error);
    }
});

// ================================
// ❌ DESCONEXIÓN
// ================================
client.on('disconnected', (reason) => {
    console.log('❌ Bot desconectado:', reason);
});

// ================================
// ❌ ERROR AUTENTICACIÓN
// ================================
client.on('auth_failure', msg => {
    console.error('❌ Fallo de autenticación:', msg);
});

// ================================
// ⚠️ ERRORES GLOBALES
// ================================
process.on('unhandledRejection', err => {
    console.error('❌ Error no manejado:', err);
});

process.on('uncaughtException', err => {
    console.error('❌ Excepción no capturada:', err);
});

// ================================
// 💰 FUNCIÓN DE PAGOS
// ================================
function verificarPagos() {
    try {
        const servicios = JSON.parse(fs.readFileSync('./servicios.json', 'utf8'));

        const hoy = new Date();
        const diaHoy = hoy.getDate();

        let mensaje = '🔔 *Recordatorio de pagos*\n\n';
        let hay = false;

        servicios.forEach(s => {
            let inicioAviso = s.dia - 5;

            if (diaHoy >= inicioAviso && diaHoy <= s.dia) {

                let faltan = s.dia - diaHoy;

                if (faltan === 0) {
                    mensaje += `🚨 ${s.nombre} → *HOY SE PAGA*\n`;
                } else {
                    mensaje += `• ${s.nombre} → faltan ${faltan} días\n`;
                }

                hay = true;
            }
        });

        if (hay) {
            const grupo = '120363300096178455@g.us';

            client.sendMessage(grupo, mensaje)
                .then(() => console.log('📢 Recordatorio enviado'))
                .catch(err => console.error('❌ Error enviando mensaje:', err));

        } else {
            console.log('ℹ️ No hay pagos hoy');
        }

    } catch (error) {
        console.error('❌ Error en verificarPagos:', error);
    }
}

// ================================
// ⏰ CRON (7:45 PM DIARIO)
// ================================
cron.schedule('45 19 * * *', () => {
    console.log('⏰ Ejecutando recordatorio...');
    verificarPagos();
});

// ================================
// 🚀 INICIAR BOT
// ================================
client.initialize();