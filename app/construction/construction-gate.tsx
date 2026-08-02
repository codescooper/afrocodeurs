"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

import styles from "./construction.module.css";

const WHATSAPP_URL = "https://chat.whatsapp.com/BfD3XW8X48ACQN5V8XkBye";
type RiddleSymbol = "baobab" | "laptop" | "sun" | "logo";

function PixelScene({ hoveredSymbol }: { hoveredSymbol: RiddleSymbol | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoveredSymbolRef = useRef<RiddleSymbol | null>(hoveredSymbol);

  useEffect(() => {
    hoveredSymbolRef.current = hoveredSymbol;
  }, [hoveredSymbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    let frame = 0;
    let raf = 0;

    const rect = (x: number, y: number, w: number, h: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), w, h);
    };

    const draw = () => {
      frame += 1;
      const t = (frame % 720) / 720;
      const transformed = Math.max(0, Math.min(1, (t - 0.35) * 2.7));
      const hoverStep = Math.floor(frame / 7) % 2 === 0 ? -1 : 1;
      const sunShift = hoveredSymbolRef.current === "sun" ? hoverStep : 0;
      const treeShift = hoveredSymbolRef.current === "baobab" ? hoverStep : 0;
      const laptopShift = hoveredSymbolRef.current === "laptop" ? hoverStep : 0;
      const sky = ctx.createLinearGradient(0, 0, 0, 180);
      sky.addColorStop(0, transformed < .5 ? "#431e2d" : "#0c3851");
      sky.addColorStop(1, transformed < .5 ? "#f0a34b" : "#4f9f9c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 320, 180);
      rect(252 + sunShift, 22 - sunShift, 25, 25, transformed < .5 ? "#f2b544" : "#72e8ef");
      rect(256 + sunShift, 18 - sunShift, 17, 33, transformed < .5 ? "#f2b544" : "#72e8ef");
      for (let i = 0; i < 18; i += 1) {
        rect((i * 47 + 11) % 320, (i * 19 + 8) % 84, 1, 1, i % 3 ? "#f7dba0" : "#34d9e8");
      }
      rect(0, 132, 320, 48, transformed < .5 ? "#9d4c31" : "#214b3b");

      rect(45 + treeShift, 73, 7, 59, "#251715");
      rect(30 + treeShift, 66, 36, 10, "#251715");
      rect(35 + treeShift, 57, 25, 12, "#251715");

      if (transformed > .08) {
        ctx.globalAlpha = transformed;
        for (let i = 0; i < 13; i += 1) {
          const x = 112 + i * 16;
          const h = 20 + (i * 11) % 55;
          rect(x, 132 - h, 12, h, i % 2 ? "#183f52" : "#1d5a68");
          rect(x + 3, 138 - h, 2, 2, "#34d9e8");
        }
        ctx.globalAlpha = 1;
      }

      ctx.globalAlpha = .55 + transformed * .35;
      ctx.strokeStyle = transformed > .5 ? "#34d9e8" : "#f2b544";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 153); ctx.lineTo(320, 153);
      ctx.moveTo(80, 132); ctx.lineTo(56, 180);
      ctx.moveTo(240, 132); ctx.lineTo(276, 180);
      ctx.stroke();
      ctx.globalAlpha = 1;

      const outward = t < .2 ? -24 + t * 650 : t < .76 ? 106 : 106 + (t - .76) * 950;
      const bob = Math.floor(frame / 8) % 2;
      const x = outward;
      const y = 132 + bob;
      rect(x + 3, y - 24, 16, 8, "#080808");
      rect(x + 1, y - 21, 20, 7, "#080808");
      rect(x + 6, y - 14, 10, 8, "#5a2b1d");
      rect(x + 5, y - 6, 12, 12, "#11181e");
      rect(x + 8, y - 4, 5, 4, "#f2b544");
      rect(x + 4, y + 6, 5, 12, "#20282e");
      rect(x + 13, y + 6, 5, 12, "#20282e");
      if (t > .48) {
        rect(x + 17, y - 6 + laptopShift, 18, 12, "#202a30");
        rect(x + 20, y - 4 + laptopShift, 12, 7, "#34d9e8");
      } else {
        rect(132, 125 + laptopShift, 18, 8, "#283139");
        rect(137, 127 + laptopShift, 8, 3, "#f2b544");
      }

      ctx.globalAlpha = .07;
      for (let yLine = 0; yLine < 180; yLine += 3) rect(0, yLine, 320, 1, "#000");
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width="320" height="180" aria-label="Un jeune créateur africain transforme le paysage grâce au code" />;
}

export function ConstructionGate() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const riddleQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [opening, setOpening] = useState(false);
  const [riddleProgress, setRiddleProgress] = useState(0);
  const [riddleMessage, setRiddleMessage] = useState("");
  const [hoveredSymbol, setHoveredSymbol] = useState<RiddleSymbol | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");

  async function submitRiddleSymbol(symbol: RiddleSymbol) {
    if (opening) return;
    let data: { status?: string; progress?: number; retryAfter?: number };
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      data = (await response.json()) as typeof data;
    } catch {
      setRiddleMessage("Le signal s’est perdu. Réessayez.");
      return;
    }

    if (data.status === "unlocked") {
      setOpening(true);
      setRiddleProgress(4);
      setRiddleMessage("La porte reconnaît un pionnier.");
      window.setTimeout(() => window.location.assign("/"), 850);
      return;
    }
    if (data.status === "progress") {
      setRiddleProgress(data.progress ?? 0);
      setRiddleMessage("Un fragment s’allume…");
      return;
    }
    if (data.status === "locked") {
      setRiddleProgress(0);
      setRiddleMessage("Le désert garde le silence. Revenez plus tard.");
      return;
    }
    setRiddleProgress(0);
    setRiddleMessage(data.status === "unavailable" ? "La porte dort encore." : "Le vent efface vos traces.");
  }

  function enqueueRiddleSymbol(symbol: RiddleSymbol) {
    riddleQueueRef.current = riddleQueueRef.current
      .catch(() => undefined)
      .then(() => submitRiddleSymbol(symbol));
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const startMusic = () => {
      void audio.play().then(() => setSoundOn(true)).catch(() => undefined);
    };

    startMusic();
    window.addEventListener("pointerdown", startMusic, { once: true });
    window.addEventListener("keydown", startMusic, { once: true });
    return () => {
      window.removeEventListener("pointerdown", startMusic);
      window.removeEventListener("keydown", startMusic);
    };
  }, []);

  function toggleSound() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setSoundOn(true));
    } else {
      audio.pause();
      setSoundOn(false);
    }
  }

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    setFormState("sending");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await response.json()) as { message?: string };
    setFormMessage(data.message ?? "Une erreur est survenue.");
    setFormState(response.ok ? "success" : "error");
    if (response.ok) form.reset();
  }

  return (
    <main className={`${styles.page} ${opening ? styles.opening : ""}`}>
      <audio ref={audioRef} src="/ancestral-pixel-loop.mp3" autoPlay loop preload="auto" />
      <div className={styles.ambientGrid} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.brand}><span>&lt;</span><button type="button" onClick={() => enqueueRiddleSymbol("logo")} aria-label="Pixel mystérieux">A</button><span>/&gt;</span><strong><i>AFRO</i>CODEURS</strong></div>
        <div className={styles.headerActions}>
          <button className={styles.sound} type="button" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Couper la musique" : "Activer la musique"}>{soundOn ? "♫ ON" : "♫ OFF"}</button>
          <span className={styles.live}><i /> SITE EN CONSTRUCTION</span>
        </div>
      </header>

      <section className={styles.layout}>
        <div className={styles.story}>
          <PixelScene hoveredSymbol={hoveredSymbol} />
          <div className={styles.vignette} />
          <button className={`${styles.hotspot} ${styles.hotspotBaobab}`} type="button" onPointerEnter={() => setHoveredSymbol("baobab")} onPointerLeave={() => setHoveredSymbol(null)} onFocus={() => setHoveredSymbol("baobab")} onBlur={() => setHoveredSymbol(null)} onClick={() => enqueueRiddleSymbol("baobab")} aria-label="Pixel mystérieux" />
          <button className={`${styles.hotspot} ${styles.hotspotLaptop}`} type="button" onPointerEnter={() => setHoveredSymbol("laptop")} onPointerLeave={() => setHoveredSymbol(null)} onFocus={() => setHoveredSymbol("laptop")} onBlur={() => setHoveredSymbol(null)} onClick={() => enqueueRiddleSymbol("laptop")} aria-label="Pixel mystérieux" />
          <button className={`${styles.hotspot} ${styles.hotspotSun}`} type="button" onPointerEnter={() => setHoveredSymbol("sun")} onPointerLeave={() => setHoveredSymbol(null)} onFocus={() => setHoveredSymbol("sun")} onBlur={() => setHoveredSymbol(null)} onClick={() => enqueueRiddleSymbol("sun")} aria-label="Pixel mystérieux" />
          <span className={styles.coordinates}>ABJ 05.3599° N · 04.0083° W</span>
          <div className={styles.copy}>
            <p><span>01</span> COMMUNAUTÉ TECH AFRICAINE</p>
            <h1><span>AFRO</span>CODEURS</h1>
            <h2>Le code transforme demain.</h2>
          </div>
          <span className={styles.loop}>● BOUCLE EN COURS</span>
          <div className={styles.sceneMeta}>
            <span>DÉSERT</span><i /><span>CODE</span><i /><span>IMPACT</span>
          </div>
          <div className={styles.riddleProgress} aria-live="polite">
            <div>{[0, 1, 2, 3].map((step) => <i key={step} className={step < riddleProgress ? styles.lit : ""} />)}</div>
            <span>{riddleMessage}</span>
          </div>
        </div>

        <aside className={styles.join}>
          <div>
            <p className={styles.eyebrow}>CERCLE FONDATEUR · 20 PLACES</p>
            <h2>Entrez avant<br />tout le monde.</h2>
            <p>Recevez l’annonce du lancement, les ressources et la future newsletter AfroCodeurs.</p>
          </div>
          <form onSubmit={subscribe} className={styles.form}>
            <label htmlFor="launch-email">Votre adresse e-mail</label>
            <div><input id="launch-email" name="email" type="email" placeholder="vous@exemple.com" autoComplete="email" required /><button disabled={formState === "sending"}>{formState === "sending" ? "…" : "Me prévenir"}</button></div>
            <p className={formState === "error" ? styles.error : styles.success} role="status">{formMessage}</p>
          </form>

          <div className={styles.community}>
            <a className={styles.qrCode} href={WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label="Rejoindre le groupe WhatsApp AfroCodeurs">
              <Image src="/whatsapp-community-qr.png" width={376} height={376} alt="QR code du groupe WhatsApp AfroCodeurs" priority />
            </a>
            <div><span className={styles.whatsappDot}>●</span><strong> Salon des pionniers</strong><p>Échangez avec les premiers bâtisseurs de la communauté.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">ENTRER SUR WHATSAPP ↗</a></div>
          </div>
          <a className={styles.mail} href="mailto:info@afrocodeurs.org">info@afrocodeurs.org</a>
        </aside>
      </section>

      <footer className={styles.footer}><span>Construit en Afrique, pour l’Afrique.</span><span className={styles.riddle}>◆ L’ORIGINE · L’OUTIL · LA LUMIÈRE · LE NOM ◆</span><span>© {new Date().getFullYear()} AfroCodeurs</span></footer>
      <div className={styles.portal}>ACCESS GRANTED</div>
    </main>
  );
}
