import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthProvider";
import { CustomThemeProvider } from "./contexts/ThemeProvider"; // Import CustomThemeProvider
import "./index.css";
import { router } from "./routes";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <CustomThemeProvider>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </CustomThemeProvider>
  //  </React.StrictMode>
);
