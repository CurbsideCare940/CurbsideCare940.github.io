import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "@/lib/auth";
import { AppViewProvider } from "@/lib/app-context";
import App from "@/App";
import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppViewProvider>
        <App />
      </AppViewProvider>
    </AuthProvider>
  </React.StrictMode>,
);
