import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SitesView from '../views/SitesView.vue'
import ReposView from '../views/ReposView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import ArticleView from '../views/ArticleView.vue'
import AIDailyView from '../views/AIDailyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/sites', name: 'sites', component: SitesView },
    { path: '/repos', name: 'repos', component: ReposView },
    { path: '/articles', name: 'articles', component: ArticlesView },
    { path: '/articles/:month/:slug', name: 'article', component: ArticleView },
    { path: '/ai-daily', name: 'ai-daily', component: AIDailyView },
    { path: '/ai-daily/:date', name: 'ai-daily-entry', component: ArticleView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior(to) {
    if (to.hash) return { el: to.hash, top: 88, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
