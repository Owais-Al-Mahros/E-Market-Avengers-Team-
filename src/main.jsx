import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { ProductProvider } from './context/ProductContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ProductProvider>
      <App />
    </ProductProvider>
  </BrowserRouter>,
)
