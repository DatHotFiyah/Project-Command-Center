async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function toneFor(value = '') {
  const v = String(value).toLowerCase();
  if (v.includes('strong') || v.includes('stable') || v.includes('protected') || v.includes('live')) return 'strong';
  if (v.includes('need') || v.includes('pending') || v.includes('improving')) return 'warn';
  return 'active';
}

async function boot() {
  const [overview, loops, projectsData, wins] = await Promise.all([
    loadJson('../state/overview.json'),
    loadJson('../state/open-loops.json'),
    loadJson('../state/projects.json'),
    loadJson('../state/recent-wins.json')
  ]);

  document.getElementById('headline').textContent = overview.focus.headline;
  document.getElementById('focus-status').textContent = overview.focus.status;
  document.getElementById('updated-at').textContent = `Updated: ${overview.updatedAt}`;

  const focusNotes = document.getElementById('focus-notes');
  overview.focus.notes.forEach(note => focusNotes.appendChild(el('li', '', note)));

  const recentWins = document.getElementById('recent-wins');
  wins.items.forEach(note => recentWins.appendChild(el('li', '', note)));

  const projects = document.getElementById('projects');
  overview.projects.forEach(project => {
    const card = el('div', 'item');
    card.appendChild(el('h3', '', project.name));
    const badges = el('div', 'badges');
    const status = el('span', `badge ${toneFor(project.status)}`, project.status);
    const health = el('span', `badge ${toneFor(project.health)}`, project.health);
    badges.append(status, health);
    card.appendChild(badges);
    const ul = el('ul', 'list');
    project.notes.forEach(n => ul.appendChild(el('li', '', n)));
    card.appendChild(ul);
    projects.appendChild(card);
  });

  const openLoops = document.getElementById('open-loops');
  loops.items.forEach(loop => {
    const card = el('div', 'item');
    card.appendChild(el('h3', '', loop.title));
    const badges = el('div', 'badges');
    badges.appendChild(el('span', `badge ${toneFor(loop.priority)}`, loop.priority));
    badges.appendChild(el('span', `badge ${toneFor(loop.status)}`, loop.status));
    card.appendChild(badges);
    card.appendChild(el('div', 'meta', loop.detail));
    openLoops.appendChild(card);
  });

  const memoryStatus = document.getElementById('memory-status');
  Object.entries(overview.memoryStatus).forEach(([key, value]) => {
    const tile = el('div', 'tile');
    tile.appendChild(el('div', 'label', key));
    tile.appendChild(el('div', 'value', value));
    memoryStatus.appendChild(tile);
  });

  const repoStatus = document.getElementById('repo-status');
  Object.entries(overview.repoStatus).forEach(([key, value]) => {
    const tile = el('div', 'tile');
    tile.appendChild(el('div', 'label', key));
    tile.appendChild(el('div', 'value', value));
    repoStatus.appendChild(tile);
  });

  const signals = document.getElementById('signals');
  overview.signals.forEach(signal => signals.appendChild(el('li', '', signal)));
}

boot().catch(err => {
  document.getElementById('headline').textContent = 'Dashboard failed to hydrate.';
  document.getElementById('focus-status').textContent = 'error';
  console.error(err);
});
