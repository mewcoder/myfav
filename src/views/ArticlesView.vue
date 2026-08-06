<template><CollectionPage :items="articles" type="article" title="文章" file-name="articles.json" :loading="loading" :error="error" empty-text="这里还没有文章；通过 fav 收藏后会在这里出现。" /></template>
<script setup>
import { useContent } from '../composables/useContent'
import CollectionPage from '../components/CollectionPage.vue'
const { articles, loading, error } = useContent()
</script>
