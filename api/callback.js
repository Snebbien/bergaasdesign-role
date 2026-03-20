export default async function handler(req, res) {
    const redirectBase = process.env.SUCCESS_REDIRECT;

    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get("code");

        if (!code) {
            return res.writeHead(302, {
                Location: `${redirectBase}/error`
            }).end();
        }

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

        if (!tokenResponse.ok) {
            console.error("TOKEN ERROR:", await tokenResponse.text());

            return res.writeHead(302, {
                Location: `${redirectBase}/error`
            }).end();
        }

        const tokenData = await tokenResponse.json();

        //----------------------------------
        // Get Discord user
        //----------------------------------

        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        if (!userResponse.ok) {
            console.error("USER ERROR:", await userResponse.text());

            return res.writeHead(302, {
                Location: `${redirectBase}/error`
            }).end();
        }

        const userData = await userResponse.json();
        const discordId = userData.id;

        //----------------------------------
        // Call purchase API
        //----------------------------------

        const roleResponse = await fetch(
            `${process.env.BASE_URL}/api/purchase-all`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ discordId })
            }
        );

        if (!roleResponse.ok) {
            console.error("ROLE ERROR:", await roleResponse.text());

            return res.writeHead(302, {
                Location: `${redirectBase}/error`
            }).end();
        }

        //----------------------------------
        // SUCCESS
        //----------------------------------

        return res.writeHead(302, {
            Location: `${redirectBase}/success`
        }).end();

    } catch (err) {
        console.error("CRASH:", err);

        return res.writeHead(302, {
            Location: `${redirectBase}/error`
        }).end();
    }
}
