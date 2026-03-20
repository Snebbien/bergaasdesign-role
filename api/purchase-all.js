export default async function handler(req, res) {
    try {
        const { discordId, productId, accessToken } = req.body;

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

        const roleId = roleMap[String(productId)] || "1301273196267442260";

        //----------------------------------
        // 1. ADD USER TO SERVER (CRITICAL)
        //----------------------------------

        const addUser = await fetch(
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

        console.log("Join status:", addUser.status);

        //----------------------------------
        // 2. GIVE ROLE
        //----------------------------------

        const giveRole = await fetch(
            `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`
                }
            }
        );

        console.log("Role status:", giveRole.status);

        if (!giveRole.ok) {
            const err = await giveRole.text();
            return res.status(500).send(err);
        }

        return res.status(200).send("DONE");

    } catch (err) {
        console.error(err);
        return res.status(500).send("Crash");
    }
}
