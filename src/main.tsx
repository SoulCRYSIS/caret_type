import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fraunces/wght-italic.css'
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import '@fontsource/ibm-plex-sans-thai-looped/400.css'
import '@fontsource/ibm-plex-sans-thai-looped/500.css'
import '@fontsource/noto-serif-thai/400.css'
import '@fontsource/shojumaru/400.css'
import './theme/global.css'
import { applyStoredPalette } from './theme/usePalette'
import App from './app/App'

applyStoredPalette()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
