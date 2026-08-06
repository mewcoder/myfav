<template><CollectionPage :items="sites" type="site" title="网站" file-name="sites.json" :loading="loading" :error="error" empty-text="这里还没有收藏的网站" /></template>
<script setup>
import { useContent } from '../composables/useContent'
import CollectionPage from '../components/CollectionPage.vue'
const { sites, loading, error } = useContent()
</script>
