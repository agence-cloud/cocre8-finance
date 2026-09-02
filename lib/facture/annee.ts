/**
 * L'année que les trois écrans regardent, lue dans l'adresse.
 *
 * Une seule fonction pour les trois, parce qu'ils doivent tomber d'accord :
 * une année lue différemment d'un écran à l'autre donnerait un tableau de
 * bord qui ne correspond pas à la liste juste à côté.
 *
 * Tout ce qui n'est pas une année plausible retombe sur l'année en cours
 * plutôt que de lever : `?annee=bonjour` est une adresse tapée de travers,
 * pas une panne.
 */
export function anneeDemandee(brut: string | string[] | undefined): number {
  const valeur = Number(Array.isArray(brut) ? brut[0] : brut);
  const enCours = new Date().getFullYear();

  if (!Number.isInteger(valeur) || valeur < 2000 || valeur > 2100) return enCours;
  return valeur;
}
