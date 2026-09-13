import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import { ProductProvider } from './context/ProductContext.jsx'
import { CategoryProvider } from './context/CategoryContext.jsx'
import { SubcategoryProvider } from './context/SubcategoryContext.jsx'
import { CartProvider } from './context/CartContext.jsx' // ✅ استيراد Cart
import { OrdersProvider } from './context/OrdersContext.jsx'
import { ShippingSettingsProvider } from './context/ShippingSettingsContext.jsx' // ✅ جديد
import { PricingProvider } from './context/PricingContext.jsx' // ✅ استيراد الجديد

import './index.css';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ProductProvider>
      <CategoryProvider>
        <SubcategoryProvider>
          <CartProvider>
            <OrdersProvider>
              <ShippingSettingsProvider>
                <PricingProvider>
                  <App />
                </PricingProvider>
              </ShippingSettingsProvider>
            </OrdersProvider>
          </CartProvider>
        </SubcategoryProvider>
      </CategoryProvider>
    </ProductProvider>
  </BrowserRouter>,
)
