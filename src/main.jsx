import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { ProductProvider } from './context/ProductContext.jsx'
import { CategoryProvider } from './context/CategoryContext.jsx'
import { SubcategoryProvider } from './context/SubcategoryContext.jsx'
import { CartProvider } from './context/CartContext.jsx' // ✅ استيراد Cart

import './index.css';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ProductProvider>
      <CategoryProvider>
        <SubcategoryProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SubcategoryProvider>
      </CategoryProvider>

    </ProductProvider>
  </BrowserRouter>,
)
