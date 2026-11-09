// Names for the illustrative "multiplayer" cursors. Roles, not people.
export const CAST = ['design', 'copy', 'dev', 'PM', 'QA', 'SEO', 'client', 'frontend', 'backend', 'a11y'];
export const who = (i) => CAST[i % CAST.length];
