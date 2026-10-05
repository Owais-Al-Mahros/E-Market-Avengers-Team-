// main.jsx — الآن 15 سطر!
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./context/AppProviders.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AppProviders>
      <App />
    </AppProviders>
  </BrowserRouter>
);