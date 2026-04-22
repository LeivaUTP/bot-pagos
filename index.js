const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

// CONFIGURACIÓN DEL CLIENTE (para Railway)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// MOSTRAR QR
client.on('qr', qr => {
    console.log('📱 Escanea este QR con tu WhatsApp');
    qrcode.generate(qr, { small: true });
});

// CUANDO EL BOT ESTÁ LISTO
client.on('ready', async () => {
    console.log('✅ Bot conectado');

    const grupo = '120363300096178455@g.us';

    // ⏳ Esperar 10 segundos para evitar errores de Chromium
    await new Promise(resolve => setTimeout(resolve, 10000));

    try {
        await client.sendMessage(grupo, '✅ Bot funcionando correctamente');
        console.log('📨 Mensaje enviado correctamente');
    } catch (error) {
        console.error('❌ Error al enviar mensaje inicial:', error);
    }
});

// DETECTAR DESCONEXIÓN
client.on('disconnected', (reason) => {
    console.log('❌ Bot desconectado:', reason);
});

// MANEJO DE ERRORES GLOBALES
process.on('unhandledRejection', err => {
    console.error('❌ Error no manejado:', err);
});

process.on('uncaughtException', err => {
    console.error('❌ Excepción no capturada:', err);
});

// FUNCIÓN PRINCIPAL DE PAGOS
function verificarPagos() {
    try {
        const servicios = JSON.parse(fs.readFileSync('./servicios.json'));
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
            client.sendMessage(grupo, mensaje);
            console.log('📢 Recordatorio enviado');
        }

    } catch (error) {
        console.error('❌ Error en verificarPagos:', error);
    }
}

// CRON → todos los días a las 7:45 PM
cron.schedule('45 19 * * *', () => {
    console.log('⏰ Revisando pagos...');
    verificarPagos();
});

// INICIAR BOT
client.initialize();