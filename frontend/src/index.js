import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const CLERK_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/auth">
      <BrowserRouter>
        <App />
        <Toaster position="top-right" toastOptions={{
          duration: 3500,
          style: { background:"#fff", color:"#111827", borderRadius:"14px", boxShadow:"0 8px 30px rgba(0,0,0,0.12)", fontSize:"14px", padding:"12px 16px" },
          success: { iconTheme: { primary:"#1D9E75", secondary:"#fff" } },
        }}/>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);
