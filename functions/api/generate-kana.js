// This serverless function runs on Cloudflare, not in the user's browser.
// It securely calls the Gemini API to add kana readings to song titles and artists.

import { GoogleGenAI } from '@google/genai';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
});

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }

    try {
        const { songs } = await request.json();

        if (!Array.isArray(songs) || songs.length === 0) {
            return jsonResponse({ error: 'Invalid songs data provided.' }, 400);
        }

        if (!env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in Cloudflare environment variables.");
            return jsonResponse({ error: 'Server configuration error: API key is missing.' }, 500);
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        
        const prompt = `以下の日本の曲名とアーティスト名のリストについて、一般的なカタカナの読み仮名を括弧付きで追記してください。
- 英語名、数字、記号のみ、または既にカタカナ/ひらがなの場合は、読み仮名は不要です。その場合は元の文字列をそのまま返してください。
- 読み仮名が必要な漢字や英語表記の場合のみ「元の名前(カタカナ)」の形式にしてください。
- 結果はJSON配列で、各要素は { "originalTitle": "元の曲名", "updatedTitle": "更新後の曲名", "originalArtist": "元のアーティスト名", "updatedArtist": "更新後のアーティスト名" } の形式で返してください。

リスト:
${JSON.stringify(songs.map(s => ({ title: s.title, artist: s.artist })))}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        const rawJson = (response.text ?? '').trim().replace(/^```json\s*|```\s*$/g, '');
        const kanaResults = rawJson ? JSON.parse(rawJson) : [];

        return jsonResponse({ kanaResults });

    } catch (error) {
        console.error("Error in generate-kana function:", error);
        return jsonResponse({ error: 'Failed to generate kana from AI service.' }, 500);
    }
}
