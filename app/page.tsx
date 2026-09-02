import { redirect } from "next/navigation";

/**
 * La racine ne dessine rien : elle renvoie sur le tableau de bord, qui
 * renverra lui-même sur la connexion si personne n'est connecté.
 */
export default function Racine() {
  redirect("/tableau");
}
