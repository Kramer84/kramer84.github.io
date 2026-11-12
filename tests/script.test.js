// Behaviour tests for script.js. Run from the repo root: node --test tests/
// script.js runs in a vm sandbox with a tiny fake DOM, fetch and localStorage, so nothing is installed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

class El {
    constructor(tag = 'div', attrs = {}) {
        this.tag = tag;
        this.attrs = { ...attrs };
        this.dataset = {};
        this.children = [];
        this.textContent = '';
        this.innerHTML = '';
        this.className = '';
    }
    getAttribute(name) { return this.attrs[name]; }
    setAttribute(name, value) { this.attrs[name] = value; }
    appendChild(child) { this.children.push(child); }
    replaceChildren(...children) { this.children = children; }
}

const FIXTURE = {
    fr: content('fr'),
    en: content('en'),
};

function content(lang) {
    return {
        name: `name-${lang}`,
        labels: { skills: `skills-${lang}` },
        skills: [`skill-a-${lang}`, `skill-b-${lang}`],
        publications: [{ title: `pub-${lang}`, description: 'R&amp;D', url: 'https://example.org/p' }],
        repositories: [
            { name: `repo-${lang}`, description: 'd', url: 'https://example.org/r', links: [{ label: 'Docs', url: 'https://example.org/docs' }] },
            { name: `bare-${lang}`, description: 'd', url: 'https://example.org/b' },
        ],
        other_projects: [{ name: `other-${lang}`, description: 'd' }],
    };
}

// dataKeys: the data-key values present in the page; fetchImpl: replaces fetch.
function setup({ dataKeys = ['name', 'labels.skills'], language = 'en', store = {}, storageBroken = false, fetchImpl } = {}) {
    const keyed = dataKeys.map(key => Object.assign(new El('span', { 'data-key': key }), { textContent: 'fallback' }));
    const buttons = ['fr', 'en'].map(lang => Object.assign(new El('button'), { dataset: { lang } }));
    const byId = Object.fromEntries(
        ['skills-list', 'publications-list', 'repo-list', 'other-list'].map(id => [id, new El('div')]),
    );
    const document = {
        documentElement: new El('html'),
        querySelectorAll: selector => (selector === '[data-key]' ? keyed : buttons),
        getElementById: id => byId[id],
        createElement: tag => new El(tag),
    };
    const localStorage = storageBroken
        ? { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } }
        : { getItem: key => store[key] ?? null, setItem: (key, value) => { store[key] = value; } };
    const calls = [];
    const fetch = fetchImpl || (async () => ({ ok: true, json: async () => FIXTURE }));
    const sandbox = {
        document, localStorage, navigator: { language }, console: { error() {} },
        fetch: (...args) => { calls.push(args); return fetch(...args); },
    };
    const ctx = vm.createContext(sandbox);
    return { ctx, keyed, buttons, byId, document, store, calls, load: () => vm.runInContext(SCRIPT, ctx) };
}

// Startup calls switchLang without awaiting it, so let the pending promises settle.
const settle = () => new Promise(resolve => setImmediate(resolve));

test('fills data-key text, including nested keys, in the chosen language', async () => {
    const page = setup();
    page.load();
    await settle();
    await vm.runInContext("switchLang('fr')", page.ctx);
    assert.deepEqual(page.keyed.map(el => el.textContent), ['name-fr', 'skills-fr']);
    assert.equal(page.document.documentElement.lang, 'fr');
});

test('marks only the active language button as pressed', async () => {
    const page = setup();
    page.load();
    await vm.runInContext("switchLang('fr')", page.ctx);
    assert.deepEqual(page.buttons.map(b => b.attrs['aria-pressed']), ['true', 'false']);
});

test('builds skills, publication cards, repo cards with link rows, and static cards', async () => {
    const page = setup();
    page.load();
    await vm.runInContext("switchLang('en')", page.ctx);
    const { byId } = page;

    assert.deepEqual(byId['skills-list'].children.map(c => c.textContent), ['skill-a-en', 'skill-b-en']);

    const [pub] = byId['publications-list'].children;
    assert.equal(pub.href, 'https://example.org/p');
    assert.equal(pub.rel, 'noopener');
    assert.match(pub.innerHTML, /pub-en/);
    assert.match(pub.innerHTML, /R&amp;D/);

    // A repo with links gives card + link row; one without gives the card alone.
    const repoKids = byId['repo-list'].children;
    assert.equal(repoKids.length, 3);
    assert.equal(repoKids[1].className, 'card-links');
    assert.equal(repoKids[1].children[0].textContent, 'Docs');
    assert.equal(repoKids[1].children[0].href, 'https://example.org/docs');
    assert.match(repoKids[2].innerHTML, /bare-en/);

    const [other] = byId['other-list'].children;
    assert.equal(other.href, undefined);
    assert.match(other.innerHTML, /other-en/);
});

test('startup language: saved choice wins, an invalid one is ignored, then the browser language', async () => {
    const cases = [
        { store: { preferredLang: 'en' }, language: 'fr-FR', expected: 'en' },
        { store: { preferredLang: 'de' }, language: 'fr-FR', expected: 'fr' },
        { store: {}, language: 'fr-CA', expected: 'fr' },
        { store: {}, language: 'de-DE', expected: 'en' },
        { store: {}, language: undefined, expected: 'en' },
    ];
    for (const { store, language, expected } of cases) {
        const page = setup({ store: { ...store }, language });
        page.load();
        await settle();
        assert.equal(page.keyed[0].textContent, `name-${expected}`, JSON.stringify({ store, language }));
    }
});

test('remembers the language after a successful render', async () => {
    const page = setup();
    page.load();
    await vm.runInContext("switchLang('fr')", page.ctx);
    assert.equal(page.store.preferredLang, 'fr');
});

test('still renders when localStorage is blocked', async () => {
    const page = setup({ storageBroken: true, language: 'fr' });
    page.load();
    await settle();
    assert.equal(page.keyed[0].textContent, 'name-fr');
});

test('a failed fetch leaves the HTML fallback untouched and the next click retries', async () => {
    let attempt = 0;
    const page = setup({
        fetchImpl: async () => (++attempt === 1
            ? { ok: false, status: 503 }
            : { ok: true, json: async () => FIXTURE }),
    });
    page.load();
    await settle();
    assert.equal(page.keyed[0].textContent, 'fallback');
    assert.equal(page.store.preferredLang, undefined);

    await vm.runInContext("switchLang('en')", page.ctx);
    assert.equal(page.keyed[0].textContent, 'name-en');
    assert.equal(page.calls.length, 2);
});

test('data.json is fetched once however many times the language changes', async () => {
    const page = setup();
    page.load();
    await settle();
    await vm.runInContext("switchLang('fr')", page.ctx);
    await vm.runInContext("switchLang('en')", page.ctx);
    assert.equal(page.calls.length, 1);
});

test('when clicks overlap, the last one wins', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const page = setup({ fetchImpl: async () => { await gate; return { ok: true, json: async () => FIXTURE }; } });
    const rendered = [];
    Object.defineProperty(page.document.documentElement, 'lang', { set: lang => rendered.push(lang) });
    page.load(); // startup request ('en' for this browser) is the oldest
    const first = vm.runInContext("switchLang('fr')", page.ctx);
    const second = vm.runInContext("switchLang('en')", page.ctx);
    release();
    await Promise.all([first, second]);
    await settle();
    assert.equal(page.keyed[0].textContent, 'name-en');
    assert.equal(page.store.preferredLang, 'en');
    assert.deepEqual(rendered, ['en']); // older requests never paint, not even briefly
});

test('the real data.json renders in both languages for every data-key in index.html', async () => {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const keys = [...html.matchAll(/data-key="([^"]+)"/g)].map(m => m[1]);
    assert.ok(keys.length > 0);
    for (const lang of ['fr', 'en']) {
        const page = setup({
            dataKeys: keys,
            fetchImpl: async () => ({ ok: true, json: async () => data }),
        });
        page.load();
        await vm.runInContext(`switchLang('${lang}')`, page.ctx);
        page.keyed.forEach((el, i) => {
            assert.ok(el.textContent && el.textContent !== 'fallback' && el.textContent !== 'undefined', `${lang} ${keys[i]}`);
        });
        assert.equal(page.byId['skills-list'].children.length, data[lang].skills.length);
        assert.equal(page.byId['repo-list'].children.length,
            data[lang].repositories.reduce((n, r) => n + (r.links ? 2 : 1), 0));
    }
});
