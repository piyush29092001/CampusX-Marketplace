require("dotenv").config();

async function run() {
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-4-26b-a4b-it:free",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Hello" },
                            { type: "image_url", image_url: { url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" } }
                        ]
                    }
                ]
            })
        });
        const text = await res.text();
        console.log("RESPONSE:", res.status, text);
    } catch (e) {
        console.error(e);
    }
}
run();
