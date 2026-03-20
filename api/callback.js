export default async function handler(req, res) {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const code = url.searchParams.get("code");

    if (!code) {
        return res.status(400).send("No code provided");
    }

    try {
        //----------------------------------
        // Exchange code
        //----------------------------------

        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.REDIRECT_URI
        });

        const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const tokenData = await tokenResponse.json();

        //----------------------------------
        // Get Discord user
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

        //----------------------------------
        // 🔥 CALL YOUR PURCHASE API
        //----------------------------------

        await fetch(`${process.env.BASE_URL}/api/purchase-all`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ discordId })
        });

        //----------------------------------
        // Redirect back
        //----------------------------------

        return res.writeHead(302, {
            Location: `${process.env.SUCCESS_REDIRECT}?success=true`
        }).end();

    } catch (err) {
        console.error(err);
        return res.status(500).send("Server error");
    }
}
