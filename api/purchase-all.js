export default async function handler(req, res) {
    const { discordId } = req.body;

    if (!discordId) {
        return res.status(400).send("Missing Discord ID");
    }

    try {

        //----------------------------------
        // 🔥 TEMP: Give ALL roles (test)
        //----------------------------------

        const roles = [
            "1301273196267442260",
            "1484113519833120849",
            "1445199206456229929",
            "1300087659670274079",
            "1483125343182393465"
        ];

        for (const roleId of roles) {
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
