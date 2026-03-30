<template>
  <a :href="repo.url" target="_blank" rel="noopener noreferrer" class="repo-card">
    <div class="repo-header">
      <span class="repo-name">{{ repo.name }}</span>
      <span class="repo-stars">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
        {{ formatStars(repo.stars) }}
      </span>
    </div>
    <div class="repo-desc">{{ repo.description }}</div>
  </a>
</template>

<script setup>
defineProps({
  repo: {
    type: Object,
    required: true
  }
})

function formatStars(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num
}
</script>

<style scoped>
.repo-card {
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

.repo-card:hover {
  border: 2px solid var(--accent);
  padding: 11px 13px;
}

.repo-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.repo-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-stars {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--fg-muted);
  flex-shrink: 0;
}

.repo-desc {
  font-size: 12px;
  color: var(--fg-muted);
  line-height: 1.4;
  margin-top: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 700px) {
  .repo-card {
    padding: 10px 12px;
    min-height: 60px;
  }

  .repo-name {
    font-size: 12px;
  }

  .repo-stars {
    font-size: 11px;
  }

  .repo-desc {
    font-size: 11px;
    margin-top: 4px;
  }
}
</style>