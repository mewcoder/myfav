<template><CollectionPage :items="aiDaily" type="ai-daily" title="AI 日报" file-name="ai-daily.json" :loading="loading" :error="error" empty-text="这里还没有 AI 日报。" /></template>
<script setup>
import { useContent } from '../composables/useContent'
import CollectionPage from '../components/CollectionPage.vue'
const { aiDaily, loading, error } = useContent()
</script>
