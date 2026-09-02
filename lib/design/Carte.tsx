import type { ComponentProps } from "react";

/**
 * Deux tons, et c'est tout l'enjeu : sans eux, toutes les cartes d'un écran
 * ont le même poids et rien ne dit à l'oeil par où commencer. C'est le défaut
 * qu'on appelle « un style un peu vieillot ».
 *
 * `posee` porte l'ombre douce et flotte au-dessus du fond : c'est la carte
 * qu'on regarde en premier, une par écran.
 * `calme` n'a que sa bordure et recule : c'est tout le reste.
 *
 * Un ton et non une classe passée de l'extérieur : `shadow-none` ajouté au
 * `className` ne l'emporterait pas de façon fiable sur `shadow-carte`. À
 * spécificité égale, c'est l'ordre dans la feuille de style qui tranche, pas
 * l'ordre dans l'attribut. Le même piège avait déjà fait échouer un `p-0` sur
 * cette carte.
 */
const TONS = {
  posee: "shadow-carte",
  calme: "",
} as const;

/**
 * **La marge est une propriété et non une classe passée de l'extérieur**, pour
 * la raison exacte qui vaut pour le ton : un `p-0` ajouté au `className` ne
 * l'emporte pas de façon fiable sur le `p-6` d'ici. À spécificité égale, c'est
 * l'ordre dans la feuille de style qui tranche, pas l'ordre dans l'attribut.
 * Le piège a coûté deux fois : la carte gardait ses vingt-quatre pixels, et
 * les listes qui devaient toucher les bords flottaient au milieu.
 *
 * `aucune` va avec `overflow-hidden` : ce qui touche les bords a des angles
 * droits, que les coins arrondis de la carte doivent recouper.
 */
const MARGES = {
  normale: "p-6",
  aucune: "overflow-hidden",
} as const;

type Props = ComponentProps<"div"> & {
  ton?: keyof typeof TONS;
  marge?: keyof typeof MARGES;
};

export function Carte({ ton = "posee", marge = "normale", className = "", ...props }: Props) {
  return (
    <div
      className={`rounded-carte border border-bordure bg-fond ${MARGES[marge]} ${TONS[ton]} ${className}`}
      {...props}
    />
  );
}
