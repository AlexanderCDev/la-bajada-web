const { MercadoPagoConfig, Preference } = require('mercadopago');
const client = new MercadoPagoConfig({ accessToken: 'APP_USR-5891089090544378-030913-58d103a3c5c4fba6293c67e9496adda4-2923809833' });
const preference = new Preference(client);

async function testSDK() {
    try {
        const result = await preference.create({
            body: {
                items: [{ id: "p1", title: "Test", quantity: 1, unit_price: 10 }],
                back_urls: {
                    success: "http://localhost:3000/success/123",
                    failure: "http://localhost:3000/failure",
                    pending: "http://localhost:3000/pending"
                },
                auto_return: "approved"
            }
        });
        console.log("SUCCESS!", result.id);
    } catch (e) {
        console.error("FAILED back_urls snake_case:", e.message, e.cause);
    }

    try {
        const result = await preference.create({
            body: {
                items: [{ id: "p1", title: "Test", quantity: 1, unit_price: 10 }],
                backUrls: {
                    success: "https://www.google.com/success",
                    failure: "https://www.google.com/failure",
                    pending: "https://www.google.com/pending"
                },
                autoReturn: "approved"
            }
        });
        console.log("SUCCESS!", result.id);
    } catch (e) {
        console.error("FAILED back_urls camelCase:", e.message, e.cause);
    }
}
testSDK();
