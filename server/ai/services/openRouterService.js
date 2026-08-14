const { getAnalyzeListingPrompt } = require('../prompts/analyzeListingPrompt');
require('dotenv').config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

exports.analyzeListing = async (productData, imageUris = []) => {
    try {
        console.log(`[AI DEBUG] Product name: ${productData.productName}`);
        console.log(`[AI DEBUG] Image received: ${imageUris.length > 0 ? 'YES' : 'NO'}`);
        if (imageUris.length > 0) {
            console.log(`[AI DEBUG] Image format: ${imageUris[0].substring(0, 30)}...`);
            console.log(`[AI DEBUG] Image data length: ${imageUris[0].length}`);
        }
        console.log(`[AI DEBUG] Backend request received: YES`);

        const systemPrompt = getAnalyzeListingPrompt(productData, imageUris.length > 0);

        let contentArray = [
            {
                type: 'text',
                text: systemPrompt
            }
        ];

        if (imageUris.length > 0) {
            imageUris.forEach((uri) => {
                contentArray.push({
                    type: 'image_url',
                    image_url: {
                        url: uri
                    }
                });
            });
        }

        const requestBody = {
            model: MODEL,
            messages: [
                {
                    role: 'user',
                    content: contentArray
                }
            ],
            temperature: 0.2
        };

        console.log(`[AI DEBUG] OpenRouter request started: YES`);

        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'LUMINA_Marketplace',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log(`[AI DEBUG] HTTP status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errBody = await response.text();
            console.log(`[AI DEBUG] OpenRouter response: ${errBody}`);
            throw new Error(`OpenRouter API fail: ${response.status} - ${errBody}`);
        }

        const data = await response.json();
        console.log(`[AI DEBUG] Frontend received response: YES`);

        if (!data.choices || data.choices.length === 0) {
            throw new Error('No choices returned from OpenRouter.');
        }

        let rawText = data.choices[0].message.content;
        rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(rawText);
        } catch (e) {
            console.error('Failed to parse OpenRouter response as JSON:', rawText);
            throw new Error('AI response was not valid JSON');
        }

        return jsonResponse;
    } catch (error) {
        console.error('Error calling OpenRouter API:', error);
        // Do NOT replace real error with AI_SERVICE_UNAVAILABLE as requested
        throw error;
    }
};
