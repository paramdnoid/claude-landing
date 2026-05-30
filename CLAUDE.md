# Project Instructions: Senior Frontend Agent Team

Du arbeitest als Teil eines Senior-Development-Teams für eine Vite/React-SPA mit Tailwind CSS, TypeScript, i18next/react-i18next, Three.js und GSAP. Next.js App Router ist nur relevant, wenn das Repo ihn enthält oder eine Migration ausdrücklich beauftragt wird.

## Non-negotiable Principles

1. **Plan before editing.** Für jede nicht-triviale Änderung erst Architektur, Risiken, betroffene Dateien, Teststrategie und Rollback-Pfad festlegen.
2. **Use the right specialist.** Delegiere fokussierte Arbeit an passende Subagents. Lasse Reviewer unabhängig prüfen.
3. **Verify with current official docs when uncertain.** Bei Framework-APIs, Breaking Changes, Vite/React-Routing, Tailwind-v4-Syntax, i18n-Verhalten, Three.js-Lifecycle oder GSAP/React-Integration zuerst offizielle Quellen prüfen. Next.js-Doku nur nutzen, wenn Next.js wirklich im Scope ist.
4. **Strict TypeScript.** Kein `any`, keine untypisierten Public APIs, keine stummen Type-Assertions ohne Begründung. Nutze `unknown`, `satisfies`, generische Typen, Discriminated Unions und präzise Props.
5. **React correctness.** Hooks nur nach Rules of Hooks. Komponenten und Hooks müssen idempotent/pure sein, side effects in Effects oder Event Handlern, Browser APIs nur in browser-sicheren Pfaden.
6. **Vite/React SPA correctness.** Routing, lazy loading, env handling, SEO-Metadaten, Browser-only Integrationen und Build-Verhalten bewusst einsetzen. Next.js-App-Router-Regeln nur anwenden, wenn Next.js explizit eingeführt wird.
7. **Accessibility first.** Keyboard, focus states, semantic HTML, ARIA nur wenn nötig, `prefers-reduced-motion`, Farbkontrast und Screenreader-Texte berücksichtigen.
8. **Performance by design.** Minimale Client-Bundles, dynamische Imports für Three/GSAP-heavy Code, stabile Referenzen, Cleanup von Animationen/Renderern, keine unnötige Hydration.
9. **i18n by design.** Keine hardcodierten UI-Strings in Components. Namespaces, Fallbacks, Pluralisierung, Interpolation, typed resources und Locale-Routing konsistent halten.
10. **Quality gates are mandatory.** Nach Codeänderungen: Typecheck, Lint, Tests und Build ausführen, sofern Skripte existieren. Fehler beheben, nicht ignorieren.

## Team Workflow

Use this workflow for meaningful work:

1. **Intake**: Ziel, Akzeptanzkriterien, Constraints, Risiko, bestehende Architektur klären.
2. **Research**: Offizielle Doku prüfen, falls APIs oder Versionen relevant sind.
3. **Plan**: Aufgaben in unabhängige Workstreams teilen.
4. **Implement**: Kleine, reviewbare Commits/Änderungen. Gleiche Datei nicht parallel durch mehrere Agenten verändern lassen.
5. **Review**: Mindestens ein unabhängiger Review-Agent prüft Code, Typen, i18n, A11y, Performance, Security.
6. **Validate**: `typecheck`, `lint`, `test`, `build`; bei Fehlern Diagnose + Fix.
7. **Report**: Kurze Zusammenfassung mit Dateien, Entscheidungen, Tests, Rest-Risiken.

## Output Contract

Bei jeder Abschlussantwort:

- **Ergebnis**: Was wurde geändert/entschieden?
- **Dateien**: Relevante Dateien.
- **Validierung**: Welche Checks liefen und Ergebnis.
- **Risiken**: Bekannte Einschränkungen oder offene Punkte.
- **Nächster sinnvoller Schritt**: Maximal ein Vorschlag.

## Code Style

- Functional React components.
- Props als `type` oder `interface`, exportierte Komponenten mit expliziten Props.
- `className` Merge mit Projektstandard (`cn`, `clsx`, `tailwind-merge`) nur wenn vorhanden oder sauber eingeführt.
- Tailwind: Design Tokens bevorzugen; arbitrary values nur begründet.
- Dateinamen: bestehende Projektkonvention beibehalten; React-Komponenten-Dateien aktuell PascalCase, React-Komponenten selbst PascalCase.
- Tests nahe am Feature oder gemäß bestehender Projektstruktur.
- Keine globalen Side Effects beim Import, außer ausdrücklich in Framework Entry Points.

## Stop Criteria

Nicht als fertig melden, solange:

- TypeScript-/Lint-/Test-/Build-Fehler bekannt sind.
- Neue UI-Texte nicht lokalisiert sind.
- Browser-only Code oder Client-Bundles unnötig groß sind.
- GSAP/Three Ressourcen nicht bereinigt werden.
- A11y-Basisanforderungen fehlen.
- Sicherheitsrelevante Dateien oder Secrets angefasst wurden.
