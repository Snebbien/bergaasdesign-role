export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).send("Only POST allowed");
        }

        const { discordId, accessToken, email } = req.body || {};

        if (!discordId) {
            return res.status(400).send("Missing Discord ID");
        }

        if (!email) {
            return res.status(400).send("Missing email");
        }

        //----------------------------------
        // ROLE MAP
        //----------------------------------

        const roleMap = {
            "59": "1301273196267442260",
            "88": "1484113519833120849",
            "89": "1445199206456229929",
            "90": "1300087659670274079",
            "117": "1483125343182393465"
        };

        //----------------------------------
        // FETCH ORDERS (FIXED QUERY)
        //----------------------------------

        let wcRes;
        try {
            wcRes = await fetch(
                `https://bergaasdesign.no/wp-json/wc/v3/orders?search=${encodeURIComponent(email)}`,
                {
                    headers: {
                        Authorization:
                            "Basic " +
                            Buffer.from(
                                process.env.WC_KEY + ":" + process.env.WC_SECRET
                            ).toString("base64")
                    }
                }
            );
        } catch (err) {
            return res.status(500).send("WooCommerce fetch crashed:\n" + err.message);
        }

        const wcText = await wcRes.text();
        console.log("WC RAW:", wcText);

        let orders;
        try {
            orders = JSON.parse(wcText);
        } catch {
            return res.status(500).send("Invalid WooCommerce response:\n" + wcText);
        }

        if (!wcRes.ok) {
            return res.status(500).send("WooCommerce error:\n" + wcText);
        }

        //----------------------------------
        // EXTRACT PRODUCTS
        //----------------------------------

        const productIds = [];

        for (const order of orders) {
            for (const item of order.line_items || []) {
                productIds.push(String(item.product_id));
            }
        }

        if (productIds.length === 0) {
            return res.status(400).send("No purchases found for this email");
        }

        //----------------------------------
        // JOIN SERVER
        //----------------------------------

        await fetch(
            `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    access_token: accessToken
                })
            }
        );

        //----------------------------------
        // ASSIGN ROLES
        //----------------------------------

        for (const productId of productIds) {
            const roleId = roleMap[productId];
            if (!roleId) continue;

            await fetch(
                `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`,
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bot ${process.env.BOT_TOKEN}`
                    }
                }
            );
        }

        //----------------------------------
        // SUCCESS
        //----------------------------------

        return res.status(200).send("SECURE ROLE SYNC COMPLETE");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("SERVER CRASH:\n" + err.message);
    }
}
