import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";

if (import.meta.env.DEV) {
  const { instrumentViewTransitions } = await import("./devViewTransitions");
  instrumentViewTransitions();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
