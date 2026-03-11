const https = require('https');

const data = JSON.stringify({ site_id: "MPE" });

const options = {
    hostname: 'api.mercadopago.com',
    port: 443,
    path: '/users/test_user',
    method: 'POST',
    headers: {
        'Authorization': 'Bearer APP_USR-5891089090544378-030913-58d103a3c5c4fba6293c67e9496adda4-2923809833',
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, res => {
    let body = '';
    res.on('data', d => { body += d; });
    res.on('end', () => {
        console.log(body);
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
