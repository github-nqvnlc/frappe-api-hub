import { FrappeProvider } from 'frappe-react-sdk'
import './styles.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { ApiHubPage } from './pages/api-hub-page'

function App() {
  return (
    <FrappeProvider enableSocket={false}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <ApiHubPage />
      </ThemeProvider>
    </FrappeProvider>
  )
}

export default App
