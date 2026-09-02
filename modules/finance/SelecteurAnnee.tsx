"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/**
 * L'année qu'on regarde, choisie dans l'adresse et non dans un état.
 *
 * **C'est ce qui rend un écran partageable et rechargeable.** Un état de
 * composant se serait perdu au premier rafraîchissement, et le retour arrière
 * du navigateur n'aurait rien fait. L'adresse porte donc l'année, et les trois
 * écrans la lisent au même endroit.
 */
export function SelecteurAnnee({ annee, annees }: { annee: number; annees: number[] }) {
  const router = useRouter();
  const parametres = useSearchParams();
  const [enCours, demarrer] = useTransition();

  function choisir(nouvelle: string) {
    const suite = new URLSearchParams(parametres.toString());
    suite.set("annee", nouvelle);
    demarrer(() => router.push(`?${suite.toString()}`));
  }

  return (
    <select
      value={annee}
      onChange={(evenement) => choisir(evenement.target.value)}
      aria-label="Année"
      className={`rounded-lg border-[1.5px] border-bordure bg-fond px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-accent ${
        enCours ? "opacity-60" : ""
      }`}
    >
      {annees.map((valeur) => (
        <option key={valeur} value={valeur}>
          {valeur}
        </option>
      ))}
    </select>
  );
}
