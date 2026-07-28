import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import theme from "./theme/theme";
import AppGlobalStyles from "./theme/globals";
import { GameProvider } from "./contexts/GameContext";
import RouteFocus from "./components/RouteFocus";
import { routes } from "./routes";

/** Only ever seen on a cold load, while the first route's chunk arrives. */
function RouteFallback() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
      <CircularProgress />
    </Box>
  );
}

// Every route hangs off one layout, which exists solely to route focus on
// navigation. See RouteFocus.
const router = createBrowserRouter([
  { element: <RouteFocus />, HydrateFallback: RouteFallback, children: routes },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppGlobalStyles />
      <GameProvider>
        <RouterProvider router={router} />
      </GameProvider>
    </ThemeProvider>
  );
}
