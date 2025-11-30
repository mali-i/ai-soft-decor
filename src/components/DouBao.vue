<script setup>
import { ref, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { analyzeContent } from '../services/aiService';
import '../assets/markdown.css';

marked.setOptions({
    breaks: true,
    gfm: true
});

const userText = ref('');
const userImage = ref(null);
const userImageBase64 = ref(null);
const isLoading = ref(false);
const result = ref('');

const renderedResult = computed(() => {
    if (!result.value) return '';
    const html = marked(result.value);
    return DOMPurify.sanitize(html);
});

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        userImage.value = URL.createObjectURL(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            userImageBase64.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function clearForm() {
    userText.value = '';
    userImage.value = null;
    userImageBase64.value = null;
    result.value = '';
    // Reset file input if needed
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
}

async function handleAnalyze() {
    if (!userText.value && !userImageBase64.value) {
        return;
    }

    isLoading.value = true;
    result.value = '';
    
    try {
        result.value = await analyzeContent(userText.value, userImageBase64.value);
    } catch (error) {
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
                        @keyup.enter="handleAnalyze"
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
                
                <div class="button-group">
                    <button 
                        @click="clearForm" 
                        class="clear-button"
                        :disabled="isLoading"
                    >
                        清空
                    </button>
                    <button 
                        @click="handleAnalyze" 
                        :disabled="(!userText && !userImage) || isLoading"
                        class="submit-button"
                    >
                        <span v-if="isLoading" class="loading-spinner"></span>
                        {{ isLoading ? '分析中...' : '开始分析' }}
                    </button>
                </div>
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

.button-group {
    display: flex;
    gap: 12px;
}

.submit-button {
    flex: 2;
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

.clear-button {
    flex: 1;
    padding: 12px 24px;
    background: #fff;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.clear-button:hover:not(:disabled) {
    background: #f1f5f9;
    color: #475569;
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

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
</style>

