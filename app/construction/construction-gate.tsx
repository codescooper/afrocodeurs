"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./construction.module.css";

const PASSPHRASE = "buildbeforeconsume";
const TAP_COUNT = 7;

export function ConstructionGate() {
  const keyBuffer = useRef("");
  const tapReset = useRef<number | null>(null);
  const [taps, setTaps] = useState(0);
  const [opening, setOpening] = useState(false);
  const [message, setMessage] = useState("CHANTIER EN COURS");

  const unlock = useCallback(async () => {
    if (opening) return;
    setOpening(true);
    setMessage("PASSAGE SECRET DÉVERROUILLÉ");

    const response = await fetch("/api/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phrase: "build before consume" }),
    });

    if (!response.ok) {
      setOpening(false);
      setMessage("LE PASSAGE S'EST REFERMÉ");
      return;
    }

    window.setTimeout(() => window.location.assign("/"), 650);
  }, [opening]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
        return;
      }
      keyBuffer.current = `${keyBuffer.current}${event.key.toLowerCase()}`.slice(
        -PASSPHRASE.length,
      );
      if (keyBuffer.current === PASSPHRASE) void unlock();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [unlock]);

  function handleSecretTap() {
    if (tapReset.current) window.clearTimeout(tapReset.current);
    const next = taps + 1;
    setTaps(next);
    if (next >= TAP_COUNT) {
      setTaps(0);
      void unlock();
      return;
    }
    tapReset.current = window.setTimeout(() => setTaps(0), 1800);
  }

  return (
    <main className={`${styles.page} ${opening ? styles.opening : ""}`}>
      <div className={styles.noise} aria-hidden="true" />

      <header className={styles.header}>
        <a className={styles.brand} href="/construction" aria-label="AfroCodeurs">
          <span className={styles.brandMark}>A</span>
          <span>AFROCODEURS</span>
        </a>
        <span className={styles.status}><i /> {message}</span>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>{"// TRANSMISSION DEPUIS LE CONTINENT"}</p>
        <h1>
          ON CONSTRUIT
          <span>QUELQUE CHOSE DE GRAND.</span>
        </h1>
        <p className={styles.intro}>
          Des idées africaines. Des talents partout. Une plateforme pour relier
          les problèmes réels à celles et ceux qui veulent les résoudre.
        </p>

        <div className={styles.scene} aria-label="Un jeune AfroMaker emporte un ordinateur en courant">
          <div className={styles.skyline} aria-hidden="true" />
          <div className={styles.laptopWaiting} aria-hidden="true">
            <span>AC</span>
          </div>
          <div className={styles.runner} aria-hidden="true">
            <div className={styles.afro} />
            <div className={styles.ear} />
            <div className={styles.head}><i /></div>
            <div className={styles.body} />
            <div className={styles.armBack} />
            <div className={styles.armFront} />
            <div className={styles.legBack} />
            <div className={styles.legFront} />
            <div className={styles.carriedLaptop}><span>AC</span></div>
            <div className={styles.dust}><i /><i /><i /></div>
          </div>
          <div className={styles.ground} aria-hidden="true" />
          <span className={styles.sceneLabel}>LOADING THE FUTURE...</span>
        </div>

        <div className={styles.progress} aria-label="Progression du chantier">
          <div><span /></div>
          <p><b>82%</b> — LES DERNIERS PIXELS SONT EN PLACE</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Des problèmes aux solutions, ensemble.</p>
        <button
          className={styles.secret}
          type="button"
          onClick={handleSecretTap}
          aria-label="Pixel doré"
          title="Ubuntu ne se consomme pas. Il se construit."
        >
          ◆
        </button>
        <p className={styles.hint}>Les bâtisseurs connaissent l’ordre des mots.</p>
      </footer>

      <div className={styles.portal} aria-hidden="true">ACCESS GRANTED</div>
    </main>
  );
}
