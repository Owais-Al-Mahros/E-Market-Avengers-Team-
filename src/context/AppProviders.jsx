// src/context/AppProviders.jsx
import { ProductProvider } from "./ProductContext";
import { CategoryProvider } from "./CategoryContext";
import { SubcategoryProvider } from "./SubcategoryContext";
import { CartProvider } from "./CartContext";
import { OrdersProvider } from "./OrdersContext";
import { ShippingSettingsProvider } from "./ShippingSettingsContext";
import { PricingProvider } from "./PricingContext";
import { CompanyProvider } from "./CompanyContext";
import { FavoriteProvider } from "./FavoriteContext";
import { MyInfoProvider } from "./MyInfoContext";
import { CheckoutProvider } from "./CheckoutContext";
import { WiderrufProvider } from "./WiderrufContext";
import { FaqProvider } from "./FaqContext";
import { MessagesProvider } from "./MessagesContext";
import { FeaturedProvider } from "./FeaturedContext";

//  الترتيب مهم! من الخارج للداخل
const providers = [
  ProductProvider,
  CategoryProvider,
  SubcategoryProvider,
  CartProvider,
  OrdersProvider,
  ShippingSettingsProvider,
  PricingProvider,
  CompanyProvider,
  FavoriteProvider,
  MyInfoProvider,
  CheckoutProvider,
  FaqProvider,           // ← جديد
  MessagesProvider,
  WiderrufProvider,
  FeaturedProvider,
];

export function AppProviders({ children }) {
  return providers.reduceRight(
    (acc, Provider) => <Provider>{acc}</Provider>,
    children
  );
}