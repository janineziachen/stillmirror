<template>
  <div class="poster-overlay" @click.self="$emit('close')">

    <!-- Phase 1: 签名填写 -->
    <div v-if="phase === 'sign'" class="sign-panel">
      <p class="sign-title">为你的花园签名</p>

      <div class="sign-avatar-area" @click="triggerUpload">
        <img v-if="avatarUrl" :src="avatarUrl" class="sign-avatar-preview" />
        <span v-else class="sign-avatar-placeholder">+</span>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          style="display:none"
          @change="onFileChange"
        />
      </div>
      <p class="sign-avatar-hint">点击上传头像（可选）</p>

      <input
        v-model="userName"
        class="sign-name-input"
        placeholder="你的名字（可选）"
        maxlength="12"
      />

      <div class="sign-actions">
        <button class="save-btn" @click="goPreview">生成卡片</button>
        <button class="save-btn secondary" @click="$emit('close')">取消</button>
      </div>
    </div>

    <!-- Phase 2: 卡片预览 -->
    <template v-if="phase === 'preview'">
      <div class="poster-card" ref="posterRef">
        <img :src="imageSrc" class="poster-main-image" @error="onImgError" />

        <!-- 签名区：主图与磨砂区交界右侧 -->
        <div v-if="avatarUrl || userName" class="poster-signature">
          <img v-if="avatarUrl" :src="avatarUrl" class="poster-avatar" />
          <span v-if="userName" class="poster-username">{{ userName }}</span>
        </div>

        <div class="poster-frosted-area">
          <img :src="imageSrc" class="poster-blur-image" @error="onImgError" />
          <div class="poster-frosted-tint"></div>
          <div class="poster-text-area">
            <p class="poster-text">{{ posterText }}</p>
            <p class="poster-brand">心镜 · 四季花园</p>
          </div>
        </div>
      </div>

      <div class="poster-actions">
        <button class="save-btn" @click="downloadPoster">保存图片</button>
        <button class="save-btn secondary" @click="phase = 'sign'">返回修改</button>
        <button class="save-btn secondary" @click="$emit('close')">关闭</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import html2canvas from 'html2canvas'

const props = defineProps({
  panoramaType: { type: String, required: true },
  posterText: { type: String, required: true }
})

defineEmits(['close'])

const phase = ref('sign')
const posterRef = ref(null)
const fileInput = ref(null)
const avatarUrl = ref('')
const userName = ref('')

const imageSrc = computed(() => `/assets/garden/poster-${props.panoramaType}.png`)

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { avatarUrl.value = reader.result }
  reader.readAsDataURL(file)
}

function goPreview() {
  phase.value = 'preview'
}

function onImgError(e) {
  e.target.src = `/assets/garden/panorama-${props.panoramaType}.png`
}

async function downloadPoster() {
  if (!posterRef.value) return
  const canvas = await html2canvas(posterRef.value, {
    scale: 2,
    backgroundColor: '#0A0A0A',
    useCORS: true,
    allowTaint: true
  })
  const link = document.createElement('a')
  link.download = '心镜-我的花园.png'
  link.href = canvas.toDataURL('image/png')
  link.click()
}
</script>

<style scoped>
.poster-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  animation: fadeIn 0.5s var(--ease-gentle);
}

/* === 签名表单 === */
.sign-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  width: 280px;
}

.sign-title {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
}

.sign-avatar-area {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.3s;
}

.sign-avatar-area:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.sign-avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sign-avatar-placeholder {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.4);
}

.sign-avatar-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.sign-name-input {
  width: 100%;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  text-align: center;
  outline: none;
  transition: border-color 0.3s;
}

.sign-name-input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

.sign-name-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.sign-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

/* === 卡片预览 === */
.poster-card {
  width: 320px;
  aspect-ratio: 9 / 16;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.poster-main-image {
  width: 100%;
  height: 82%;
  object-fit: cover;
  object-position: center top;
  display: block;
  flex-shrink: 0;
}

/* 签名区：跨在主图和磨砂区交界处右侧 */
.poster-signature {
  position: absolute;
  right: 16px;
  top: calc(82% - 32px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 5;
}

.poster-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.poster-username {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  letter-spacing: 0.5px;
}

.poster-frosted-area {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.poster-blur-image {
  position: absolute;
  inset: -20px;
  width: calc(100% + 40px);
  height: calc(100% + 40px);
  object-fit: cover;
  object-position: center 80%;
  filter: blur(18px) brightness(0.85);
}

.poster-frosted-tint {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.18);
}

.poster-text-area {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 24px 8px;
  gap: 10px;
}

.poster-text {
  font-family: var(--font-narrative);
  font-weight: 300;
  font-size: 14px;
  line-height: 1.9;
  color: rgba(255, 255, 255, 0.95);
  text-align: center;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
  white-space: pre-line;
}

.poster-brand {
  font-family: var(--font-hint);
  font-size: 11px;
  letter-spacing: 2.5px;
  color: rgba(255, 255, 255, 0.55);
}

.poster-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.save-btn.secondary {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.save-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}
</style>
