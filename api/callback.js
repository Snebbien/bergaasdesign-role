export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get("code");
        const productId = url.searchParams.get("product_id");

        if (!code) return res.status(400).send("Missing code");

        // 1. TOKEN
        const params = new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: process.env.REDIRECT_URI
        });

        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const token = await tokenRes.json();

        // 2. USER
        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${token.access_token}` }
        });

        const user = await userRes.json();

        // 3. CALL ROLE API
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

        const text = await roleRes.text();

        if (!roleRes.ok) {
            return res.status(500).send(text);
        }

        return res.redirect(`${process.env.SUCCESS_REDIRECT}/success`);

    } catch (err) {
        console.error(err);
        return res.status(500).send("Crash");
    }
}
