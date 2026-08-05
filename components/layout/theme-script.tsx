const SCRIPT = `
try {
  var t = localStorage.getItem("theme");
  if (t === "dark" || t === "light") {
    document.documentElement.setAttribute("data-theme", t);
  }
} catch (e) {}
`;

/** Applique le thème sauvegardé avant le premier paint (évite le flash). */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
