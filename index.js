const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

// CONFIGURACIÓN DEL CLIENTE (OPTIMIZADO PARA RAILWAY)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
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

    // Espera para asegurar que WhatsApp cargue bien
    setTimeout(async () => {
        try {
            await client.getChats(); // fuerza carga completa

            if (client.info) {
                await client.sendMessage(grupo, '✅ Bot funcionando correctamente');
                console.log('📨 Mensaje enviado correctamente');
            } else {
                console.log('⚠️ Cliente aún no listo');
            }

        } catch (error) {
            console.error('❌ Error al enviar mensaje inicial:', error);
        }
    }, 15000); // 15 segundos
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

        if (hay && client.info) {
            const grupo = '120363300096178455@g.us';
            client.sendMessage(grupo, mensaje);
            console.log('📢 Recordatorio enviado');
        } else {
            console.log('ℹ️ No hay pagos o cliente no listo');
        }

    } catch (error) {
        console.error('❌ Error en verificarPagos:', error);
    }
}

// CRON → todos los días a las 7:45 PM
cron.schedule('45 19 * * *', () => {
    console.log('⏰ Ejecutando recordatorio...');
    verificarPagos();
});

// INICIAR BOT
client.initialize();