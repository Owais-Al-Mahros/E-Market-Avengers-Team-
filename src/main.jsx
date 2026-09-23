import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ProductProvider } from "./context/ProductContext.jsx";
import { CategoryProvider } from "./context/CategoryContext.jsx";
import { SubcategoryProvider } from "./context/SubcategoryContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { OrdersProvider } from "./context/OrdersContext.jsx";
import { ShippingSettingsProvider } from "./context/ShippingSettingsContext.jsx";
import { PricingProvider } from "./context/PricingContext.jsx";
import { CompanyProvider } from "./context/CompanyContext.jsx";
import { FavoriteProvider } from "./context/FavoriteContext.jsx";
import { MyInfoProvider } from "./context/MyInfoContext.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ProductProvider>
      <CategoryProvider>
        <SubcategoryProvider>
          <CartProvider>
            <OrdersProvider>
              <ShippingSettingsProvider>
                <PricingProvider>
                  <CompanyProvider>
                    <FavoriteProvider>
                      <MyInfoProvider>
                        <App />
                      </MyInfoProvider>
                    </FavoriteProvider>
                  </CompanyProvider>
                </PricingProvider>
              </ShippingSettingsProvider>
            </OrdersProvider>
          </CartProvider>
        </SubcategoryProvider>
      </CategoryProvider>
    </ProductProvider>
  </BrowserRouter>,
);
