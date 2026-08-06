<template><CollectionPage :items="repos" type="repo" title="GitHub" file-name="repos.json" :loading="loading" :error="error" empty-text="这里还没有收藏的仓库" /></template>
<script setup>
import { useContent } from '../composables/useContent'
import CollectionPage from '../components/CollectionPage.vue'
const { repos, loading, error } = useContent()
</script>
