export default async function handler(req, res) {
    try {
        const { discordId, email } = req.body;

        if (!discordId || !email) {
            return res.status(400).send("Missing data");
        }

        //----------------------------------
        // 🔥 YOUR PRODUCT → ROLE MAP
        //----------------------------------

        const roleMap = {
            "59": "1301273196267442260",
            "88": "1484113519833120849",
            "89": "1445199206456229929",
            "90": "1300087659670274079",
            "117": "1483125343182393465"
        };

        //----------------------------------
        // 🔥 GET ORDERS FROM WOOCOMMERCE
        //----------------------------------

        const response = await fetch(
            `https://www.bergaasdesign.no/wp-json/wc/v3/orders?customer_email=${email}`,
            {
                headers: {
                    Authorization: "Basic " + Buffer.from(
                        process.env.WC_KEY + ":" + process.env.WC_SECRET
                    ).toString("base64")
                }
            }
        );

        const orders = await response.json();

        //----------------------------------
        // 🔥 COLLECT PRODUCT IDS
        //----------------------------------

        const purchasedProducts = new Set();

        for (const order of orders) {
            for (const item of order.line_items) {
                purchasedProducts.add(String(item.product_id));
            }
        }

        //----------------------------------
        // 🔥 GIVE ROLES
        //----------------------------------

        for (const productId of purchasedProducts) {
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

        return res.status(200).send("Roles assigned");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}
