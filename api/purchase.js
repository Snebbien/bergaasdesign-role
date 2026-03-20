export default async function handler(req, res) {
    const { discordId } = req.body;

    if (!discordId) {
        return res.status(400).send("Missing Discord ID");
    }

    try {
        //----------------------------------
        // 🔥 GET USER FROM YOUR DATABASE
        //----------------------------------

        // ⚠️ YOU MUST STORE THIS YOURSELF
        // Example:
        const user = await getUserByDiscordId(discordId);

        if (!user) {
            return res.status(404).send("User not linked");
        }

        //----------------------------------
        // Get WooCommerce orders
        //----------------------------------

        const wcResponse = await fetch(
            `${process.env.WC_API_URL}/orders?customer=${user.wp_user_id}&consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}`
        );

        const orders = await wcResponse.json();

        //----------------------------------
        // Role map
        //----------------------------------

        const roleMap = {
            "59": "1301273196267442260",
            "88": "1484113519833120849",
            "89": "1445199206456229929",
            "90": "1300087659670274079",
            "117": "1483125343182393465"
        };

        //----------------------------------
        // Assign roles
        //----------------------------------

        for (const order of orders) {
            for (const item of order.line_items) {

                const roleId = roleMap[String(item.product_id)];
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
        }

        return res.status(200).send("Roles updated");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}
