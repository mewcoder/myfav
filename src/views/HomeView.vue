<template>
  <section class="home-feed" aria-labelledby="recent-title">
    <header class="section-heading"><h1 id="recent-title">最近收录</h1><span>{{ monthLabel }}</span></header>
    <div v-if="loading" class="text-state">正在读取收藏…</div>
    <div v-else-if="error" class="text-state is-error">{{ error }}</div>
    <div v-else class="collection-list">
      <CollectionRow v-for="record in recent" :key="`${record.type}:${record.url}`" :item="record" show-type />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useContent } from '../composables/useContent'
import CollectionRow from '../components/CollectionRow.vue'

const { records, loading, error } = useContent()
const recent = computed(() => records.value.slice(0, 12))
const monthLabel = computed(() => recent.value[0]?.saveTime?.slice(0, 7).replace('-', ' · ') || '尚无收藏')
</script>
