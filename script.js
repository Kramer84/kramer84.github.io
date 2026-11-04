const LANGS = ['fr', 'en'];
let dataPromise = null;
let lastRequest = 0;

function loadData() {
    if (!dataPromise) {
        dataPromise = fetch('./data.json').then(response => {
            if (!response.ok) throw new Error(`data.json: ${response.status}`);
            return response.json();
        });
        dataPromise.catch(() => { dataPromise = null; }); // allow a retry on the next click
    }
    return dataPromise;
}

// Storage can be blocked (private mode), so it only ever acts as a convenience.
function savedLang() {
    try {
        const lang = localStorage.getItem('preferredLang');
        return LANGS.includes(lang) ? lang : null;
    } catch {
        return null;
    }
}

function saveLang(lang) {
    try {
        localStorage.setItem('preferredLang', lang);
    } catch {
        // Nothing to do: the page still works in this language.
    }
}

function browserLang() {
    return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function buildCard(item, icon, title) {
    const a = document.createElement('a');
    a.href = item.url;
    a.className = 'btn btn-repo';
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML = `
        <span class="repo-name"><i class="fa-solid ${icon}" aria-hidden="true"></i> ${title}</span>
        <span class="repo-desc">${item.description}</span>
    `;
    return a;
}

function buildLinks(links) {
    const row = document.createElement('div');
    row.className = 'card-links';
    links.forEach(link => {
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = link.label;
        row.appendChild(a);
    });
    return row;
}

function buildStaticCard(item) {
    const div = document.createElement('div');
    div.className = 'btn btn-repo card-static';
    div.innerHTML = `
        <span class="repo-name"><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> ${item.name}</span>
        <span class="repo-desc">${item.description}</span>
    `;
    return div;
}

function render(content, lang) {
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        // Handle nested keys like labels.skills
        el.textContent = key.split('.').reduce((obj, part) => obj[part], content);
    });

    document.querySelectorAll('.lang-switcher button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });

    const skillsList = document.getElementById('skills-list');
    skillsList.replaceChildren(...content.skills.map(skill => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.textContent = skill;
        return span;
    }));

    document.getElementById('publications-list').replaceChildren(
        ...content.publications.map(pub => buildCard(pub, 'fa-book', pub.title))
    );
    document.getElementById('repo-list').replaceChildren(
        ...content.repositories.flatMap(repo => {
            const card = buildCard(repo, 'fa-code-branch', repo.name);
            return repo.links ? [card, buildLinks(repo.links)] : [card];
        })
    );
    document.getElementById('other-list').replaceChildren(
        ...content.other_projects.map(buildStaticCard)
    );
}

async function switchLang(lang) {
    const request = ++lastRequest;
    try {
        const data = await loadData();
        if (request !== lastRequest) return; // a later click wins
        render(data[lang], lang);
        saveLang(lang);
    } catch (error) {
        // The name, title and contact details are in the HTML, so the page stays useful.
        console.error(error);
    }
}

window.onload = () => {
    switchLang(savedLang() || browserLang());
};
