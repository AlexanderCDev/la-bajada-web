const fetch = require('node-fetch');

async function test() {
    try {
        const response = await fetch("http://localhost:3000/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                order_id: "ord-123",
                items: [{ product_id: "p1", title: "Test", quantity: 1, unit_price: 10 }]
            })
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
