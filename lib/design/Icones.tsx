type Nom =
  | "tableau"
  | "facture"
  | "depense"
  | "attente"
  | "reglages"
  | "replier"
  | "coche"
  | "croix"
  | "stylo"
  | "poubelle";

/**
 * Icônes dessinées à la main plutôt qu'importées : une librairie ajouterait
 * une dépendance pour une poignée de glyphes, et rendrait l'outil
 * reconnaissable au jeu d'icônes qu'il emprunte. Toutes en trait, jamais
 * pleines, sur une grille de 24.
 *
 * Il n'y en a que dix, et c'est volontaire : une icône qui n'est utilisée
 * nulle part finit par être choisie pour la mauvaise chose, faute de mieux.
 */
const CHEMINS: Record<Nom, React.ReactNode> = {
  // Quatre pavés inégaux : un tableau de bord, pas une grille de photos.
  tableau: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
    </>
  ),
  // Une feuille au coin plié, avec deux lignes de texte et un montant
  // souligné en bas : c'est le trait sous le dernier chiffre qui fait lire
  // une facture plutôt qu'un document quelconque.
  facture: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 11h6M9 14h6" />
      <path d="M12 17.5h3" />
    </>
  ),
  // Une flèche qui sort d'un portefeuille : de l'argent qui part. La flèche
  // vers le bas aurait dit « télécharger », qui n'a rien à voir.
  depense: (
    <>
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <path d="M3 10.5h18" />
      <path d="M12 17V13M9.8 15.2 12 17l2.2-1.8" />
    </>
  ),
  // Une horloge : ce qui n'est pas encore arrivé. Un sablier aurait dit une
  // attente qui finit toute seule, or une facture impayée attend qu'on la
  // relance.
  attente: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Trois curseurs, comme une table de mixage : le réglage se voit mieux dans
  // une glissière que dans une roue crantée, qui dit plutôt la mécanique.
  reglages: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  // Un chevron : il pivote selon le sens.
  replier: <path d="M14 6l-6 6 6 6" />,
  coche: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  croix: <path d="M6 6l12 12M18 6L6 18" />,
  // Un crayon en diagonale, la pointe en bas à gauche, comme quand on le
  // tient pour écrire. Le second tracé sépare la mine du corps : sans lui la
  // forme se lit comme un simple losange allongé.
  stylo: (
    <>
      <path d="M16.3 4.2l3.5 3.5L9 18.5l-4.6 1.1 1.1-4.6z" />
      <path d="M5.5 15l3.5 3.5" />
    </>
  ),
  poubelle: (
    <>
      <path d="M4 6.5h16M9.5 6.5V4h5v2.5" />
      <path d="M6.5 6.5 7.5 20h9l1-13.5" />
      <path d="M10.5 10v6M13.5 10v6" />
    </>
  ),
};

export function Icone({ nom, className = "" }: { nom: Nom; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {CHEMINS[nom]}
    </svg>
  );
}

export type NomIcone = Nom;
