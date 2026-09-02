import type { ComponentProps } from "react";

type Ton = "neutre" | "attention" | "succes";

const STYLES: Record<Ton, string> = {
  neutre: "bg-fond-alt text-texte-doux",
  attention: "bg-accent-doux text-accent",
  // Le seul endroit où le vert sert, avec le bouton de conversion : une
  // facture encaissée. C'est de l'argent arrivé, pas un statut de plus.
  succes: "bg-vert/15 text-vert",
};

type Props = ComponentProps<"span"> & { ton?: Ton };

export function Badge({ ton = "neutre", className = "", ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-pilule px-3 py-1 text-xs font-medium ${STYLES[ton]} ${className}`}
      {...props}
    />
  );
}
