// main.jsx — الآن 15 سطر!
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/readex-pro/500.css";
import "@fontsource/readex-pro/700.css";
import "@fontsource-variable/material-symbols-outlined";
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