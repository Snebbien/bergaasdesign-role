export default async function handler(req, res) {
    try {
        console.log("METHOD:", req.method);

        if (req.method !== "POST") {
            return res.status(405).send("Only POST allowed");
        }

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

        let roleId = roleMap[String(productId)];

        if (!roleId) {
            console.log("Unknown productId, using fallback:", productId);
            roleId = "1301273196267442260";
        }

        //----------------------------------
        // GIVE ROLE
        //----------------------------------

        const discordUrl = `https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${discordId}/roles/${roleId}`;

        console.log("Giving role:", discordUrl);

        const response = await fetch(discordUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bot ${process.env.BOT_TOKEN}`
            }
        });

        const text = await response.text();

        console.log("Discord response:", {
            status: response.status,
            body: text
        });

        //----------------------------------
        // ERROR HANDLING (CRITICAL)
        //----------------------------------

        if (response.status === 404) {
            return res.status(400).send("NOT_IN_SERVER");
        }

        if (response.status === 403) {
            return res.status(400).send("NO_PERMISSION");
        }

        if (!response.ok) {
            return res.status(500).send("DISCORD_ERROR");
        }

        return res.status(200).send("ROLE_ASSIGNED");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("SERVER_ERROR");
    }
}
