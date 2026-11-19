# Product

## Register

product

## Users

Un public large : toute personne qui reçoit famille et amis, y compris des personnes âgées ou peu à l'aise avec un téléphone. Elle prépare un repas sur son téléphone Android, souvent quelques jours avant, parfois au dernier moment en faisant les courses, et revient après le repas pour noter ce qui a été servi.

Le travail à accomplir : savoir qui vient, ne jamais oublier une allergie stricte, ne pas resservir trop vite le même plat aux mêmes personnes, et garder une mémoire des repas réussis. Sur chaque écran, la tâche principale est unique : voir ce qui arrive (Invitations), qui est qui (Convives), ce qu'on a déjà servi ou aimerait servir (Plats), ou préparer un repas précis (éditeur).

Constat qui a guidé la version 0.3.0 : un testeur placé devant l'écran d'accueil n'a pas su par où commencer. Toute personne doit comprendre la boucle (proches → invitation → repas réalisé → mémoire des plats) sans aide.

## Product Purpose

Attablés est un carnet d'invitations personnel 100 % hors ligne : foyers et convives, allergies strictes et préférences, menus, et mémoire anti-doublon des plats servis. Aucun compte, aucun réseau, aucune collecte ; les données restent sur le téléphone.

Réussir, c'est : une allergie stricte impossible à rater au moment de composer un menu, un plat récent signalé avant d'être resservi, et une première minute où l'on sait quoi faire.

## Brand Personality

Chaleureux, gourmand, rassurant. La table d'un bouchon lyonnais en novembre : chaude, appétissante, accueillante, et en même temps sûre d'elle quand il s'agit des allergies. Le ton est simple et direct, en français courant, sans jargon technique ni familiarité forcée ; il parle de « proches », de « repas », de « plats », pas d'« entités » ni de « données ».

## Anti-references

- Le tableau de bord SaaS froid : cartes grises identiques, chiffres en vedette, ton d'entreprise.
- L'appli de recettes surchargée : photos de plats partout, publicité, flux à faire défiler sans fin.
- Les icônes à la place des mots : les noms des plats, des convives et des allergies restent écrits en toutes lettres ; un pictogramme accompagne, il ne remplace pas.

## Design Principles

1. **L'allergie crie, le reste parle bas.** Une allergie stricte est l'information la plus visible de tout écran où elle compte, toujours sous la même forme (« Allergène — Prénom »). Aucune autre couleur ou alerte ne lui fait concurrence.
2. **Une action évidente par écran.** Quelqu'un qui découvre l'appli doit savoir quoi toucher en premier ; les états vides guident vers la prochaine étape au lieu de constater un manque.
3. **La mémoire avant la saisie.** L'appli rappelle ce qu'elle sait (déjà servi, coups de cœur, allergies réunies) au moment où l'on décide, plutôt que de demander de remplir des formulaires.
4. **Gourmand sans être bavard.** La chaleur vient de la couleur, de la typographie et des mots ; pas de décor, de photos ou d'animations qui ralentissent la lecture.
5. **Rien ne se perd.** Toute action destructrice s'annule, toute donnée reste locale, et l'export pour une IA est anonymisé par défaut.

## Accessibility & Inclusion

WCAG 2.2 niveau AA : contrastes de 4,5:1 pour le texte (3:1 pour le gros texte et les éléments d'interface), vérifiés par test sur les jetons de couleur, en clair comme en sombre ; cibles tactiles de 44 px au minimum ; l'information n'est jamais portée par la couleur seule (icône et texte avec chaque état) ; lecteurs d'écran (libellés, rôles, états cochés/ouverts) ; préférence « mouvement réduit » respectée. Public large, seniors compris : textes lisibles sans zoom, gestes simples (toucher, pas de glissements obligatoires), bouton Retour d'Android toujours fiable. L'appli tourne aussi sur d'anciennes WebView Android : pas de fonctionnalité CSS ou JS récente sans repli.
