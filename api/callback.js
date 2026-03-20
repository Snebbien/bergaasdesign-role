export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get("code");

    if (!code) {
        return res.status(400).send("No code provided");
    }

    try {
        //----------------------------------
        // Exchange code for token
        //----------------------------------

        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.REDIRECT_URI
        });

        const tokenResponse = await fetch(
            "https://discord.com/api/oauth2/token",
            {
                method: "POST",
                body: params,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        const tokenData = await tokenResponse.json();

        //----------------------------------
        // Get Discord user (WITH EMAIL)
        //----------------------------------

        const userResponse = await fetch(
            "https://discord.com/api/users/@me",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            }
        );

        const userData = await userResponse.json();

        const discordId = userData.id;
        const email = userData.email;

        if (!email) {
            return res.status(400).send("No email from Discord");
        }

        //----------------------------------
        // WooCommerce API: Get orders by email
        //----------------------------------

        const wcResponse = await fetch(
            `${process.env.WC_API_URL}/orders?consumer_key=${process.env.WC_KEY}&consumer_secret=${process.env.WC_SECRET}&billing_email=${email}`
        );

        const orders = await wcResponse.json();

        //----------------------------------
        // Collect purchased product IDs
        //----------------------------------

        let productIds = [];

        for (const order of orders) {
            for (const item of order.line_items) {
                productIds.push(String(item.product_id));
            }
        }

        //----------------------------------
        // Map product → role
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
        // Redirect back with success
        //----------------------------------

        return res.writeHead(302, {
            Location: `${process.env.SUCCESS_REDIRECT}?success=true`
        }).end();

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}
