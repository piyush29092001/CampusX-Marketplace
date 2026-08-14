async function trace() {
    try {
        console.log("=== LOGGING IN ===\n");
        const loginRes = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "test@lumina.local", password: "12434@P" })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.log("Login failed!", loginData);
            return;
        }

        const token = loginData.token;

        console.log("=== TRACING PROBLEM 1: AI ANALYSIS (VIA BACKEND) ===");
        const aiRes = await fetch("http://localhost:5000/api/ai/analyze-listing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ images: [], title: "", description: "" })
        });
        console.log("HTTP Status:", aiRes.status);
        console.log("Content-Type:", aiRes.headers.get('content-type'));
        console.log("Response Body (start):", (await aiRes.text()).substring(0, 50));

        console.log("\n=== TRACING P1 VIA VITE PROXY ===");
        try {
            const aiProxyRes = await fetch("http://localhost:5173/api/ai/analyze-listing", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ images: [], title: "", description: "" })
            });
            console.log("HTTP Status:", aiProxyRes.status);
            console.log("Content-Type:", aiProxyRes.headers.get('content-type'));
            console.log("Response Body (start):", (await aiProxyRes.text()).substring(0, 50));
        } catch (e) { console.log(e.message); }

        console.log("\n=== TRACING PROBLEM 2: MESSAGES ===");
        const msgRes = await fetch("http://localhost:5000/api/messages/conversations", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        console.log("HTTP Status:", msgRes.status);
        console.log("Content-Type:", msgRes.headers.get('content-type'));
        console.log("Response JSON:", (await msgRes.text()).substring(0, 150));

    } catch (err) {
        console.log("Trace error:", err);
    }
}
trace();
