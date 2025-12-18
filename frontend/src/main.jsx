//frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.6)",
            color: "#1111",
            fontSize: "13px",
          },
        }} />
      </AuthProvider>
    </BrowserRouter>
    </>
  </React.StrictMode>
);
