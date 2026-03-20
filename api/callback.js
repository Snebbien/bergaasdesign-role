export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get("code");
        const productId = url.searchParams.get("product_id");

        if (!code) {
            return res.status(400).send("Missing code");
        }

        //----------------------------------
        // GET TOKEN FROM DISCORD (SAFE)
        //----------------------------------

        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code: code,
            redirect_uri: process.env.REDIRECT_URI
        });

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        const tokenText = await tokenRes.text();
        console.log("TOKEN RAW:", tokenText);

        let token;
        try {
            token = JSON.parse(tokenText);
        } catch {
            return res.status(500).send("Invalid token response:\n" + tokenText);
        }

        if (!tokenRes.ok) {
            return res.status(500).send("Token failed:\n" + tokenText);
        }

        //----------------------------------
        // GET USER (SAFE)
        //----------------------------------

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${token.access_token}`
            }
        });

        const userText = await userRes.text();
        console.log("USER RAW:", userText);

        let user;
        try {
            user = JSON.parse(userText);
        } catch {
            return res.status(500).send("Invalid user response:\n" + userText);
        }

        if (!userRes.ok) {
            return res.status(500).send("User fetch failed:\n" + userText);
        }

        //----------------------------------
        // CALL ROLE API
        //----------------------------------

        const roleRes = await fetch(`${req.headers.origin}/api/purchase-all`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                discordId: user.id,
                productId,
                accessToken: token.access_token
            })
        });

        const roleText = await roleRes.text();
        console.log("ROLE RAW:", roleText);

        if (!roleRes.ok) {
            return res.status(500).send("Role error:\n" + roleText);
        }

        //----------------------------------
        // SUCCESS
        //----------------------------------

        return res.send("✅ SUCCESS - Role assigned!");

    } catch (err) {
        console.error("CRASH:", err);
        return res.status(500).send("CRASH:\n" + err.message);
    }
}
