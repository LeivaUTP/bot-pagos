const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth()
});

// Mostrar QR
client.on('qr', qr => {
    console.log('📱 Escanea este QR con tu WhatsApp');
    qrcode.generate(qr, { small: true });
});

// Cuando esté listo
client.on('ready', async () => {
    console.log('✅ Bot conectado');

    const grupo = '120363300096178455@g.us';
    await client.sendMessage(grupo, '✅ Bot funcionando correctamente');
});;

// FUNCIÓN PRINCIPAL
function verificarPagos() {
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
    }
}

// Ejecutar todos los días a las 9am
cron.schedule('45 19 * * *', () => {
    console.log('⏰ Revisando pagos...');
    verificarPagos();
});

client.initialize();