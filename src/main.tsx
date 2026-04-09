import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
// 1️⃣ Create a theme object
const theme = extendTheme({}); // default theme

// 2️⃣ Wrap your app with ChakraProvider and pass the theme
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
      <Analytics />
      <SpeedInsights />
    </ChakraProvider>
  </React.StrictMode>,
);
