import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { order_id, items } = body;

        // MercadoPago requires an access token. Using a dummy token for now if not provided,
        // but the user will provide their real token in .env.local
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
        if (!accessToken) {
            console.warn("MERCADOPAGO_ACCESS_TOKEN is not set in environment variables");
            // We can return a mock success for testing locally if no token is provided, or better, return error.
            return NextResponse.json({ error: "Faltan credenciales de pago" }, { status: 500 });
        }

        const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
        const preference = new Preference(client);

        const mpItems = items.map((item: any) => ({
            id: String(item.product_id || "promo"),
            title: item.title,
            quantity: item.quantity,
            unit_price: Number(item.unit_price)
        }));

        const hostUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const preferencePayload: any = {
            items: mpItems,
            metadata: {
                order_id: order_id
            },
            back_urls: {
                success: `${hostUrl}/success/${order_id}?payment_status=success`,
                failure: `${hostUrl}/checkout?payment_status=failure`,
                pending: `${hostUrl}/success/${order_id}?payment_status=pending`
            }
        };

        // Mercado Pago solo permite auto_return hacia URLs seguras (https). 
        // Si estamos en localhost (http), no lo activamos, pero el usuario 
        // probará dando click al botón "Volver al sitio".
        if (hostUrl.startsWith("https://")) {
            preferencePayload.auto_return = "approved";
        }

        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(preferencePayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("MP API Error:", result);
            throw new Error(result.message || "Failed to create preference");
        }

        return NextResponse.json({ id: result.id, init_point: result.init_point });
    } catch (error: any) {
        console.error("Error creating Mercado Pago preference.");
        if (error.cause) {
            console.error(error.cause);
        } else {
            console.dir(error, { depth: null });
        }
        return NextResponse.json({ error: "Failed to create preference", details: error.message }, { status: 500 });
    }
}
