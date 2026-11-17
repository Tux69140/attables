// Le pied de site, commun à mes sites (Paré, Baluchon, Avec Dieu, Veilleuse, BioVibraLyon) : ce fichier et
// pied-de-site.css se recopient tels quels ; chaque site n'écrit que son contenu et ses couleurs (ici pied-pare.js et
// pied-pare.css). Sans dépendance : il marche avec Vite, Astro ou React. Maquette : .scratch/pied-de-site/maquette.html.
// La page garde dans son <footer data-pied-de-site> les liens légaux, pour qui n'a pas JavaScript.

// Ce qui ne change pas d'un site à l'autre. Une application s'ajoute ici quand elle a une adresse en ligne.
const COMMUN = {
  auteur: 'Stéphane MICHEL',
  // L'adresse e-mail en deux morceaux : elle ne se compose qu'au clic, un robot qui lit la page ne la trouve pas.
  contact: { utilisateur: 'stephane', domaine: 'biovibralyon.fr', page: '/mentions-legales.html' },
  portail: { texte: 'Le portail BioVibraLyon', href: 'https://www.biovibralyon.fr/' },
  reseaux: [
    { nom: 'Facebook', href: 'https://www.facebook.com/biovibralyon', dessin: 'M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z' },
    { nom: 'YouTube', href: 'https://www.youtube.com/@biovibralyon', dessin: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15.1V8.9l5.8 3.1-5.8 3.1Z' },
    { nom: 'Telegram', href: 'https://t.me/Biovibralyon', dessin: 'M21.9 4.3 18.7 19.5c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-5 9-8.1c.4-.3-.1-.5-.6-.2L6.2 13.2l-4.8-1.5c-1-.3-1-1 .2-1.5L20.5 3c.9-.3 1.6.2 1.4 1.3Z' },
  ],
  applications: [
    { texte: 'Paré', href: 'https://urgence.biovibralyon.fr/' },
    { texte: 'Baluchon', href: 'https://baluchon.biovibralyon.fr/' },
    { texte: 'Attablés', href: 'https://attables.biovibralyon.fr/' },
  ],
};

const echapper = texte => String(texte).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Ce qui mène hors du site s'ouvre à part, le site reste ouvert derrière.
const ouverture = l => (l.nouvelOnglet || /^https:/.test(l.href) ? ' target="_blank" rel="noopener"' : '');
const lien = l => `<a href="${echapper(l.href)}"${ouverture(l)}>${echapper(l.texte)}</a>`;
const liste = liens => `<ul>${liens.map(l => `<li>${lien(l)}</li>`).join('')}</ul>`;
const ecrire = (texte, sujet) => `<li><a href="${echapper(COMMUN.contact.page)}" data-ecrire="${echapper(sujet)}">${echapper(texte)}</a></li>`;

function contenu(site) {
  const autres = COMMUN.applications.filter(a => a.texte !== site.nom);
  return `<div class="pied-haut">
      <div>
        <p class="pied-marque">${site.logo}${echapper(site.nom)}</p>
        <p class="pied-phrase">${echapper(site.phrase)}</p>
        <ul>${ecrire('Me contacter', `${site.nom} : prise de contact`)}${ecrire('Signaler un problème', `${site.nom} : un problème à signaler`)}</ul>
      </div>
      <div><h2>${echapper(site.nom)}</h2>${liste(site.liens)}</div>
      <div><h2>Informations légales</h2>${liste(site.legal)}</div>
      <div>
        <h2>Me suivre</h2>
        <div class="pied-reseaux">${COMMUN.reseaux.map(r => `<a href="${echapper(r.href)}" aria-label="${echapper(r.nom)}"${ouverture(r)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${r.dessin}"/></svg></a>`).join('')}</div>
        ${liste([COMMUN.portail])}
        ${autres.length ? `<details class="pied-famille"><summary>Mes autres applications</summary>${liste(autres)}</details>` : ''}
      </div>
    </div>
    <div class="pied-bas"><div class="pied-bas-inner">
      <span>© ${new Date().getFullYear()} ${echapper(COMMUN.auteur)}</span>
      <span>${echapper(site.engagement)}</span>
      <span>Version ${echapper(site.version)} · <a href="#">Haut de page ↑</a></span>
    </div></div>`;
}

export function poserPied(site) {
  const pied = document.querySelector('[data-pied-de-site]');
  if (!pied) return;
  pied.innerHTML = contenu(site);
  pied.addEventListener('click', (evenement) => {
    const a = evenement.target.closest('[data-ecrire]');
    if (a) a.href = `mailto:${COMMUN.contact.utilisateur}@${COMMUN.contact.domaine}?subject=${encodeURIComponent(a.dataset.ecrire)}`;
  });
}
