export default async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).send("Only POST allowed");
        }

        const { discordId, productId } = req.body;

        if (!discordId || !productId) {
            return res.status(400).send("Missing data");
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

        const roleId = roleMap[productId];

        if (!roleId) {
            return res.status(400).send("Invalid product");
        }

        //----------------------------------
        // GIVE ROLE
        //----------------------------------

        const response = await fetch(
            `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`,
            {
                method: "PUT",
                headers: {
                    Authorization: `Bot ${process.env.BOT_TOKEN}`
                }
            }
        );

        const text = await response.text();
        console.log("Discord response:", text);

        if (!response.ok) {
            return res.status(500).send(text);
        }

        return res.status(200).send("Role assigned");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("Server crash");
    }
}
