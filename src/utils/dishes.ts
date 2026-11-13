import {
  COURSE_KEYS,
  COURSE_LABELS,
  ContrainteTag,
  Convive,
  CourseKey,
  DishVerdict,
  HoteType,
  Invitation,
  MenuCourses,
} from '../types/models';

/**
 * Forces a capital letter at the start of the dish name while preserving
 * intentional capitalization on subsequent words (e.g. "salade Niçoise" -> "Salade Niçoise").
 * If the entire input or the first word alone was typed in ALL CAPS (e.g. "BOEUF" or "BOEUF bourguignon"),
 * normalizes the shouting uppercase cleanly ("Boeuf" / "Boeuf bourguignon").
 */
export function formatDishInput(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';

  const isAllUpper =
    trimmed.length > 1 &&
    trimmed === trimmed.toUpperCase() &&
    trimmed !== trimmed.toLowerCase();

  if (isAllUpper) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  const spaceIdx = trimmed.indexOf(' ');
  const firstWord = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx);

  const firstWordAllUpper =
    firstWord.length > 1 &&
    firstWord === firstWord.toUpperCase() &&
    firstWord !== firstWord.toLowerCase();

  if (firstWordAllUpper) {
    return (
      firstWord.charAt(0).toUpperCase() +
      firstWord.slice(1).toLowerCase() +
      rest
    );
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * Normalizes a dish string or search term for accent- & case-insensitive comparison.
 */
export function normalizeForCompare(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function formatDateFr(dateIso: string): string {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) return dateIso;
  const [y, m, d] = dateIso.split('-');
  return `${d}/${m}/${y}`;
}

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface ElapsedTimeInfo {
  monthsAgo: number;
  daysAgo: number;
  label: string;
}

/**
 * Computes elapsed months/days since a YYYY-MM-DD date relative to today.
 */
export function getElapsedTimeInfo(dateIso: string): ElapsedTimeInfo {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return { monthsAgo: 0, daysAgo: 0, label: 'récemment' };
  }
  const [y, m, d] = dateIso.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = today.getTime() - target.getTime();
  const daysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let monthsAgo =
    (today.getFullYear() - target.getFullYear()) * 12 +
    (today.getMonth() - target.getMonth());
  if (today.getDate() < target.getDate()) {
    monthsAgo -= 1;
  }
  monthsAgo = Math.max(0, monthsAgo);

  let label: string;
  if (daysAgo === 0) {
    label = 'aujourd’hui';
  } else if (daysAgo < 30) {
    label = `il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
  } else {
    const roundedMonths = Math.max(1, monthsAgo);
    label = `il y a ${roundedMonths} mois`;
  }

  return { monthsAgo, daysAgo, label };
}

export interface ServedDishOccurrence {
  invitationId: string;
  date: string;
  course: CourseKey;
  dishLabel: string;
  hoteLabel: string;
  hoteType: HoteType;
  guestIds: string[];
  guestNames: string[];
  verdict?: DishVerdict;
}

export interface ConsolidatedServedDish {
  normalizedKey: string;
  dishLabel: string;
  courses: CourseKey[];
  mostRecentDate: string;
  monthsAgo: number;
  elapsedLabel: string;
  isRecent: boolean;
  latestVerdict?: DishVerdict;
  hasCoupDeCoeur: boolean;
  hasAEviter: boolean;
  occurrences: ServedDishOccurrence[];
  allGuestIds: string[];
  allGuestNames: string[];
}

/**
 * Aggregates all dishes from REALISEE invitations that included at least one selected guest.
 * Distinguishes recent dishes (< prescriptionMois) from older ones (>= prescriptionMois),
 * and surfaces Coup de coeur / Bien / A eviter verdicts.
 */
export function getDishesServedToGuests(
  invitations: Invitation[],
  selectedGuestIds: string[],
  convivesById: Map<string, Convive>,
  excludeInvitationId?: string,
  prescriptionMois = 6
): ConsolidatedServedDish[] {
  if (selectedGuestIds.length === 0) return [];
  const selectedSet = new Set(selectedGuestIds);

  // Strictly only 'realisee' invitations count toward already-served memory
  const matchingInvitations = invitations
    .filter(
      (inv) =>
        inv.statut === 'realisee' &&
        inv.id !== excludeInvitationId &&
        inv.convivesIds.some((cid) => selectedSet.has(cid))
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const grouped = new Map<string, ConsolidatedServedDish>();

  for (const inv of matchingInvitations) {
    const sharedGuestIds = inv.convivesIds.filter((cid) => selectedSet.has(cid));
    const sharedGuestNames = sharedGuestIds
      .map((cid) => convivesById.get(cid)?.nomAffiche)
      .filter((name): name is string => Boolean(name));

    for (const course of COURSE_KEYS) {
      const rawDish = inv.menu[course]?.trim();
      if (!rawDish) continue;

      const key = normalizeForCompare(rawDish);
      if (!key) continue;

      const dishVerdict = inv.menuVerdicts?.[course] ?? inv.verdict;

      const occurrence: ServedDishOccurrence = {
        invitationId: inv.id,
        date: inv.date,
        course,
        dishLabel: formatDishInput(rawDish),
        hoteLabel: inv.hoteType === 'moi' ? 'Chez moi' : `Chez ${inv.hoteLabel}`,
        hoteType: inv.hoteType,
        guestIds: sharedGuestIds,
        guestNames: sharedGuestNames,
        verdict: dishVerdict,
      };

      const existing = grouped.get(key);
      if (!existing) {
        const elapsed = getElapsedTimeInfo(inv.date);
        grouped.set(key, {
          normalizedKey: key,
          dishLabel: occurrence.dishLabel,
          courses: [course],
          mostRecentDate: inv.date,
          monthsAgo: elapsed.monthsAgo,
          elapsedLabel: elapsed.label,
          isRecent: elapsed.monthsAgo < prescriptionMois,
          latestVerdict: dishVerdict,
          hasCoupDeCoeur: dishVerdict === 'coup_de_coeur',
          hasAEviter: dishVerdict === 'a_eviter',
          occurrences: [occurrence],
          allGuestIds: [...sharedGuestIds],
          allGuestNames: [...sharedGuestNames],
        });
      } else {
        if (!existing.courses.includes(course)) {
          existing.courses.push(course);
        }
        if (inv.date > existing.mostRecentDate) {
          const elapsed = getElapsedTimeInfo(inv.date);
          existing.mostRecentDate = inv.date;
          existing.dishLabel = occurrence.dishLabel;
          existing.monthsAgo = elapsed.monthsAgo;
          existing.elapsedLabel = elapsed.label;
          existing.isRecent = elapsed.monthsAgo < prescriptionMois;
          existing.latestVerdict = dishVerdict;
        }
        if (dishVerdict === 'coup_de_coeur') existing.hasCoupDeCoeur = true;
        if (dishVerdict === 'a_eviter') existing.hasAEviter = true;

        existing.occurrences.push(occurrence);
        for (const gid of sharedGuestIds) {
          if (!existing.allGuestIds.includes(gid)) {
            existing.allGuestIds.push(gid);
            const gname = convivesById.get(gid)?.nomAffiche;
            if (gname) existing.allGuestNames.push(gname);
          }
        }
      }
    }
  }

  return Array.from(grouped.values()).sort((a, b) =>
    b.mostRecentDate.localeCompare(a.mostRecentDate)
  );
}

/**
 * Checks if a specific dish string entered in a menu field has already been served
 * to any of the selected guests in realised invitations.
 */
export function findDishConflicts(
  dishInput: string,
  servedDishes: ConsolidatedServedDish[]
): ConsolidatedServedDish | undefined {
  const key = normalizeForCompare(dishInput);
  if (!key || key.length < 2) return undefined;
  return servedDishes.find((d) => d.normalizedKey === key);
}

/**
 * Collects unique dish labels from past invitations for autocomplete,
 * sorted by frequency & recency, matching query accent-insensitively.
 */
export function getDishSuggestions(
  invitations: Invitation[],
  query: string,
  courseFilter?: CourseKey
): { label: string; course: CourseKey; count: number }[] {
  const q = normalizeForCompare(query);
  const counts = new Map<string, { label: string; course: CourseKey; count: number }>();

  const sortedInv = [...invitations].sort((a, b) => b.date.localeCompare(a.date));

  for (const inv of sortedInv) {
    for (const course of COURSE_KEYS) {
      if (courseFilter && course !== courseFilter) continue;
      const raw = inv.menu[course]?.trim();
      if (!raw) continue;
      const formatted = formatDishInput(raw);
      const key = normalizeForCompare(formatted);
      if (!key) continue;
      if (q && !key.includes(q)) continue;

      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { label: formatted, course, count: 1 });
      }
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'))
    .slice(0, 6);
}

export interface AggregatedConstraints {
  strict: { tag: ContrainteTag; guests: Convive[] }[];
  preferences: { tag: ContrainteTag; guests: Convive[] }[];
  freeNotes: { guest: Convive; note: string }[];
}

export function aggregateConstraints(
  selectedGuestIds: string[],
  convivesById: Map<string, Convive>,
  contraintesById: Map<string, ContrainteTag>
): AggregatedConstraints {
  const strictMap = new Map<string, { tag: ContrainteTag; guests: Convive[] }>();
  const prefMap = new Map<string, { tag: ContrainteTag; guests: Convive[] }>();
  const freeNotes: { guest: Convive; note: string }[] = [];

  for (const gid of selectedGuestIds) {
    const guest = convivesById.get(gid);
    if (!guest) continue;

    for (const cid of guest.contraintesIds) {
      const tag = contraintesById.get(cid);
      if (!tag) continue;
      const targetMap = tag.niveau === 'strict' ? strictMap : prefMap;
      const entry = targetMap.get(tag.id);
      if (entry) {
        entry.guests.push(guest);
      } else {
        targetMap.set(tag.id, { tag, guests: [guest] });
      }
    }

    if (guest.contrainteLibre.trim()) {
      freeNotes.push({ guest, note: guest.contrainteLibre.trim() });
    }
  }

  return {
    strict: Array.from(strictMap.values()).sort((a, b) =>
      a.tag.libelle.localeCompare(b.tag.libelle, 'fr')
    ),
    preferences: Array.from(prefMap.values()).sort((a, b) =>
      a.tag.libelle.localeCompare(b.tag.libelle, 'fr')
    ),
    freeNotes,
  };
}

export interface AiPromptOptions {
  mealType: 'Déjeuner' | 'Dîner' | 'Apéro dînatoire';
  seasonOrTheme: string;
  timeOrBudget: string;
  freeInstruction: string;
  anonymize: boolean;
}

export function buildAiPromptMarkdown(params: {
  options: AiPromptOptions;
  hoteType: HoteType;
  hoteLabel: string;
  date: string;
  selectedGuests: Convive[];
  constraints: AggregatedConstraints;
  servedDishes: ConsolidatedServedDish[];
  currentMenu: MenuCourses;
  prescriptionMois: number;
}): string {
  const {
    options,
    hoteType,
    hoteLabel,
    date,
    selectedGuests,
    constraints,
    servedDishes,
    currentMenu,
    prescriptionMois,
  } = params;

  const anon = options.anonymize;
  const count = selectedGuests.length;
  const countStr = `${count} personne${count > 1 ? 's' : ''}`;

  const lines: string[] = [];
  lines.push(`# Demande d'idées de menu — Attablés`);
  lines.push('');

  if (anon) {
    const lieu = hoteType === 'moi' ? 'chez moi' : 'chez un proche';
    lines.push(
      `${options.mealType} pour **${countStr}** (${lieu}${
        date ? `, le ${formatDateFr(date)}` : ''
      }).`
    );
  } else {
    lines.push(
      `${options.mealType} pour **${countStr}** (${
        hoteType === 'moi' ? 'chez moi' : `chez ${hoteLabel || 'un proche'}`
      }${date ? `, le ${formatDateFr(date)}` : ''}) : ${
        selectedGuests.map((g) => g.nomAffiche).join(', ') || 'aucun convive sélectionné'
      }.`
    );
  }

  if (options.seasonOrTheme.trim()) {
    lines.push(`- **Saison / Thème** : ${options.seasonOrTheme.trim()}`);
  }
  if (options.timeOrBudget.trim()) {
    lines.push(`- **Temps / Budget** : ${options.timeOrBudget.trim()}`);
  }
  if (options.freeInstruction.trim()) {
    lines.push(`- **Consigne particulière** : ${options.freeInstruction.trim()}`);
  }

  lines.push('');
  lines.push(`## Contraintes alimentaires`);
  if (
    constraints.strict.length === 0 &&
    constraints.preferences.length === 0 &&
    constraints.freeNotes.length === 0
  ) {
    lines.push(`- Aucune allergie ni restriction signalée.`);
  } else {
    if (constraints.strict.length > 0) {
      const strictSummary = constraints.strict
        .map((item) =>
          anon
            ? `${item.guests.length} ${item.tag.libelle.toLowerCase()}`
            : `${item.tag.libelle} (${item.guests.map((g) => g.nomAffiche).join(', ')})`
        )
        .join(', ');
      lines.push(`- **Contraintes strictes (tolérance zéro)** : ${strictSummary}.`);
    }
    if (constraints.preferences.length > 0) {
      const prefSummary = constraints.preferences
        .map((item) =>
          anon
            ? `${item.guests.length} ${item.tag.libelle.toLowerCase()}`
            : `${item.tag.libelle} (${item.guests.map((g) => g.nomAffiche).join(', ')})`
        )
        .join(', ');
      lines.push(`- **Préférences & régimes** : ${prefSummary}.`);
    }
    if (constraints.freeNotes.length > 0) {
      for (const noteItem of constraints.freeNotes) {
        lines.push(
          anon
            ? `- **Note individuelle (1 convive)** : ${noteItem.note}`
            : `- **Note (${noteItem.guest.nomAffiche})** : ${noteItem.note}`
        );
      }
    }
  }

  const filledMenu = COURSE_KEYS.filter((k) => currentMenu[k]?.trim());
  if (filledMenu.length > 0) {
    lines.push('');
    lines.push(`## Déjà prévu au menu`);
    for (const k of filledMenu) {
      lines.push(`- **${COURSE_LABELS[k]}** : ${formatDishInput(currentMenu[k] || '')}`);
    }
  }

  const formatDishLine = (dish: ConsolidatedServedDish) => {
    const courseStr = dish.courses.map((c) => COURSE_LABELS[c]).join(' / ');
    if (anon) {
      return `- **${dish.dishLabel}** (${courseStr}) — servi ${dish.elapsedLabel}`;
    }
    const occSummary = dish.occurrences
      .map(
        (occ) =>
          `le ${formatDateFr(occ.date)} à ${occ.guestNames.join(', ')} (${occ.hoteLabel})`
      )
      .join(' ; ');
    return `- **${dish.dishLabel}** (${courseStr}) — servi ${occSummary}`;
  };

  const recentToAvoid = servedDishes.filter((d) => d.isRecent && !d.hasAEviter);
  const flaggedAvoid = servedDishes.filter((d) => d.hasAEviter);
  const favorites = servedDishes.filter((d) => d.hasCoupDeCoeur && !d.hasAEviter);
  const olderNeutral = servedDishes.filter(
    (d) => !d.isRecent && !d.hasAEviter && !d.hasCoupDeCoeur
  );

  if (recentToAvoid.length > 0 || flaggedAvoid.length > 0) {
    lines.push('');
    lines.push(`## Plats à éviter`);
    for (const dish of flaggedAvoid) {
      lines.push(`${formatDishLine(dish)} [marqué à éviter]`);
    }
    for (const dish of recentToAvoid) {
      lines.push(`${formatDishLine(dish)} [servi récemment]`);
    }
  }

  if (favorites.length > 0) {
    lines.push('');
    lines.push(
      `## Ce qu’ils ont adoré par le passé (pour t’inspirer du style)`
    );
    for (const dish of favorites) {
      const statusHint = dish.isRecent
        ? `servi récemment, ne pas resservir à l’identique`
        : `servi ${dish.elapsedLabel}, peut éventuellement revenir`;
      lines.push(`${formatDishLine(dish)} [${statusHint}]`);
    }
  }

  if (olderNeutral.length > 0) {
    lines.push('');
    lines.push(
      `## Plats anciens (plus de ${prescriptionMois} mois — peuvent revenir si besoin)`
    );
    for (const dish of olderNeutral) {
      lines.push(formatDishLine(dish));
    }
  }

  lines.push('');
  lines.push(
    `Propose un menu complet et équilibré (ou complète les plats manquants) en respectant strictement toutes les allergies, en tenant compte des préférences, en évitant les plats servis récemment ou marqués à éviter, et en t’inspirant de leurs coups de cœur passés.`
  );

  return lines.join('\n');
}
