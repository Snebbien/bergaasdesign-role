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
        // Get user info (IMPORTANT)
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

        //----------------------------------
        // OPTIONAL: check guild
        //----------------------------------

        const guildResponse = await fetch(
            "https://discord.com/api/users/@me/guilds",
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            }
        );

        const guilds = await guildResponse.json();

        const inServer = guilds.some(
            g => g.id === process.env.GUILD_ID
        );

        //----------------------------------
        // Redirect with Discord ID
        //----------------------------------

        if (inServer) {
            return res.writeHead(302, {
                Location: `${process.env.SUCCESS_REDIRECT}?discord_id=${userData.id}`
            }).end();
        } else {
            return res.writeHead(302, {
                Location: process.env.JOIN_SERVER_URL
            }).end();
        }

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}