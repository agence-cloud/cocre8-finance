import { moisEnToutesLettres } from "@/lib/dates";
import { formaterMontant } from "@/lib/facture/types";

/**
 * La ligne qui coupe une liste entre deux mois.
 *
 * **Elle porte le total du mois, et c'est ce qui la rend utile.** Un simple
 * intertitre ne ferait qu'aérer ; le total répond à la question qu'on se pose
 * en descendant la liste, « combien ce mois-là », sans avoir à additionner de
 * tête ni à changer d'écran.
 *
 * Sur `surface` et non sur le fond de la carte : c'est le seul ton qui la
 * détache assez pour qu'on la lise comme une coupure et non comme une ligne
 * de plus.
 */
export function SeparateurMois({
  mois,
  total,
  nombre,
  devise,
}: {
  mois: string;
  total: number;
  nombre: number;
  devise: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-y border-bordure bg-surface px-5 py-2">
      <span className="text-[13px] font-medium capitalize">
        {moisEnToutesLettres(mois)}
      </span>
      <span className="text-[13px] text-texte-doux tabular-nums">
        {nombre} ligne{nombre > 1 ? "s" : ""}, {formaterMontant(total, devise)}
      </span>
    </div>
  );
}
