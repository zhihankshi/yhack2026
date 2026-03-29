import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App.jsx";

const AUTH0_DOMAIN    = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE  = import.meta.env.VITE_AUTH0_AUDIENCE || "https://alibi-api";

const root = createRoot(document.getElementById("root"));

// If Auth0 credentials are configured, wrap with the provider.
// Otherwise render the app directly — it will run in demo mode.
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
        <App />
      </Auth0Provider>
    </StrictMode>
  );
} else {
  // No Auth0 config — render without the provider.
  // App.jsx detects this and skips token fetching entirely.
  root.render(
    <StrictMode>
      <App authless />
    </StrictMode>
  );
}
