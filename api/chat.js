// This file should be placed in an 'api' directory,
// for example: /api/chat.js

// This function will be triggered when your frontend calls '/api/chat'.
export default async function handler(request, response) {
    // Set CORS headers to allow requests from your frontend
    // For production, you can replace '*' with your specific frontend URL for better security
    response.setHeader('Access-Control-Allow-Credentials', true);
    response.setHeader('Access-Control-Allow-Origin', '*'); 
    response.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    response.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight OPTIONS request for CORS
    if (request.method === 'OPTIONS') {
        response.status(200).end();
        return;
    }

    // 1. Check for POST request
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const userPrompt = request.body.prompt;

    if (!userPrompt) {
        return response.status(400).json({ error: 'Prompt is required' });
    }

    // 2. Get the secret API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key not configured on server' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // 3. Call the Gemini API securely from the backend
    try {
        const geminiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }]
            }),
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error('Gemini API Error:', errorBody);
            return response.status(geminiResponse.status).json({ error: 'Failed to get response from AI model' });
        }

        const geminiResult = await geminiResponse.json();
        
        const responseText = geminiResult.candidates[0]?.content?.parts[0]?.text || "Sorry, I couldn't generate a response.";

        // 4. Send the response back to the frontend
        return response.status(200).json({ text: responseText });

    } catch (error) {
        console.error('Proxy Error:', error);
        return response.status(500).json({ error: 'An internal error occurred.' });
    }
}
