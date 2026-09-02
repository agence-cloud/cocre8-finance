import { creerClientServeur } from "@/lib/supabase/serveur";
import type { Depense, Facture, Poste } from "@/lib/facture/types";

/**
 * Les factures d'une année, par date d'émission.
 *
 * **Le filtre porte sur l'émission, et l'encaissement se rattrape à part.**
 * Une facture émise en décembre et encaissée en janvier appartient au chiffre
 * facturé d'une année et à l'encaissé de l'autre : filtrer sur une seule date
 * ferait disparaître ces sommes d'un des deux tableaux.
 */
export async function lireFactures(annee: number): Promise<Facture[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("facture")
    .select("id, client, libelle, montant, emise_le, encaissee_le, notes")
    .or(
      `and(emise_le.gte.${annee}-01-01,emise_le.lte.${annee}-12-31),` +
        `and(encaissee_le.gte.${annee}-01-01,encaissee_le.lte.${annee}-12-31)`,
    )
    .order("emise_le", { ascending: false });

  if (error) throw new Error(`Lecture des factures impossible : ${error.message}`);
  return (data ?? []).map((f) => ({ ...f, montant: Number(f.montant) })) as Facture[];
}

export async function lireDepenses(annee: number): Promise<Depense[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("depense")
    .select("id, libelle, montant, payee_le, poste_id, recurrente, notes")
    .gte("payee_le", `${annee}-01-01`)
    .lte("payee_le", `${annee}-12-31`)
    .order("payee_le", { ascending: false });

  if (error) throw new Error(`Lecture des dépenses impossible : ${error.message}`);
  return (data ?? []).map((d) => ({ ...d, montant: Number(d.montant) })) as Depense[];
}

export async function lirePostes(): Promise<Poste[]> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("poste")
    .select("id, nom, ordre")
    .order("ordre")
    .order("nom");

  if (error) throw new Error(`Lecture des postes impossible : ${error.message}`);
  return (data ?? []) as Poste[];
}

export async function lireObjectif(annee: number): Promise<number> {
  const supabase = await creerClientServeur();
  const { data, error } = await supabase
    .from("objectif")
    .select("facture_vise")
    .eq("annee", annee)
    .maybeSingle();

  if (error) throw new Error(`Lecture de l'objectif impossible : ${error.message}`);
  return Number(data?.facture_vise ?? 0);
}

/**
 * Les années où il s'est passé quelque chose, la plus récente d'abord.
 *
 * **Trois années y figurent toujours, même vides : celle en cours et la
 * suivante.** L'année en cours, sans quoi un outil qu'on vient d'installer
 * n'aurait aucune année à proposer et son sélecteur s'ouvrirait sur rien.
 * L'année suivante, parce qu'un objectif se pose en décembre pour janvier :
 * sans elle, il faudrait attendre le 1er janvier pour écrire le chiffre qu'on
 * a décidé trois semaines plus tôt.
 *
 * Rien d'autre à faire pour que l'outil dure : chaque première facture d'une
 * année nouvelle fait apparaître cette année d'elle-même, et celles d'avant
 * restent toutes consultables.
 */
export async function lireAnnees(): Promise<number[]> {
  const supabase = await creerClientServeur();
  const [factures, depenses] = await Promise.all([
    supabase.from("facture").select("emise_le, encaissee_le"),
    supabase.from("depense").select("payee_le"),
  ]);

  const enCours = new Date().getFullYear();
  const annees = new Set<number>([enCours, enCours + 1]);
  for (const ligne of factures.data ?? []) {
    annees.add(Number(ligne.emise_le.slice(0, 4)));
    if (ligne.encaissee_le) annees.add(Number(ligne.encaissee_le.slice(0, 4)));
  }
  for (const ligne of depenses.data ?? []) {
    annees.add(Number(ligne.payee_le.slice(0, 4)));
  }

  return [...annees].sort((a, b) => b - a);
}
