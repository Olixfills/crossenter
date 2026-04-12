import { useState, useEffect } from "react";
import ControlPanel from "./windows/ControlPanel";
import MainOutput from "./windows/MainOutput";
import StageDisplay from "./windows/StageDisplay";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — App Root
// Uses URL hash to route to the correct Electron window view.
//   #control  → 3-pane Control Panel (default)
//   #output   → Projector / Main Output
//   #stage    → Stage Display Monitor
// ─────────────────────────────────────────────────────────────────────────────

type WindowType = "control" | "output" | "stage";

function getWindowType(): WindowType {
  const hash = window.location.hash.replace("#", "")?.toLowerCase();
  if (hash === "output") return "output";
  if (hash === "stage") return "stage";
  return "control";
}

import ErrorBoundary from "./components/common/ErrorBoundary";

export default function App() {
  const [windowType, setWindowType] = useState<WindowType>(getWindowType);

  useEffect(() => {
    const onHashChange = () => setWindowType(getWindowType());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <ErrorBoundary>
      {(() => {
        switch (windowType) {
          case "output":
            return <MainOutput />;
          case "stage":
            return <StageDisplay />;
          default:
            return <ControlPanel />;
        }
      })()}
    </ErrorBoundary>
  );
}
