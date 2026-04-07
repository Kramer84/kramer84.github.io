async function switchLang(lang) {
    const response = await fetch('./data.json');
    const data = await response.json();
    const content = data[lang];

    // Update simple fields
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        // Handle nested keys like labels.networks
        const value = key.split('.').reduce((obj, i) => obj[i], content);
        el.innerText = value;
    });

    // Save preference
    localStorage.setItem('preferredLang', lang);
}

// Load default language on start
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'fr';
    switchLang(savedLang);
};
