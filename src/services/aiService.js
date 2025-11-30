import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_ARK_API_KEY,
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true
});

export async function analyzeContent(text, imageBase64) {
    const content = [];
    
    if (imageBase64) {
        content.push({
            type: 'image_url',
            image_url: {
                url: imageBase64
            }
        });
    }
    
    if (text) {
        content.push({ type: 'text', text: text });
    }

    if (content.length === 0) {
        throw new Error('请提供文本 or 图片');
    }

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: content
                }
            ],
            model: 'doubao-seed-1-6-251015',
            reasoning_effort: 'medium'
        });

        return completion.choices[0]?.message?.content || '无响应内容';
    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}
