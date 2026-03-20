export default async function handler(req, res) {
    const redirectBase = process.env.SUCCESS_REDIRECT;

    try {
        const url = new URL(req.url, `https://${req.headers.host}`);
        const code = url.searchParams.get("code");
        const productId = url.searchParams.get("product_id");

        console.log("Incoming query:", { code, productId });

        if (!code) {
            console.log("Missing code");
            return res.redirect(`${redirectBase}/error`);
        }

        //----------------------------------
        // GET TOKEN FROM DISCORD
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

        const tokenText = await tokenResponse.text();
        console.log("Token response:", tokenText);

        if (!tokenResponse.ok) {
            return res.redirect(`${redirectBase}/error`);
        }

        const tokenData = JSON.parse(tokenText);

        //----------------------------------
        // GET USER DATA
        //----------------------------------

        const userResponse = await fetch("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`
            }
        });

        const userText = await userResponse.text();
        console.log("User response:", userText);

        if (!userResponse.ok) {
            return res.redirect(`${redirectBase}/error`);
        }

        const userData = JSON.parse(userText);

        //----------------------------------
        // CALL ROLE FUNCTION
        //----------------------------------

        const apiUrl = `${req.headers.origin}/api/purchase-all`; // 🔥 safer than BASE_URL

        console.log("Calling purchase-all:", {
            apiUrl,
            discordId: userData.id,
            productId
        });

        const roleResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                discordId: userData.id,
                productId: productId || null
            })
        });

        const roleText = await roleResponse.text();
        console.log("Role response:", roleText);

        if (!roleResponse.ok) {
            return res.redirect(`${redirectBase}/error`);
        }

        //----------------------------------
        // SUCCESS
        //----------------------------------

        return res.redirect(`${redirectBase}/success`);

    } catch (err) {
        console.error("CRASH:", err);
        return res.redirect(`${redirectBase}/error`);
    }
}
