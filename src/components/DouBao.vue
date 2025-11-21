<script setup>
import { ref, computed } from 'vue';
import OpenAI from 'openai';
import { marked } from 'marked';

marked.setOptions({
    breaks: true,
    gfm: true
});

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_ARK_API_KEY,
    baseURL:'https://ark.cn-beijing.volces.com/api/v3',
    dangerouslyAllowBrowser: true
})

const userText = ref('');
const userImage = ref(null);
const userImageBase64 = ref(null); // 添加base64存储
const isLoading = ref(false);
const result = ref('');

// Add computed property for markdown rendering
const renderedResult = computed(() => {
    if (!result.value) return '';
    return marked(result.value);
});

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // 用于预览显示
        userImage.value = URL.createObjectURL(file);
        
        // 转换为base64用于API调用
        const reader = new FileReader();
        reader.onload = function(e) {
            userImageBase64.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function test() {
    if (!userText.value && !userImageBase64.value) {
        console.error('请提供文本或图片');
        return;
    }

    isLoading.value = true;
    result.value = '';
    
    try {
        console.log('调用豆包接口中...');
        
        // 构建消息内容
        const content = [];
        if (userImageBase64.value) {
            content.push({
                type: 'image_url', 
                image_url: {
                    url: userImageBase64.value // 使用base64数据
                }
            });
        }
        if (userText.value) {
            content.push({type:'text', text:userText.value});
        }
        
        const completion = await openai.chat.completions.create({
            messages:[
                {
                    role:'user',
                    content: content
                }
            ],
            model:'doubao-seed-1-6-251015',
            reasoning_effort:'medium'
        });
        
        result.value = completion.choices[0]?.message?.content || '无响应内容';
        console.log(completion.choices[0]?.message?.reasoning_content||'');
        console.log(completion.choices[0]?.message?.content);
    } catch (error) {
        console.error('API调用失败:', error);
        result.value = 'API调用失败，请重试';
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="doubao-container">
        <div class="header">
            <h2 class="title">豆包 软装</h2>
            <p class="subtitle">上传图片和/或输入问题，获取智能分析</p>
        </div>
        
        <div class="main-content">
            <div class="form-container">
                <div class="input-group">
                    <label for="text-input" class="label">输入内容</label>
                    <input 
                        id="text-input" 
                        v-model="userText" 
                        type="text" 
                        placeholder="请输入您想询问的内容..." 
                        class="text-input"
                    />
                </div>
                
                <div class="input-group">
                    <label for="image-upload" class="label">上传图片</label>
                    <div class="upload-area">
                        <input 
                            id="image-upload" 
                            type="file" 
                            @change="handleImageUpload" 
                            accept="image/*" 
                            class="file-input"
                        />
                        <div v-if="!userImage" class="upload-placeholder">
                            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>点击选择图片</span>
                        </div>
                        <img v-if="userImage" :src="userImage" alt="预览图片" class="preview-image" />
                    </div>
                </div>
                
                <button 
                    @click="test" 
                    :disabled="(!userText && !userImage) || isLoading"
                    class="submit-button"
                >
                    <span v-if="isLoading" class="loading-spinner"></span>
                    {{ isLoading ? '分析中...' : '开始分析' }}
                </button>
            </div>
            
            <div class="result-container">
                <h3 class="result-title">分析结果</h3>
                <div v-if="!result && !isLoading" class="result-placeholder">
                    等待分析结果...
                </div>
                <div v-if="isLoading" class="result-loading">
                    <div class="loading-spinner"></div>
                    <span>AI 正在分析中，请稍候...</span>
                </div>
                <div v-if="result" class="result-content markdown-content" v-html="renderedResult"></div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.doubao-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
    text-align: center;
    margin-bottom: 32px;
}

.title {
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0 0 8px 0;
}

.subtitle {
    font-size: 16px;
    color: #666;
    margin: 0;
}

.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
}

@media (max-width: 768px) {
    .main-content {
        grid-template-columns: 1fr;
    }
}

.form-container {
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
}

.input-group {
    margin-bottom: 20px;
}

.label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
}

.text-input {
    width: 100%;
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.2s ease;
    box-sizing: border-box;
}

.text-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.upload-area {
    position: relative;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    transition: border-color 0.2s ease;
    cursor: pointer;
}

.upload-area:hover {
    border-color: #3b82f6;
}

.file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #6b7280;
}

.upload-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    object-fit: contain;
}

.submit-button {
    width: 100%;
    padding: 12px 24px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.submit-button:hover:not(:disabled) {
    background: #2563eb;
}

.submit-button:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.result-container {
    background: #f8fafc;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid #e2e8f0;
    min-height: 300px;
}

.result-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
}

.result-placeholder {
    color: #64748b;
    font-style: italic;
    text-align: center;
    padding: 60px 0;
}

.result-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 0;
    color: #64748b;
}

.result-content {
    font-size: 16px;
    line-height: 1.6;
    color: #334155;
}

/* Markdown content styling */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    margin: 16px 0 8px 0;
    font-weight: 600;
    color: #1e293b;
}

.markdown-content :deep(h1) { font-size: 24px; }
.markdown-content :deep(h2) { font-size: 20px; }
.markdown-content :deep(h3) { font-size: 18px; }
.markdown-content :deep(h4) { font-size: 16px; }

.markdown-content :deep(p) {
    margin: 12px 0;
    line-height: 1.6;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
    margin: 12px 0;
    padding-left: 20px;
}

.markdown-content :deep(li) {
    margin: 4px 0;
}

.markdown-content :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid #3b82f6;
    background: #f1f5f9;
    font-style: italic;
}

.markdown-content :deep(code) {
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 14px;
    color: #e11d48;
}

.markdown-content :deep(pre) {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
}

.markdown-content :deep(pre code) {
    background: none;
    padding: 0;
    color: #334155;
}

.markdown-content :deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
    border: 1px solid #e2e8f0;
    padding: 8px 12px;
    text-align: left;
}

.markdown-content :deep(th) {
    background: #f8fafc;
    font-weight: 600;
}

.markdown-content :deep(strong) {
    font-weight: 600;
    color: #1e293b;
}

.markdown-content :deep(em) {
    font-style: italic;
}

.markdown-content :deep(hr) {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 24px 0;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>

