import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppStateProvider } from './context/AppState'
import App from './App'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
 <React.StrictMode>
 <BrowserRouter>
 <AppStateProvider>
 <App />
 </AppStateProvider>
 </BrowserRouter>
 </React.StrictMode>
)
