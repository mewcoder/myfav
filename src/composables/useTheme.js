import { ref } from 'vue'

const initial = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
const theme = ref(initial)
document.documentElement.dataset.theme = initial

export function useTheme() {
  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = theme.value
    localStorage.setItem('theme', theme.value)
  }
  return { theme, toggleTheme }
}
