<script setup>
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_ARK_API_KEY,
    baseURL:'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true
})

async function test(){
    console.log('测试豆包接口中...');
    const completion = await openai.chat.completions.create({
        messages:[
            {
                role:'user',
                content:[
                    {type:'image_url', image_url:{url:'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg'}},
                    {type:'text', text:'这是哪里？'}
                ]
            }
        ],
        model:'doubao-seed-1-6-251015',
        reasoning_effort:'medium'
    });
    console.log(completion.choices[0]?.message?.reasoning_content||'');
    console.log(completion.choices[0]?.message?.content);
}
</script>

<template>
    <div>豆包</div>
    <button @click="test">测试豆包的接口</button>
</template>

