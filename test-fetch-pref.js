const fetch = require('node-fetch');

async function checkPref() {
    const token = 'APP_USR-5891089090544378-030913-58d103a3c5c4fba6293c67e9496adda4-2923809833';

    // Create pref with google url
    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            items: [{ title: 'test', quantity: 1, unit_price: 10 }],
            back_urls: {
                success: "https://localhost:3000/success",
                failure: "https://localhost:3000/failure",
                pending: "https://localhost:3000/pending"
            },
            // auto_return: "approved"
        })
    });
    const created = await prefRes.json();
    console.log("CREATED ID:", created.id);

    // Fetch it back
    const res = await fetch(`https://api.mercadopago.com/checkout/preferences/${created.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log(JSON.stringify({
        back_urls: data.back_urls,
        auto_return: data.auto_return
    }, null, 2));
}

checkPref();
