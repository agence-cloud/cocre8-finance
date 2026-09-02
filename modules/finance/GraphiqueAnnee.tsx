import { MOIS_COURTS } from "@/lib/dates";
import { formaterMontant } from "@/lib/facture/types";
import type { Mois } from "@/lib/facture/calculs";

/**
 * Douze mois, trois barres par mois : facturé, encaissé, dépensé.
 *
 * **Les hauteurs se calculent sur le plus haut des trois séries confondues**,
 * et jamais série par série : trois échelles différentes dans le même cadre
 * feraient paraître une dépense de 200 aussi grosse qu'une facture de 5 000.
 *
 * **Chaque colonne porte `h-full`, et c'est ce qui a manqué la première
 * fois.** Une hauteur en pour cent a besoin d'un parent dont la hauteur est
 * définie : sans elle, le pourcentage se résout à zéro et les barres ne se
 * dessinent pas du tout. Les tests étaient verts, seule une capture d'écran
 * l'a vu.
 */
export function GraphiqueAnnee({ mois, devise }: { mois: Mois[]; devise: string }) {
  const plafond = Math.max(
    1,
    ...mois.map((m) => Math.max(m.facture, m.encaisse, m.depenses)),
  );

  const hauteur = (montant: number) => `${Math.round((montant / plafond) * 100)}%`;

  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: "11rem" }}>
        {mois.map((m, rang) => (
          <div key={m.mois} className="flex h-full flex-1 flex-col justify-end gap-1">
            <div className="flex h-full items-end justify-center gap-[3px]">
              <span
                title={`Facturé : ${formaterMontant(m.facture, devise)}`}
                style={{ height: hauteur(m.facture) }}
                className="w-full max-w-2.5 rounded-t-sm bg-accent/45"
              />
              <span
                title={`Encaissé : ${formaterMontant(m.encaisse, devise)}`}
                style={{ height: hauteur(m.encaisse) }}
                className="w-full max-w-2.5 rounded-t-sm bg-accent"
              />
              <span
                title={`Dépensé : ${formaterMontant(m.depenses, devise)}`}
                style={{ height: hauteur(m.depenses) }}
                className="w-full max-w-2.5 rounded-t-sm bg-texte-doux/35"
              />
            </div>
            <span className="text-center text-[10px] text-texte-doux">
              {MOIS_COURTS[rang]}
            </span>
          </div>
        ))}
      </div>

      <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-texte-doux">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent/45" />
          Facturé
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
          Encaissé
        </li>
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-texte-doux/35" />
          Dépensé
        </li>
      </ul>
    </div>
  );
}
