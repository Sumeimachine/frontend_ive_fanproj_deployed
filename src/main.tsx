import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react"
// Readability-first theme adjustments for dark UI shells.
const theme = extendTheme({
  styles: {
    global: {
      "input::placeholder, textarea::placeholder": {
        color: "rgba(255, 255, 255, 0.72)",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        _focusVisible: {
          boxShadow: "0 0 0 3px rgba(180, 140, 255, 0.65)",
        },
        _disabled: {
          opacity: 0.72,
          color: "whiteAlpha.900",
          borderColor: "whiteAlpha.400",
          bg: "whiteAlpha.200",
          cursor: "not-allowed",
        },
      },
      variants: {
        outline: {
          color: "whiteAlpha.950",
          borderColor: "whiteAlpha.700",
          bg: "transparent",
          _hover: {
            bg: "whiteAlpha.180",
            borderColor: "whiteAlpha.900",
          },
          _active: {
            bg: "whiteAlpha.220",
            borderColor: "purple.200",
          },
        },
        ghost: {
          color: "whiteAlpha.900",
          _hover: {
            bg: "whiteAlpha.180",
          },
          _active: {
            bg: "whiteAlpha.240",
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            color: "white",
            borderColor: "whiteAlpha.500",
            _placeholder: { color: "whiteAlpha.700" },
            _hover: { borderColor: "whiteAlpha.700" },
            _focusVisible: {
              borderColor: "purple.300",
              boxShadow: "0 0 0 1px rgba(196, 146, 255, 0.75)",
            },
            _disabled: {
              opacity: 0.75,
              color: "whiteAlpha.900",
              borderColor: "whiteAlpha.500",
              bg: "whiteAlpha.200",
            },
          },
        },
      },
    },
    Textarea: {
      variants: {
        outline: {
          color: "white",
          borderColor: "whiteAlpha.500",
          _placeholder: { color: "whiteAlpha.700" },
          _hover: { borderColor: "whiteAlpha.700" },
          _focusVisible: {
            borderColor: "purple.300",
            boxShadow: "0 0 0 1px rgba(196, 146, 255, 0.75)",
          },
          _disabled: {
            opacity: 0.75,
            color: "whiteAlpha.900",
            borderColor: "whiteAlpha.500",
            bg: "whiteAlpha.200",
          },
        },
      },
    },
    Select: {
      variants: {
        outline: {
          field: {
            color: "white",
            borderColor: "whiteAlpha.500",
            _hover: { borderColor: "whiteAlpha.700" },
            _focusVisible: {
              borderColor: "purple.300",
              boxShadow: "0 0 0 1px rgba(196, 146, 255, 0.75)",
            },
          },
        },
      },
    },
  },
});

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
