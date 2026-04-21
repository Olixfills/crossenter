import React, { useState, useEffect, useRef } from "react";
import { usePresentationStore } from "../data/presentationStore";
import { useFontLoader } from "../hooks/useFontLoader";
import { resolveMediaUrl } from "../utils/url";

// ─────────────────────────────────────────────────────────────────────────────
// Crossenter — Stage Display Engine (Full Aesthetic Integration)
// ─────────────────────────────────────────────────────────────────────────────

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function formatTimer(seconds: number) {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function resolveTemplateBg(
  bgType: string | null,
  bgValue: string | null,
): React.CSSProperties {
  if (!bgType || !bgValue) return {};
  if (bgType === "color" || bgType === "gradient")
    return { background: bgValue };
  return {};
}

export default function StageDisplay() {
  const clock = useClock();
  const videoRef = useRef<HTMLVideoElement>(null);
  const {
    liveSlide,
    liveNextSlide,
    stageMessage,
    stageTimerRemaining,
    isBlanked,
    textStyles,
    activeMedia,
    playbackMode,
    mediaLoop,
    globalBlankType,
    globalBlankValue,

    // Phase 10: Alerts
    activeAlertText,
    alertBgColor,
    alertTextColor,
    alertScrollSpeed,
    stageTimerFontFamily,
  } = usePresentationStore();

  // Load the active font family to ensure branding consistency
  useFontLoader(textStyles?.fontFamily);
  useFontLoader(stageTimerFontFamily);

  // --- WebSocket Media Sync Logic (Mirroring MainOutput) ---
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "MEDIA_COMMAND" && videoRef.current) {
          const video = videoRef.current;
          switch (msg.command) {
            case "PLAY":
              video.play();
              break;
            case "PAUSE":
              video.pause();
              break;
            case "SEEK":
              video.currentTime = msg.payload;
              break;
            case "STOP":
              video.pause();
              video.currentTime = 0;
              break;
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, []);

  const current = liveSlide;
  const next = liveNextSlide;

  const { templateBgType, templateBgValue } = textStyles;
  const templateCssBg = resolveTemplateBg(
    templateBgType,
    templateBgValue ?? null,
  );
  const shadowStr = `${textStyles.textShadowX}px ${textStyles.textShadowY}px ${textStyles.textShadowBlur}px ${textStyles.textShadowColor}`;

  return (
    <div
      className="w-full h-full bg-black text-white overflow-hidden flex flex-col px-10 py-6 select-none relative"
      style={{
        fontFamily: textStyles?.fontFamily || "Inter, sans-serif",
        ...templateCssBg,
      }}
    >
      {/* ── Background/Media Layer (z-0) ── */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isBlanked ? "opacity-0" : "opacity-100"} ${playbackMode === "foreground" ? "z-[5]" : "z-0"}`}
      >
        {activeMedia &&
          (activeMedia.type === "video" ? (
            <video
              ref={videoRef}
              key={activeMedia.url}
              src={resolveMediaUrl(activeMedia.url)}
              autoPlay
              loop={mediaLoop}
              muted={true} // Stage is always muted to avoid feedback
              className={`w-full h-full object-cover animate-in fade-in duration-1000`}
            />
          ) : (
            <img
              key={activeMedia.url}
              src={resolveMediaUrl(activeMedia.url)}
              className="w-full h-full object-cover animate-in fade-in duration-1000"
              alt=""
            />
          ))}
      </div>

      {/* ── Visual Polish: Dark Vignette Layer (z-1) ── */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* 1. Header: Clocks & Timers (z-10) */}
      <div className="flex justify-between items-center mb-2 shrink-0 z-20 w-full">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 flex flex-col items-start shadow-2xl">
          <span className="text-gray-400 text-[11px] uppercase font-black tracking-[0.3em] mb-1.5 opacity-80">
            Local Time
          </span>
          <span className="text-6xl font-black text-green-500 tabular-nums leading-none tracking-tighter" style={{ fontFamily: `"${stageTimerFontFamily || 'JetBrains Mono'}", monospace` }}>
            {clock.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-5 flex flex-col items-end shadow-2xl">
          <span className="text-gray-400 text-[11px] uppercase font-black tracking-[0.3em] mb-1.5 opacity-80">
            Remaining
          </span>
          <span
            className={`text-6xl font-black tabular-nums leading-none tracking-tighter ${stageTimerRemaining < 60 && stageTimerRemaining > 0 ? "animate-pulse text-red-500" : "text-red-600"}`}
            style={{ fontFamily: `"${stageTimerFontFamily || 'JetBrains Mono'}", monospace` }}
          >
            {formatTimer(stageTimerRemaining)}
          </span>
        </div>
      </div>

      {/* 2. Main Area: Current Slide (Full Visual Fidelity) */}
      <div className="flex-1 flex flex-col justify-center min-h-0 relative z-10">
        <div className="text-gray-400/50 text-[10px] uppercase font-black mb-1 tracking-[0.6em] shrink-0 text-center drop-shadow-md">
          Live Now
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {current ? (
            <div
              className={`text-center leading-snug drop-shadow-2xl transition-all duration-700 animate-in fade-in zoom-in-95`}
              style={{
                fontSize: "clamp(32px, 8vh, 85px)",
                whiteSpace: "pre-line",
                color: textStyles.color,
                fontWeight: textStyles?.fontWeight || "900",
                textAlign: (textStyles?.textAlign as any) || "center",
                textShadow: shadowStr,
                padding: "2rem",
              }}
            >
              {current.text || ""}
            </div>
          ) : (
            <div className="text-gray-400 text-4xl font-black italic tracking-[0.3em] uppercase opacity-10">
              Standby
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Area: Next Slide (Integrated Glass Section) */}
      <div className="h-[20%] mt-2 flex flex-col justify-end shrink-0 relative z-20 overflow-hidden">
        <div className="bg-black/40 backdrop-blur-3xl rounded-[32px] px-10 py-8 border border-white/10 flex flex-col items-start relative shadow-2xl h-full">
          <div className="absolute top-4 left-10 text-gray-400 text-[10px] uppercase font-black tracking-[0.6em] italic opacity-50 z-20">
            Upcoming Next Step →
          </div>
          <div className="w-full h-full mt-4 overflow-y-auto pr-4 scrollbar-hide">
            {next ? (
              <div
                className="text-white/60 font-bold leading-tight text-left italic"
                style={{
                  fontSize: "clamp(16px, 3.2vh, 32px)",
                  whiteSpace: "pre-line",
                }}
              >
                {next.text || "— Blank Step —"}
              </div>
            ) : (
              <div className="text-gray-600 text-2xl font-black lowercase tracking-widest opacity-20 mt-2">
                // end of current sequence
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Stage Message Overlay (Critical Interrupt) */}
      {stageMessage && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-12 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full bg-red-600 shadow-[0_0_200px_rgba(220,38,38,0.8)] border-y-[16px] border-white flex items-center justify-center py-24 px-12 rotate-[-1deg]">
            <span
              className="text-white font-black uppercase tracking-tighter text-center leading-[0.85] drop-shadow-2xl"
              style={{ fontSize: "clamp(40px, 12vw, 140px)" }}
            >
              {stageMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Alert Layer (Phase 10) ── */}
      {activeAlertText && (
        <div
          className="absolute bottom-0 left-0 right-0 py-4 px-6 z-[75] overflow-hidden flex items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5 backdrop-blur-md"
          style={{ backgroundColor: alertBgColor }}
        >
          <div
            className="whitespace-nowrap animate-marquee flex items-center gap-12"
            style={{ animationDuration: alertScrollSpeed }}
          >
            <p
              className="text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-8"
              style={{ color: alertTextColor }}
            >
              <span>{activeAlertText}</span>
              <span className="opacity-30">•</span>
              <span>{activeAlertText}</span>
              <span className="opacity-30">•</span>
              <span>{activeAlertText}</span>
              <span className="opacity-30">•</span>
            </p>
          </div>
        </div>
      )}

      {/* Output Blanked Warning */}
      {isBlanked && (
        <div className="absolute bottom-12 left-12 z-[110] bg-orange-600 text-white px-8 py-2 rounded-xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl border-2 border-white/20 animate-pulse pointer-events-none">
          Live Blanked
        </div>
      )}

      {/* 5. Global Blank Overlay (Syncing with Main Output) */}
      <div
        className={`absolute inset-0 z-[90] transition-opacity duration-700 bg-black ${isBlanked ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{
          ...(globalBlankType === "color" && {
            backgroundColor: globalBlankValue,
          }),
          ...(globalBlankType === "gradient" && {
            backgroundImage: globalBlankValue,
          }),
        }}
      >
        {globalBlankType === "image" && isBlanked && (
          <img
            src={resolveMediaUrl(globalBlankValue)}
            className="w-full h-full object-cover"
            alt="Blank"
          />
        )}
      </div>
    </div>
  );
}
