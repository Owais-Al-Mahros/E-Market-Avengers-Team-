import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { ProductProvider } from './context/ProductContext.jsx'
import { CategoryProvider } from './context/CategoryContext.jsx'
import { SubcategoryProvider } from './context/SubcategoryContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ProductProvider>
      <CategoryProvider>
        <SubcategoryProvider>
          <App />
        </SubcategoryProvider>
      </CategoryProvider>

    </ProductProvider>
  </BrowserRouter>,
)
