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

    // Update Skills List
    const skillsList = document.getElementById('skills-list');
    skillsList.innerHTML = ''; // Clear old skills
    content.skills.forEach(skill => {
        const span = document.createElement('span');
        span.className = 'skill-tag';
        span.innerText = skill;
        skillsList.appendChild(span);
    });

    // Dynamically build the repository list
    const repoList = document.getElementById('repo-list');
    repoList.innerHTML = ''; // Clear out the old list

    content.repositories.forEach(repo => {
        const a = document.createElement('a');
        a.href = repo.url;
        a.className = 'btn btn-repo';
        a.target = '_blank';
        //a.innerText = repo.name;
        // Use innerHTML to combine the FontAwesome icon with the repository name
        a.innerHTML = `
            <span class="repo-name"><i class="fa-solid fa-code-branch"></i> ${repo.name}</span>
            <span class="repo-desc">${repo.description}</span>
        `;
        repoList.appendChild(a); // Add the link to the page
    });

    // Save preference
    localStorage.setItem('preferredLang', lang);
}

// Load default language on start
window.onload = () => {
    const savedLang = localStorage.getItem('preferredLang') || 'fr';
    switchLang(savedLang);
};
