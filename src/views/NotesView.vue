<template>
  <CollectionPage
    :items="notes"
    type="note"
    title="笔记"
    file-name="notes.json"
    :loading="loading"
    :error="error"
    empty-text="这里还没有笔记；通过 /note 保存第一条笔记。"
    group-by-month
  />
</template>

<script setup>
import { useContent } from '../composables/useContent'
import CollectionPage from '../components/CollectionPage.vue'

const { notes, loading, error } = useContent()
</script>
