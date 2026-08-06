<template>
  <section class="article-notes" aria-labelledby="notes-heading">
    <h2 id="notes-heading">笔记</h2>
    <p>GitHub Issues 中的公开笔记将在这里加载。</p>
    <div ref="container" class="utterances-container"></div>
    <p v-if="failed" class="is-error">笔记暂时无法加载。<a href="https://github.com/mewcoder/myfav/issues" target="_blank" rel="noopener noreferrer">前往 GitHub Issues ↗</a></p>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({ theme: { type: String, required: true }, pathname: { type: String, required: true } })
const container = ref(null)
const failed = ref(false)
let timer

function mountUtterances() {
  if (!container.value) return
  window.clearTimeout(timer)
  container.value.replaceChildren()
  failed.value = false
  const script = document.createElement('script')
  script.src = 'https://utteranc.es/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'
  script.setAttribute('repo', 'mewcoder/myfav')
  script.setAttribute('issue-term', 'pathname')
  script.setAttribute('label', 'notes')
  script.setAttribute('theme', props.theme === 'dark' ? 'github-dark' : 'github-light')
  script.onerror = () => { failed.value = true }
  container.value.append(script)
  timer = window.setTimeout(() => {
    if (!container.value?.querySelector('iframe')) failed.value = true
  }, 10_000)
}

onMounted(mountUtterances)
watch(() => [props.pathname, props.theme], mountUtterances)
onBeforeUnmount(() => window.clearTimeout(timer))
</script>
