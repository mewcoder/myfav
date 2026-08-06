<template>
  <dialog ref="dialog" class="modal settings-modal" aria-labelledby="ai-settings-title" @cancel.prevent="close" @close="dialogClosed">
    <form class="settings-form" @submit.prevent="saveConfig">
      <header class="modal-heading"><div><p class="eyebrow">Optional enhancement</p><h2 id="ai-settings-title">AI 设置</h2></div><button type="button" class="icon-button" aria-label="关闭 AI 设置" @click="close">×</button></header>
      <p class="privacy-note">使用你自己的 OpenAI-compatible Chat Completions。API Key 默认只保存在当前 tab；浏览器页面中的密钥并不是真正的服务器秘密。</p>
      <label for="base-url">API Base URL</label>
      <input id="base-url" ref="baseInput" v-model="draft.baseUrl" type="url" placeholder="https://api.openai.com/v1" required :readonly="testing" />
      <label for="api-key">API Key</label>
      <input id="api-key" ref="keyInput" v-model="draft.apiKey" type="password" :placeholder="configured ? '••••••••（留空表示不替换）' : 'sk-…'" :required="!configured" :readonly="testing" autocomplete="off" />
      <label for="model">Model</label>
      <input id="model" ref="modelInput" v-model="draft.model" type="text" placeholder="model-name" required :readonly="testing" />
      <label class="remember-option" for="remember-key"><input id="remember-key" v-model="draft.rememberKey" type="checkbox" :disabled="testing" /><span>在此设备保存密钥<small>任何能读取本页面存储的脚本都可能访问它。</small></span></label>
      <p class="form-status" role="status">{{ status }}</p>
      <footer class="modal-actions"><button type="button" class="quiet-button" :disabled="testing" @click="clearConfig">清除配置</button><button type="button" class="quiet-button" :disabled="testing" @click="testConfig">{{ testing ? '正在连接…' : '测试连接' }}</button><button class="primary-button" type="submit" :disabled="testing">保存</button></footer>
    </form>
  </dialog>
</template>

<script setup>
import { nextTick, reactive, ref, watch } from 'vue'
import { chatCompletion } from '../lib/aiClient'
import { isAllowedAIBaseUrl, normalizeAIConfig } from '../lib/aiConfig'
import { useAIConfig } from '../composables/useAIConfig'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close', 'saved'])
const dialog = ref(null)
const baseInput = ref(null)
const keyInput = ref(null)
const modelInput = ref(null)
const status = ref('')
const testing = ref(false)
const controller = ref(null)
const { config, configured, save, clear } = useAIConfig()
const draft = reactive({ baseUrl: '', apiKey: '', model: '', rememberKey: false })
let returnFocus = null

watch(() => props.open, async (open) => {
  if (open && !dialog.value?.open) {
    Object.assign(draft, { baseUrl: config.value.baseUrl, apiKey: '', model: config.value.model, rememberKey: config.value.rememberKey })
    status.value = configured.value ? '配置已就绪' : '当前未配置'
    returnFocus = document.activeElement
    dialog.value.showModal()
    await nextTick()
    const firstInvalid = [
      { input: baseInput.value, invalid: !isAllowedAIBaseUrl(draft.baseUrl) },
      { input: keyInput.value, invalid: !resolvedDraft().apiKey },
      { input: modelInput.value, invalid: !draft.model.trim() },
    ].find((entry) => entry.input && entry.invalid)?.input
    const initialFocus = firstInvalid || baseInput.value
    initialFocus?.focus()
  } else if (!open && dialog.value?.open) dialog.value.close()
})

function resolvedDraft() {
  return { ...draft, apiKey: draft.apiKey || config.value.apiKey }
}

function saveConfig() {
  try {
    save(resolvedDraft())
    status.value = '配置已保存'
    emit('saved')
  } catch (error) {
    status.value = error.message
  }
}

async function testConfig() {
  controller.value?.abort()
  controller.value = new AbortController()
  testing.value = true
  status.value = '正在连接…'
  try {
    const testConfiguration = normalizeAIConfig(resolvedDraft())
    await chatCompletion({ config: testConfiguration, messages: [{ role: 'user', content: 'OK' }], signal: controller.value.signal, stream: false, maxTokens: 1 })
    status.value = '连接成功'
  } catch (error) {
    status.value = error.message
  } finally {
    testing.value = false
  }
}

function clearConfig() {
  controller.value?.abort()
  clear()
  Object.assign(draft, { baseUrl: '', apiKey: '', model: '', rememberKey: false })
  status.value = 'AI 配置与会话缓存已清除'
}

function close() {
  controller.value?.abort()
  if (dialog.value?.open) dialog.value.close()
}

function dialogClosed() {
  returnFocus?.focus()
  returnFocus = null
  emit('close')
}
</script>
