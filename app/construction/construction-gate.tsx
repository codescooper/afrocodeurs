"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import styles from "./construction.module.css";

const PASSPHRASE = "afro20";
const SECRET_TAPS = 5;
const WHATSAPP_URL = "https://chat.whatsapp.com/BfD3XW8X48ACQN5V8XkBye";

function PixelScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const sky = ctx.createLinearGradient(0, 0, 0, 180);
      sky.addColorStop(0, transformed < .5 ? "#431e2d" : "#0c3851");
      sky.addColorStop(1, transformed < .5 ? "#f0a34b" : "#4f9f9c");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, 320, 180);
      rect(252, 22, 25, 25, transformed < .5 ? "#f2b544" : "#72e8ef");
      rect(256, 18, 17, 33, transformed < .5 ? "#f2b544" : "#72e8ef");
      for (let i = 0; i < 18; i += 1) {
        rect((i * 47 + 11) % 320, (i * 19 + 8) % 84, 1, 1, i % 3 ? "#f7dba0" : "#34d9e8");
      }
      rect(0, 132, 320, 48, transformed < .5 ? "#9d4c31" : "#214b3b");

      rect(45, 73, 7, 59, "#251715");
      rect(30, 66, 36, 10, "#251715");
      rect(35, 57, 25, 12, "#251715");

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
        rect(x + 17, y - 6, 18, 12, "#202a30");
        rect(x + 20, y - 4, 12, 7, "#34d9e8");
      } else {
        rect(132, 125, 18, 8, "#283139");
        rect(137, 127, 8, 3, "#f2b544");
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
  const keyBuffer = useRef("");
  const tapTimer = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [opening, setOpening] = useState(false);
  const [secretTaps, setSecretTaps] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [formState, setFormState] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [formMessage, setFormMessage] = useState("");

  const unlock = useCallback(async () => {
    if (opening) return;
    setOpening(true);
    const response = await fetch("/api/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phrase: "build before consume" }),
    });
    if (!response.ok) return setOpening(false);
    window.setTimeout(() => window.location.assign("/"), 650);
  }, [opening]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
      keyBuffer.current = `${keyBuffer.current}${event.key.toLowerCase()}`.slice(-PASSPHRASE.length);
      if (keyBuffer.current === PASSPHRASE) void unlock();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [unlock]);

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

  function tapSecret() {
    if (tapTimer.current) window.clearTimeout(tapTimer.current);
    const next = secretTaps + 1;
    if (next >= SECRET_TAPS) {
      setSecretTaps(0);
      void unlock();
      return;
    }
    setSecretTaps(next);
    tapTimer.current = window.setTimeout(() => setSecretTaps(0), 1800);
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
        <div className={styles.brand}><span>&lt;</span><button type="button" onClick={tapSecret} aria-label="Logo AfroCodeurs" title="Les pionniers frappent cinq fois.">A</button><span>/&gt;</span><strong><i>AFRO</i>CODEURS</strong></div>
        <div className={styles.headerActions}>
          <button className={styles.sound} type="button" onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Couper la musique" : "Activer la musique"}>{soundOn ? "♫ ON" : "♫ OFF"}</button>
          <span className={styles.live}><i /> SITE EN CONSTRUCTION</span>
        </div>
      </header>

      <section className={styles.layout}>
        <div className={styles.story}>
          <PixelScene />
          <div className={styles.vignette} />
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
              <QRCodeSVG value={WHATSAPP_URL} size={76} level="M" bgColor="#ffffff" fgColor="#080b0f" marginSize={1} />
            </a>
            <div><span className={styles.whatsappDot}>●</span><strong> Salon des pionniers</strong><p>Échangez avec les premiers bâtisseurs de la communauté.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">ENTRER SUR WHATSAPP ↗</a></div>
          </div>
          <a className={styles.mail} href="mailto:info@afrocodeurs.org">info@afrocodeurs.org</a>
        </aside>
      </section>

      <footer className={styles.footer}><span>Construit en Afrique, pour l’Afrique.</span><span className={styles.riddle} title="Indice : le nombre des premiers membres.">◆ 20 PIONNIERS, UNE PORTE ◆</span><span>© {new Date().getFullYear()} AfroCodeurs</span></footer>
      <div className={styles.portal}>ACCESS GRANTED</div>
    </main>
  );
}
