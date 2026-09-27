import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SpineAnimationProvider } from "./hooks/useSpineAnimation";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <SpineAnimationProvider>
      <App />
    </SpineAnimationProvider>
  </React.StrictMode>,
);
