import { createRouter, createWebHashHistory } from 'vue-router'
import SitesView from '../views/SitesView.vue'
import ReposView from '../views/ReposView.vue'

const routes = [
  { path: '/', redirect: '/sites' },
  { path: '/sites', component: SitesView },
  { path: '/repos', component: ReposView }
]

const router = createRouter({
  history: createWebHashHistory('/myfav/'),
  routes
})

export default router