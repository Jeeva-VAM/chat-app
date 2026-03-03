
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
  <GoogleOAuthProvider clientId="617275604607-u93o7rsne5bvqcencr028l5rb5hisk5d.apps.googleusercontent.com">
    <BrowserRouter>
      <AuthProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </AuthProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
  </Provider>
);
