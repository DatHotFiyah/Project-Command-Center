let xpData;
try {
  xpData = JSON.parse(document.getElementById('embedded-xp').textContent);
} catch (e) {
  xpData = { projects: [], system: {}, events: [] };
}

const assets = {
  characters: xpData.projects.map(p => ({
    src: p.sprite || 'assets/characters/atari_char_green_dev.png',
    name: p.name,
    type: 'char',
    width: 90, height: 240,
    project: p
  })).concat([
    { src: 'assets/characters/atari_char_pink_manager.png', name: 'Project Manager', type: 'char', width: 90, height: 240,
      sysInfo: { level: "SYS", xp: xpData.system.momentum, nextLevelXp: 100, name: "SYSTEM OPS", role: "OPS", mood: "OVERSEEING", task: `OPEN LOOPS: ${xpData.system.openLoops}` }
    }
  ]),
  furniture: [
    { src: 'assets/furniture/terminal_tall.png', name: 'Main Frame', type: 'terminal', width: 120, height: 220, sysInfo: { level: "SYS", xp: xpData.system.momentum, nextLevelXp: 100, name: "MAIN FRAME", role: "CORE", mood: "ONLINE", task: `OPEN LOOPS: ${xpData.system.openLoops}` } },
    { src: 'assets/furniture/filing_cabinet.png', name: 'Archive', type: 'cabinet', width: 130, height: 250, archiveInfo: { level: "DB", xp: xpData.system.memoryIntegrity, nextLevelXp: 100, name: "ARCHIVE DB", role: "BACKUP", mood: "SECURE", task: `STREAK: ${xpData.system.journalStreak} DAYS` } },
    { src: 'assets/furniture/desk_stationary.png', name: 'Workstation 1', type: 'desk', width: 220, height: 180 },
    { src: 'assets/furniture/desk_side.png', name: 'Workstation 2', type: 'desk', width: 220, height: 180 },
    { src: 'assets/furniture/chair.png', name: 'Office Chair', type: 'chair', width: 90, height: 143 },
    { src: 'assets/furniture/plant.png', name: 'Potted Fern', type: 'plant', width: 100, height: 180 },
    { src: 'assets/furniture/server_rack_v2.png', name: 'Server Rack', type: 'rack', width: 120, height: 200, sysInfo: { level: "RACK", xp: xpData.system.reposOnline * 100, nextLevelXp: 500, name: "REMOTE SERVERS", role: "SYNC AGENT", mood: "SYNCED", task: `REPOS ONLINE: ${xpData.system.reposOnline}` } },
    { src: 'assets/furniture/coffee_station_v2.png', name: 'Coffee Station', type: 'coffee', width: 90, height: 120 },
    { src: 'assets/furniture/whiteboard_v2.png', name: 'Whiteboard', type: 'board', width: 160, height: 160, sysInfo: { level: "PLAN", xp: xpData.system.momentum, nextLevelXp: 100, name: "STRATEGY BOARD", role: "ROADMAP", mood: "FOCUSED", task: `MOMENTUM: ${xpData.system.momentum}%` } },
    { src: 'assets/furniture/lounge_sofa.png', name: 'Lounge Sofa', type: 'sofa', width: 200, height: 100 }
  ],
  symbols: [
    { src: 'assets/symbols/sym_circuit_v2.png', name: 'Circuit', type: 'symbol', width: 64, height: 64, sysInfo: { level: "HW", xp: 100, nextLevelXp: 100, name: "HARDWARE", role: "DIAGNOSTICS", mood: "NOMINAL", task: "CPU AT 22%" } },
    { src: 'assets/symbols/sym_db_v2.png', name: 'Database', type: 'symbol', width: 64, height: 64, sysInfo: { level: "DB", xp: xpData.system.memoryIntegrity, nextLevelXp: 100, name: "ARCHIVE DB", role: "STORAGE", mood: "SECURE", task: `STREAK: ${xpData.system.journalStreak} DAYS` } },
    { src: 'assets/symbols/sym_signal_v2.png', name: 'Signal', type: 'symbol', width: 64, height: 64, sysInfo: { level: "NET", xp: 98, nextLevelXp: 100, name: "UPLINK", role: "NETWORK", mood: "STABLE", task: "PING 12ms" } },
    { src: 'assets/symbols/sym_lock_v2.png', name: 'Security', type: 'symbol', width: 64, height: 64, sysInfo: { level: "SEC", xp: 100, nextLevelXp: 100, name: "SECURITY", role: "FIREWALL", mood: "LOCKED", task: "NO INTRUSIONS" } }
  ]
};

const objectsLayer = document.getElementById('objects');
const filters = document.querySelectorAll('.pixel-btn');
const activeSprites = [];
let loopsCollapsed = true;

function toggleOpenLoops() {
  const body = document.getElementById('open-loops-body');
  const toggle = document.getElementById('open-loops-toggle');
  loopsCollapsed = !loopsCollapsed;
  body.classList.toggle('collapsed', loopsCollapsed);
  toggle.textContent = loopsCollapsed ? '\u25BC' : '\u25B2';
}

function renderDashboardStats() {
  if (xpData.system) {
    const drift = document.getElementById('val-drift');
    const momentum = document.getElementById('val-momentum');
    if (drift) drift.textContent = xpData.system.memoryIntegrity + '%';
    if (momentum) momentum.textContent = xpData.system.momentum + '%';
  }
}

function updateStatusPanel(info) {
  if (!info) return;
  const el = (id) => document.getElementById(id);
  if (el('val-level')) el('val-level').textContent = 'LVL ' + info.level;
  if (el('val-xp-text')) el('val-xp-text').textContent = info.xp + ' / ' + info.nextLevelXp + ' XP';
  if (el('val-xp-fill')) el('val-xp-fill').style.width = ((info.xp / info.nextLevelXp) * 100) + '%';
  if (el('val-project-name')) el('val-project-name').textContent = (info.name || '').toUpperCase();
  if (el('val-project-status')) el('val-project-status').textContent = (info.mood || '').toUpperCase();
  if (el('val-project-task')) el('val-project-task').textContent = (info.task || 'ALL SYSTEMS NOMINAL').toUpperCase();
  if (el('val-role')) el('val-role').textContent = (info.role || 'SYSTEM OPS').toUpperCase();
  renderDashboardStats();
}

function renderOpenLoops() {
  const content = document.getElementById('open-loops-content');
  const countEl = document.getElementById('open-loops-count');
  if (!content) return;
  let allTasks = [];
  let html = '';
  for (let i = 0; i < xpData.projects.length; i++) {
    const project = xpData.projects[i];
    if (!project.openTasks || project.openTasks.length === 0) continue;
    const tasks = Array.isArray(project.openTasks) ? project.openTasks : [project.openTasks];
    allTasks = allTasks.concat(tasks);
    html += '<div class="open-loops-group">';
    html += '<div class="open-loops-group-title">' + project.name + ' (' + tasks.length + ')</div>';
    html += '<ul class="open-loops-list">';
    for (let j = 0; j < tasks.length; j++) {
      const t = tasks[j];
      const escaped = t.replace(/"/g, '&quot;').replace(/\\/g, '\\\\');
      html += '<li class="open-loops-item">';
      html += '<input type="checkbox" data-slug="' + project.slug + '" data-task="' + escaped + '" onchange="markTaskDone(this)">';
      html += '<label>' + t + '</label>';
      html += '</li>';
    }
    html += '</ul></div>';
  }
  content.innerHTML = html || '<div style="color: #0f0; font-size: 0.7rem; padding: 8px;">ALL CLEAR</div>';
  if (countEl) countEl.textContent = allTasks.length;
}

function markTaskDone(checkbox) {
  if (!checkbox.checked) return;
  const slug = checkbox.dataset.slug;
  const task = checkbox.dataset.task;
  const item = checkbox.closest('.open-loops-item');
  if (item) { item.style.opacity = '0.4'; item.style.textDecoration = 'line-through'; }
  checkbox.disabled = true;
  let proj = null;
  for (let i = 0; i < xpData.projects.length; i++) {
    if (xpData.projects[i].slug === slug) { proj = xpData.projects[i]; break; }
  }
  if (proj) {
    if (!proj.completedTasks) proj.completedTasks = [];
    if (proj.completedTasks.indexOf(task) === -1) {
      proj.completedTasks.push(task);
      proj.openTasks = proj.openTasks.filter(t => t !== task);
      if (proj.openTasks.length > 0) { proj.task = proj.openTasks[0]; }
      else { proj.task = 'ALL TASKS COMPLETE'; proj.mood = 'stable'; }
      proj.xp = (proj.xp || 0) + 50;
      const newLevel = Math.floor(proj.xp / 200) + 1;
      if (newLevel > proj.level) proj.level = newLevel;
    }
    updateStatusPanel(proj);
    renderOpenLoops();
  }
}

function renderRoster() {
  const rosterEl = document.getElementById('roster-list');
  if (!rosterEl || !xpData.projects) return;
  let html = '';
  for (let i = 0; i < xpData.projects.length; i++) {
    const p = xpData.projects[i];
    const pct = Math.round((p.xp / p.nextLevelXp) * 100);
    const shortName = p.name.substring(0, 22);
    html += '<div class="roster-item" data-slug="' + p.slug + '" style="cursor:pointer; margin-bottom:4px; font-size:11px; line-height:1.3;">';
    html += '<span style="color:#ff0;">' + shortName + '</span> \u00B7 <span style="color:#0ff;">' + p.class + '</span> \u00B7 <span style="color:#0f0;">LVL ' + p.level + '</span> \u00B7 <span style="color:#f0f;">' + p.role + '</span>';
    html += '<div style="display:flex; justify-content:space-between; margin-top:2px;">';
    html += '<span style="color:#888;">' + p.mood + '</span>';
    html += '<span style="color:#0ff;">' + p.xp + '/' + p.nextLevelXp + ' XP (' + pct + '%)</span>';
    html += '</div>';
    html += '<div style="margin-top:2px; background:#222; height:4px; border-radius:2px;">';
    html += '<div style="background:#0f0; width:' + pct + '%; height:100%; border-radius:2px;"></div>';
    html += '</div></div>';
  }
  rosterEl.innerHTML = html;
  const items = rosterEl.querySelectorAll('.roster-item');
  items.forEach(el => {
    el.addEventListener('click', () => {
      const slug = el.getAttribute('data-slug');
      const proj = xpData.projects.find(p => p.slug === slug);
      if (proj) updateStatusPanel(proj);
    });
  });
}

function createObject(data, x, y) {
  const el = document.createElement('div');
  el.className = 'sprite ' + data.type;
  el.style.backgroundImage = "url('" + data.src + "')";
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.width = data.width + 'px';
  el.style.height = data.height + 'px';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.addEventListener('click', () => {
    if (data.project) updateStatusPanel(data.project);
    else if (data.sysInfo) updateStatusPanel(data.sysInfo);
    else if (data.archiveInfo) updateStatusPanel(data.archiveInfo);
  });
  objectsLayer.appendChild(el);
  const spriteObj = { element: el, data: data, x: x, y: y, vx: 0, vy: 0 };
  if (data.type === 'char') initCharacter(spriteObj);
  activeSprites.push(spriteObj);
}

function initCharacter(obj) {
  obj.targetX = obj.x;
  obj.targetY = obj.y;
  obj.speed = 0.8 + Math.random() * 0.5;
  const moveToRandom = () => {
    const floorTop = window.innerHeight * 0.55;
    const floorBottom = window.innerHeight * 0.85;
    obj.targetX = 100 + Math.random() * (window.innerWidth - 200);
    obj.targetY = floorTop + Math.random() * (floorBottom - floorTop);
    setTimeout(moveToRandom, 5000 + Math.random() * 5000);
  };
  setTimeout(moveToRandom, Math.random() * 3000);
}

function updateFrame() {
  activeSprites.forEach(obj => {
    if (obj.data.type === 'char') {
      const dx = obj.targetX - obj.x;
      const dy = obj.targetY - obj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        obj.x += (dx / dist) * obj.speed;
        obj.y += (dy / dist) * obj.speed;
        obj.element.style.left = Math.floor(obj.x) + 'px';
        obj.element.style.top = Math.floor(obj.y) + 'px';
        obj.element.style.transform = 'translate(-50%, -100%) ' + (dx < 0 ? 'scaleX(-1)' : 'scaleX(1)');
      }
      obj.element.style.zIndex = Math.floor(obj.y);
    } else if (obj.data.type === 'symbol') {
      obj.element.style.zIndex = 5;
    } else {
      obj.element.style.zIndex = Math.floor(obj.y);
    }
  });
  requestAnimationFrame(updateFrame);
}

function render(filter) {
  if (!filter) filter = 'all';
  objectsLayer.innerHTML = '';
  activeSprites.length = 0;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const commBody = document.getElementById('comm-body');
  if (xpData.events && xpData.events.length > 0 && commBody) {
    commBody.innerHTML = xpData.events.map(ev =>
      '<div class="comm-line"><span class="timestamp">[' + ev.timestamp + ']</span> <span class="event-type" style="color:#ff00ff;">[' + ev.character + ']</span>: ' + ev.text + (ev.xpGain ? ' <span class="xp-gain" style="color:#0f0;">+' + ev.xpGain + 'XP</span>' : '') + '</div>'
    ).join('');
    commBody.scrollTop = commBody.scrollHeight;
  }
  Object.keys(assets).forEach(category => {
    if (filter === 'all' || filter === category) {
      if (category === 'furniture') {
        const layouts = [
          { x: 0.1, y: 0.65, type: 0 }, { x: 0.85, y: 0.65, type: 1 },
          { x: 0.35, y: 0.75, type: 2 }, { x: 0.65, y: 0.75, type: 3 },
          { x: 0.3, y: 0.8, type: 4 }, { x: 0.7, y: 0.8, type: 4 },
          { x: 0.95, y: 0.8, type: 5 }, { x: 0.05, y: 0.8, type: 5 },
          { x: 0.2, y: 0.65, type: 6 },
          { x: 0.9, y: 0.7, type: 7 },
          { x: 0.6, y: 0.6, type: 8 },
          { x: 0.8, y: 0.85, type: 9 }
        ];
        layouts.forEach(pos => {
          const item = assets.furniture[pos.type % assets.furniture.length];
          createObject(item, pos.x * width, pos.y * height);
        });
      } else if (category === 'characters') {
        assets[category].forEach((item, index) => {
          const x = 200 + (index * 0.15 * width) % (width - 400);
          const y = (window.innerHeight * 0.65) + (index * 30) % (window.innerHeight * 0.2);
          createObject(item, x, y);
        });
      } else {
        assets[category].forEach((item, index) => {
          const x = (0.1 + index * 0.15) * width;
          const y = height * 0.3;
          createObject(item, x, y);
        });
      }
    }
  });
}

filters.forEach(btn => {
  btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.filter);
  });
});

window.addEventListener('resize', () => render());

render();
updateFrame();
renderDashboardStats();
renderRoster();
renderOpenLoops();
if (xpData.projects.length > 0) updateStatusPanel(xpData.projects[0]);