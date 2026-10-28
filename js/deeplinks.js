// Old modal deep links (/#project-<id>) now go to the project's own page.
export const PROJECT_PAGES = {
    'ferment-formula': '/work/the-ferment-formula.html',
    'proposal-forge': '/work/proposalforge.html',
    'siteaudit-pro': '/work/siteaudit-pro.html',
    'brandkit-studio': '/work/brandkit-studio.html',
    'dashboardstudio': '/work/dashboard-studio.html',
};

export function projectPageFor(hash) {
    const m = /^#project-(.+)$/.exec(hash || '');
    return m ? PROJECT_PAGES[m[1]] || null : null;
}

export function initDeeplinks() {
    const go = () => {
        const page = projectPageFor(location.hash);
        if (page) location.replace(page);
    };
    go();
    window.addEventListener('hashchange', go);
}
