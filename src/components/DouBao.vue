<script setup>
import { ref, computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { analyzeContent, generateDesignImage } from '../services/aiService';
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
const products = ref([]);
const generatedImageUrl = ref(null);
const isGeneratingImage = ref(false);

// UI State
const activeTab = ref('analysis'); // 'analysis', 'image', 'products'
const showMobileResult = ref(false); // Toggle between Input and Result on mobile

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
    products.value = [];
    generatedImageUrl.value = null;
    showMobileResult.value = false;
    activeTab.value = 'analysis';
    
    const fileInput = document.getElementById('image-upload');
    if (fileInput) fileInput.value = '';
}

async function handleAnalyze() {
    if (!userText.value && !userImageBase64.value) {
        return;
    }

    isLoading.value = true;
    result.value = '';
    products.value = [];
    generatedImageUrl.value = null;
    showMobileResult.value = true; // Switch to result view on mobile
    activeTab.value = 'analysis';
    
    try {
        const response = await analyzeContent(userText.value, userImageBase64.value);
        
        let imagePrompt = '';

        if (typeof response === 'object' && response.analysis) {
            result.value = response.analysis;
            products.value = response.products || [];
            imagePrompt = response.image_prompt;
        } else {
            result.value = typeof response === 'string' ? response : JSON.stringify(response);
        }

        if (imagePrompt) {
            isGeneratingImage.value = true;
            generateDesignImage(imagePrompt).then(url => {
                if (url) {
                    generatedImageUrl.value = url;
                }
            }).finally(() => {
                isGeneratingImage.value = false;
            });
        }

    } catch (error) {
        result.value = 'API调用失败，请重试';
    } finally {
        isLoading.value = false;
    }
}

function getSearchLink(keyword) {
    return `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`;
}
</script>

<template>
    <div class="app-layout">
        <!-- Sidebar / Input Area -->
        <aside class="sidebar" :class="{ 'mobile-hidden': showMobileResult }">
            <div class="sidebar-header">
                <h1 class="logo">豆包软装 AI</h1>
                <p class="tagline">您的智能空间设计师</p>
            </div>
            
            <div class="input-container">
                <div class="input-group">
                    <label class="label">设计需求</label>
                    <textarea 
                        v-model="userText" 
                        placeholder="描述您想要的风格、色调或改造需求..." 
                        class="text-input"
                        rows="4"
                    ></textarea>
                </div>
                
                <div class="input-group">
                    <label class="label">空间照片</label>
                    <div class="upload-area">
                        <input 
                            id="image-upload" 
                            type="file" 
                            @change="handleImageUpload" 
                            accept="image/*" 
                            class="file-input"
                        />
                        <div v-if="!userImage" class="upload-placeholder">
                            <span class="icon">📷</span>
                            <span>点击上传照片</span>
                        </div>
                        <img v-if="userImage" :src="userImage" class="preview-image" />
                    </div>
                </div>
            </div>

            <div class="sidebar-footer">
                <button @click="clearForm" class="btn btn-secondary" :disabled="isLoading">重置</button>
                <button @click="handleAnalyze" class="btn btn-primary" :disabled="(!userText && !userImage) || isLoading">
                    {{ isLoading ? '分析中...' : '开始设计' }}
                </button>
            </div>
        </aside>

        <!-- Main Content / Result Area -->
        <main class="main-content" :class="{ 'mobile-visible': showMobileResult }">
            <!-- Mobile Header for Back Navigation -->
            <div class="mobile-nav" v-if="showMobileResult">
                <button @click="showMobileResult = false" class="btn-back">← 返回编辑</button>
                <span class="mobile-title">设计方案</span>
            </div>

            <div v-if="!result && !isLoading" class="empty-state">
                <div class="empty-icon">✨</div>
                <h3>准备好开始了吗？</h3>
                <p>在左侧输入您的需求，AI 将为您生成专属软装方案。</p>
            </div>

            <div v-else class="result-wrapper">
                <!-- Result Tabs -->
                <div class="tabs-header">
                    <button 
                        class="tab-btn" 
                        :class="{ active: activeTab === 'analysis' }"
                        @click="activeTab = 'analysis'"
                    >
                        📝 设计分析
                    </button>
                    <button 
                        class="tab-btn" 
                        :class="{ active: activeTab === 'image' }"
                        @click="activeTab = 'image'"
                    >
                        🎨 效果图
                    </button>
                    <button 
                        class="tab-btn" 
                        :class="{ active: activeTab === 'products' }"
                        @click="activeTab = 'products'"
                    >
                        🛍️ 推荐好物
                    </button>
                </div>

                <!-- Tab Contents -->
                <div class="tab-content">
                    <!-- Analysis Tab -->
                    <div v-show="activeTab === 'analysis'" class="content-pane">
                        <div v-if="isLoading && !result" class="loading-state">
                            <div class="spinner"></div>
                            <p>正在分析空间结构与风格...</p>
                        </div>
                        <div v-else class="markdown-content" v-html="renderedResult"></div>
                    </div>

                    <!-- Image Tab -->
                    <div v-show="activeTab === 'image'" class="content-pane center-pane">
                        <div v-if="isGeneratingImage" class="loading-state">
                            <div class="spinner"></div>
                            <p>AI 正在绘制效果图，请稍候...</p>
                        </div>
                        <div v-else-if="generatedImageUrl" class="image-result">
                            <img :src="generatedImageUrl" alt="AI Design" />
                            <a :href="generatedImageUrl" download="design.png" class="btn btn-outline">下载高清图</a>
                        </div>
                        <div v-else class="empty-pane">
                            <p>暂无效果图，请先开始分析。</p>
                        </div>
                    </div>

                    <!-- Products Tab -->
                    <div v-show="activeTab === 'products'" class="content-pane">
                        <div v-if="products.length > 0" class="products-grid">
                            <div v-for="(product, index) in products" :key="index" class="product-card">
                                <div class="product-info">
                                    <h4>{{ product.name }}</h4>
                                    <p>{{ product.reason }}</p>
                                </div>
                                <a :href="getSearchLink(product.keywords)" target="_blank" class="btn-buy">搜同款</a>
                            </div>
                        </div>
                        <div v-else class="empty-pane">
                            <p>暂无推荐商品。</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* Layout Structure */
.app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    background-color: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Sidebar */
.sidebar {
    width: 400px;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    z-index: 10;
    flex-shrink: 0;
}

.sidebar-header {
    padding: 24px;
    border-bottom: 1px solid #f1f5f9;
}

.logo {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.tagline {
    color: #64748b;
    font-size: 14px;
    margin-top: 4px;
}

.input-container {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

.sidebar-footer {
    padding: 20px 24px;
    border-top: 1px solid #f1f5f9;
    display: flex;
    gap: 12px;
    background: #fff;
}

/* Main Content */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #f8fafc;
    position: relative;
}

/* Mobile Navigation */
.mobile-nav {
    display: none; /* Hidden on desktop */
    padding: 16px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    align-items: center;
    justify-content: space-between;
}

.btn-back {
    background: none;
    border: none;
    color: #3b82f6;
    font-weight: 500;
    cursor: pointer;
}

.mobile-title {
    font-weight: 600;
    color: #1e293b;
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    text-align: center;
    padding: 20px;
}

.empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

/* Result Wrapper */
.result-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

/* Tabs */
.tabs-header {
    display: flex;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 24px;
}

.tab-btn {
    padding: 16px 24px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 15px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    color: #3b82f6;
}

.tab-btn.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
}

.tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
}

/* Content Panes */
.content-pane {
    max-width: 800px;
    margin: 0 auto;
    animation: fadeIn 0.3s ease;
}

.center-pane {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100%;
}

.empty-pane {
    text-align: center;
    color: #94a3b8;
    padding: 40px;
}

/* Form Elements */
.input-group {
    margin-bottom: 24px;
}

.label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
}

.text-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 15px;
    resize: vertical;
    transition: border-color 0.2s;
}

.text-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.upload-area {
    border: 2px dashed #cbd5e1;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    position: relative;
    min-height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s;
}

.upload-area:hover {
    border-color: #3b82f6;
}

.file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #64748b;
}

.preview-image {
    max-width: 100%;
    max-height: 200px;
    border-radius: 4px;
    object-fit: contain;
}

/* Buttons */
.btn {
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-size: 15px;
    transition: all 0.2s;
}

.btn-primary {
    background: #3b82f6;
    color: white;
    flex: 2;
}

.btn-primary:hover:not(:disabled) {
    background: #2563eb;
}

.btn-primary:disabled {
    background: #94a3b8;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f1f5f9;
    color: #475569;
    flex: 1;
}

.btn-secondary:hover {
    background: #e2e8f0;
}

.btn-outline {
    display: inline-block;
    padding: 10px 20px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #475569;
    text-decoration: none;
    margin-top: 16px;
    transition: all 0.2s;
}

.btn-outline:hover {
    background: #f8fafc;
    border-color: #94a3b8;
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
}

.product-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s;
}

.product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.product-info h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #1e293b;
}

.product-info p {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 16px 0;
    line-height: 1.4;
    flex: 1;
}

.btn-buy {
    text-align: center;
    padding: 8px;
    background: #f1f5f9;
    color: #475569;
    text-decoration: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
}

.btn-buy:hover {
    background: #e2e8f0;
    color: #1e293b;
}

/* Image Result */
.image-result {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.image-result img {
    max-width: 100%;
    max-height: 60vh;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

/* Loading */
.spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #64748b;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .sidebar {
        width: 100%;
        position: absolute;
        inset: 0;
        transition: transform 0.3s ease;
    }

    .sidebar.mobile-hidden {
        transform: translateX(-100%);
    }

    .main-content {
        position: absolute;
        inset: 0;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        z-index: 20;
    }

    .main-content.mobile-visible {
        transform: translateX(0);
    }

    .mobile-nav {
        display: flex;
    }

    .tabs-header {
        padding: 0 12px;
        overflow-x: auto;
    }

    .tab-btn {
        padding: 12px 16px;
        white-space: nowrap;
    }
}
</style>

