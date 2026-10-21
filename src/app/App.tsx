import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { initAuth } from '../features/auth/authStore'
import { usePaletteSync } from '../theme/usePalette'
import { prefetchWords } from '../game/words/loader'
import { useSettings } from '../features/settings/settingsStore'
import { TipProvider } from '../ui'
import { InkFilters } from './InkFilters'
import { Layout } from './Layout'
import PlayPage from './PlayPage'

const LeaderboardPage = lazy(() => import('../features/leaderboard/LeaderboardPage'))
const ProfilePage = lazy(() => import('../features/profile/ProfilePage'))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage'))

function useBoot() {
  usePaletteSync()
  useEffect(() => {
    const { language, tier } = useSettings.getState()
    prefetchWords(language, tier)
    const ready = setTimeout(() => (document.documentElement.dataset.ready = 'true'), 300)
    const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300))
    idle(() => initAuth())
    return () => clearTimeout(ready)
  }, [])
}

export default function App() {
  useBoot()
  return (
    <BrowserRouter>
      <TipProvider>
        <InkFilters />
        <Layout>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<PlayPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<PlayPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </TipProvider>
    </BrowserRouter>
  )
}
