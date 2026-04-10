import { useEffect, useRef } from "react";
import { useEditorStore } from "../../data/editorStore";
import { usePresentationStore } from "../../data/presentationStore";
import Filmstrip from "./Filmstrip";
import Canvas from "./Canvas";
import PropertiesSidebar from "./PropertiesSidebar";

export default function EditorLayout() {
  const { draftShow, draftSlides, localStyles } = useEditorStore();
  const { refreshActiveShow } = usePresentationStore();

  // Use refs to keep the latest state for the unmount cleanup
  const stateRef = useRef({ draftShow, draftSlides, localStyles });
  const refreshRef = useRef(refreshActiveShow);

  useEffect(() => {
    stateRef.current = { draftShow, draftSlides, localStyles };
    refreshRef.current = refreshActiveShow;
  }, [draftShow, draftSlides, localStyles, refreshActiveShow]);

  useEffect(() => {
    // This effect runs only once on mount and unmount
    return () => {
      const { draftShow, draftSlides, localStyles } = stateRef.current;
      const refresh = refreshRef.current;

      if (!draftShow) return;

      console.log("[Autosave] Component unmounting. Saving draft...");
      window.crossenter
        .saveDraftSlides(draftShow.id, draftSlides, localStyles)
        .then(() => {
          console.log("[Autosave] Draft saved successfully.");
          return refresh();
        })
        .catch((err: any) => console.error("[Autosave] Failed:", err));
    };
  }, []); // Empty deps = run on unmount ONLY

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden animate-in fade-in duration-500">
      <Filmstrip />
      <Canvas />
      <PropertiesSidebar />
    </div>
  );
}
