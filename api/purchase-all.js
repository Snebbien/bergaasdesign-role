export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).send("Only POST allowed");
        }

        const { discordId, productId, accessToken } = req.body || {};

        if (!discordId) {
            return res.status(400).send("Missing Discord ID");
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

        const roleId = roleMap[String(productId)] || "1301273196267442260";

        //----------------------------------
        // 1. ADD USER TO SERVER
        //----------------------------------

        const joinRes = await fetch(
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

        const joinText = await joinRes.text();
        console.log("JOIN:", joinRes.status, joinText);

        //----------------------------------
        // 2. ASSIGN ROLE
        //----------------------------------

        const roleRes = await fetch(
            `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`
                }
            }
        );

        const roleText = await roleRes.text();
        console.log("ROLE:", roleRes.status, roleText);

        if (!roleRes.ok) {
            return res.status(500).send(`Discord role error:\n${roleRes.status}\n${roleText}`);
        }

        return res.status(200).send("DONE");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("SERVER CRASH:\n" + err.message);
    }
}
