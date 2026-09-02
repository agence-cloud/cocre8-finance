"use server";

import { revalidatePath } from "next/cache";
import { exigerCompte } from "@/lib/auth/compte";
import { creerClientServeur } from "@/lib/supabase/serveur";
import { ecrireReglages } from "@/lib/reglages/requetes";

/**
 * Tout ce que l'outil sait écrire.
 *
 * **Chaque action commence par `exigerCompte()`**, et pas seulement les pages
 * qui les appellent : une action serveur est une requête HTTP à part entière,
 * elle ne traverse aucun layout et n'hérite d'aucune garde. Les politiques de
 * la base refuseraient de toute façon l'écriture à un inconnu, mais une garde
 * qui répond « connecte-toi » vaut mieux qu'une erreur de base de données.
 *
 * **Les montants passent par `nombre()` et jamais par `Number()` en direct.**
 * Un champ de montant reçoit « 1 250,50 » aussi souvent que « 1250.50 », et
 * `Number("1 250,50")` vaut `NaN`, qui part en base sans bruit et fait
 * disparaître la ligne de tous les totaux.
 */

export type Etat = { erreur: string | null };

export const RIEN: Etat = { erreur: null };

/** Un montant saisi à la française, à l'anglaise, ou avec des espaces. */
function nombre(brut: FormDataEntryValue | null): number {
  const texte = String(brut ?? "")
    .replace(/\s| /g, "")
    .replace(",", ".");
  const valeur = Number(texte);
  return Number.isFinite(valeur) ? valeur : Number.NaN;
}

function texte(brut: FormDataEntryValue | null): string {
  return String(brut ?? "").trim();
}

/** Un champ vide vaut « rien », pas la chaîne vide : la base porte `null`. */
function texteOuRien(brut: FormDataEntryValue | null): string | null {
  const valeur = texte(brut);
  return valeur === "" ? null : valeur;
}

/**
 * Les deux écrans de listes et le tableau de bord lisent les mêmes lignes.
 * Rafraîchir les trois d'un coup coûte moins cher que de se demander, à
 * chaque écriture, lequel a bougé : c'est ce raisonnement qui laisse un jour
 * un chiffre périmé à l'écran.
 */
function rafraichir(): void {
  revalidatePath("/tableau");
  revalidatePath("/factures");
  revalidatePath("/depenses");
  revalidatePath("/reglages");
}

// ---------------------------------------------------------------------
//  Les factures
// ---------------------------------------------------------------------

export async function enregistrerLaFacture(_precedent: Etat, donnees: FormData): Promise<Etat> {
  await exigerCompte();

  const id = texteOuRien(donnees.get("id"));
  const client = texte(donnees.get("client"));
  const montant = nombre(donnees.get("montant"));
  const emise_le = texte(donnees.get("emise_le"));
  const encaissee_le = texteOuRien(donnees.get("encaissee_le"));

  if (!client) return { erreur: "Dis pour qui est cette facture." };
  if (!Number.isFinite(montant) || montant < 0) {
    return { erreur: "Le montant doit être un nombre positif." };
  }
  if (!emise_le) return { erreur: "Donne la date d'émission." };

  // La même règle que la contrainte de la base, vérifiée ici pour pouvoir
  // l'expliquer. Sans elle, la base refuse aussi, mais avec un message que
  // personne ne comprend.
  if (encaissee_le && encaissee_le < emise_le) {
    return { erreur: "Une facture ne peut pas être encaissée avant d'être émise." };
  }

  const ligne = {
    client,
    libelle: texteOuRien(donnees.get("libelle")),
    montant,
    emise_le,
    encaissee_le,
    notes: texteOuRien(donnees.get("notes")),
  };

  const supabase = await creerClientServeur();
  const { error } = id
    ? await supabase.from("facture").update(ligne).eq("id", id)
    : await supabase.from("facture").insert(ligne);

  if (error) return { erreur: `Enregistrement impossible : ${error.message}` };

  rafraichir();
  return RIEN;
}

/**
 * Le geste d'un clic : « c'est payé, aujourd'hui ».
 *
 * À part du formulaire parce que c'est le geste le plus fréquent de l'outil,
 * et le seul qu'on fait sans rien avoir à écrire. Il repose aussi la date à
 * nul quand la facture est déjà marquée : c'est ainsi qu'on défait un clic
 * de trop, sans passer par le formulaire.
 */
export async function basculerLEncaissement(donnees: FormData): Promise<void> {
  await exigerCompte();

  const id = texte(donnees.get("id"));
  const dejaEncaissee = texte(donnees.get("encaissee")) === "1";
  const emise_le = texte(donnees.get("emise_le"));

  if (!id) return;

  // Le jour même, sauf si la facture a été émise plus tard (une facture
  // saisie en avance). La contrainte de la base refuserait la ligne, et un
  // clic ne doit jamais tomber sur une erreur.
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const jour = emise_le > aujourdhui ? emise_le : aujourdhui;

  const supabase = await creerClientServeur();
  await supabase
    .from("facture")
    .update({ encaissee_le: dejaEncaissee ? null : jour })
    .eq("id", id);

  rafraichir();
}

export async function supprimerLaFacture(donnees: FormData): Promise<void> {
  await exigerCompte();

  const id = texte(donnees.get("id"));
  if (!id) return;

  const supabase = await creerClientServeur();
  await supabase.from("facture").delete().eq("id", id);

  rafraichir();
}

// ---------------------------------------------------------------------
//  Les dépenses
// ---------------------------------------------------------------------

export async function enregistrerLaDepense(_precedent: Etat, donnees: FormData): Promise<Etat> {
  await exigerCompte();

  const id = texteOuRien(donnees.get("id"));
  const libelle = texte(donnees.get("libelle"));
  const montant = nombre(donnees.get("montant"));
  const payee_le = texte(donnees.get("payee_le"));

  if (!libelle) return { erreur: "Dis ce que c'est." };
  if (!Number.isFinite(montant) || montant < 0) {
    return { erreur: "Le montant doit être un nombre positif." };
  }
  if (!payee_le) return { erreur: "Donne la date de paiement." };

  const ligne = {
    libelle,
    montant,
    payee_le,
    poste_id: texteOuRien(donnees.get("poste_id")),
    recurrente: donnees.get("recurrente") === "on",
    notes: texteOuRien(donnees.get("notes")),
  };

  const supabase = await creerClientServeur();
  const { error } = id
    ? await supabase.from("depense").update(ligne).eq("id", id)
    : await supabase.from("depense").insert(ligne);

  if (error) return { erreur: `Enregistrement impossible : ${error.message}` };

  rafraichir();
  return RIEN;
}

export async function supprimerLaDepense(donnees: FormData): Promise<void> {
  await exigerCompte();

  const id = texte(donnees.get("id"));
  if (!id) return;

  const supabase = await creerClientServeur();
  await supabase.from("depense").delete().eq("id", id);

  rafraichir();
}

// ---------------------------------------------------------------------
//  L'objectif de l'année et les postes
// ---------------------------------------------------------------------

export async function enregistrerLObjectif(_precedent: Etat, donnees: FormData): Promise<Etat> {
  await exigerCompte();

  const annee = Number(texte(donnees.get("annee")));
  const facture_vise = nombre(donnees.get("facture_vise"));

  if (!Number.isInteger(annee) || annee < 2000 || annee > 2100) {
    return { erreur: "L'année n'est pas valide." };
  }
  if (!Number.isFinite(facture_vise) || facture_vise < 0) {
    return { erreur: "L'objectif doit être un nombre positif." };
  }

  const supabase = await creerClientServeur();
  const { error } = await supabase
    .from("objectif")
    .upsert({ annee, facture_vise }, { onConflict: "annee" });

  if (error) return { erreur: `Enregistrement impossible : ${error.message}` };

  rafraichir();
  return RIEN;
}

export async function ajouterLePoste(_precedent: Etat, donnees: FormData): Promise<Etat> {
  await exigerCompte();

  const nom = texte(donnees.get("nom"));
  if (!nom) return { erreur: "Donne un nom à ce poste." };

  const supabase = await creerClientServeur();

  // Le nouveau poste se range à la fin plutôt qu'au début : celui qu'on
  // ajoute est le plus rare, pas le plus courant.
  const { data } = await supabase
    .from("poste")
    .select("ordre")
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase
    .from("poste")
    .insert({ nom, ordre: (data?.ordre ?? 0) + 1 });

  if (error) return { erreur: `Ajout impossible : ${error.message}` };

  rafraichir();
  return RIEN;
}

export async function renommerLePoste(donnees: FormData): Promise<void> {
  await exigerCompte();

  const id = texte(donnees.get("id"));
  const nom = texte(donnees.get("nom"));
  if (!id || !nom) return;

  const supabase = await creerClientServeur();
  await supabase.from("poste").update({ nom }).eq("id", id);

  rafraichir();
}

/**
 * Supprime un poste. Les dépenses qui le portaient restent, sans poste :
 * c'est la base qui le garantit (`on delete set null`), pas cet appel.
 */
export async function supprimerLePoste(donnees: FormData): Promise<void> {
  await exigerCompte();

  const id = texte(donnees.get("id"));
  if (!id) return;

  const supabase = await creerClientServeur();
  await supabase.from("poste").delete().eq("id", id);

  rafraichir();
}

// ---------------------------------------------------------------------
//  Le nom de l'outil et la devise
// ---------------------------------------------------------------------

export async function enregistrerLesReglages(_precedent: Etat, donnees: FormData): Promise<Etat> {
  await exigerCompte();

  try {
    await ecrireReglages({
      nom_programme: texte(donnees.get("nom_programme")) || "Mes finances",
      devise: texte(donnees.get("devise")) || "€",
    });
  } catch (erreur) {
    return {
      erreur: erreur instanceof Error ? erreur.message : "Enregistrement impossible.",
    };
  }

  // Le nom voyage jusque dans le titre de l'onglet, donc jusque dans la mise
  // en page racine : `revalidatePath` sur une seule adresse ne la toucherait
  // pas, et l'ancien nom resterait affiché tant qu'on ne recharge pas.
  revalidatePath("/", "layout");
  return RIEN;
}
