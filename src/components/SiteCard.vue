<template>
  <a :href="site.url" target="_blank" rel="noopener noreferrer" class="site-card">
    <div class="site-title">{{ site.title }}</div>
    <div class="site-desc">{{ site.description }}</div>
  </a>
</template>

<script setup>
defineProps({
  site: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.site-card {
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  min-height: 72px;
  background: linear-gradient(135deg, var(--bg-card-start) 0%, var(--bg-card-end) 100%);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s ease;
}

.site-card:hover {
  border: 2px solid var(--accent);
  padding: 11px 13px;
}

.site-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.site-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--fg);
  line-height: 1.3;
}

.site-desc {
  font-size: 12px;
  color: var(--fg-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>