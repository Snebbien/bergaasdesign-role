export default async function handler(req, res) {
    try {
        console.log("METHOD:", req.method);

        if (req.method !== "POST") {
            return res.status(405).send("Only POST allowed");
        }

        // ✅ Ensure body exists
        const { discordId, productId } = req.body || {};

        console.log("BODY:", req.body);

        if (!discordId) {
            return res.status(400).send("Missing Discord ID");
        }

        //----------------------------------
        // PRODUCT → ROLE MAP
        //----------------------------------

        const roleMap = {
            "59": "1301273196267442260",
            "88": "1484113519833120849",
            "89": "1445199206456229929",
            "90": "1300087659670274079",
            "117": "1483125343182393465"
        };

        //----------------------------------
        // PICK ROLE
        //----------------------------------

        let roleId = roleMap[String(productId)];

        if (!roleId) {
            console.log("Unknown productId, using fallback:", productId);
            roleId = "1301273196267442260";
        }

        //----------------------------------
        // GIVE ROLE
        //----------------------------------

        const discordUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`;

        console.log("Calling Discord:", discordUrl);

        const response = await fetch(discordUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bot ${process.env.BOT_TOKEN}`
            }
        });

        const text = await response.text();
        console.log("Discord response:", text);

        if (!response.ok) {
            return res.status(500).send(`Discord API failed: ${text}`);
        }

        return res.status(200).send("Role assigned");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("Server crash");
    }
}
