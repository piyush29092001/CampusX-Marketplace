async function run() {
    try {
        const payload = {
            productName: "Laptop",
            category: "Electronics",
            brand: "HP",
            model: "Pavilion",
            purchaseYear: "2021",
            originalPrice: "50000",
            additionalInformation: "Some scratches on top",
            productImages: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="]
        };

        const res = await fetch("http://localhost:5000/api/ai/analyze-listing", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        console.log("HTTP STATUS:", res.status, res.statusText);
        const json = await res.json();
        console.log("RESPONSE JSON:", JSON.stringify(json, null, 2));
    } catch (e) {
        console.error("Error connecting to backend:", e);
    }
}
run();
