import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.jsx";
import NotFound from "./pages/NotFound.jsx";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE =
  import.meta.env.VITE_AUTH0_AUDIENCE || "https://alibi-api";

const root = createRoot(document.getElementById("root"));

const AUTHLESS = !(AUTH0_DOMAIN && AUTH0_CLIENT_ID);

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/404" element={<NotFound />} />
        <Route path="/" element={<App authless={AUTHLESS} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

if (AUTH0_DOMAIN && AUTH0_CLIENT_ID) {
  root.render(
    <StrictMode>
      <Auth0Provider
        domain={AUTH0_DOMAIN}
        clientId={AUTH0_CLIENT_ID}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: AUTH0_AUDIENCE,
        }}
      >
        <AppRoutes />
      </Auth0Provider>
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <AppRoutes />
    </StrictMode>,
  );
}
