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
                    role: 'system',
                    content: `你是一位资深的室内软装设计师。请根据用户的描述和图片进行专业分析。
必须以纯 JSON 格式返回结果，不要包含 markdown 代码块标记（如 \`\`\`json），格式如下：
{
    "analysis": "这里是你的详细分析建议，使用 Markdown 格式排版，包括风格定位、配色建议、布局优化等。",
    "products": [
        {
            "name": "商品名称（如：北欧极简落地灯）",
            "reason": "推荐理由（简短说明为什么选这个）",
            "keywords": "用于电商搜索的关键词（如：落地灯 极简 黄铜）"
        }
    ]
}
请确保返回的是合法的 JSON 字符串。`
                },
                {
                    role: 'user',
                    content: content
                }
            ],
            model: 'doubao-seed-1-6-251015',
            reasoning_effort: 'medium'
        });

        const contentStr = completion.choices[0]?.message?.content || '';
        // 尝试清理可能存在的 markdown 标记，以防万一
        const jsonStr = contentStr.replace(/```json\n?|\n?```/g, '').trim();
        
        try {
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error('JSON解析失败，回退到纯文本模式', e);
            // 如果解析失败，返回一个兼容的结构
            return {
                analysis: contentStr,
                products: []
            };
        }
    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}
