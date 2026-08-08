<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FlavorFind API Tester</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0f0f; color: #e0e0e0; font-family: 'Segoe UI', monospace; }
  header { background: #1a1a1a; border-bottom: 1px solid #333; padding: 16px 24px; display: flex; align-items: center; gap: 12px; position: sticky; top: 0; z-index: 100; }
  header h1 { font-size: 20px; color: #ff6b35; }
  header span { font-size: 13px; color: #888; }
  .status-bar { margin-left: auto; display: flex; gap: 16px; font-size: 12px; }
  .status-bar .stat { background: #252525; padding: 4px 10px; border-radius: 4px; }
  .stat .val { color: #4ade80; font-weight: bold; }
  .stat.warn .val { color: #facc15; }
  .stat.danger .val { color: #f87171; }

  .layout { display: flex; height: calc(100vh - 57px); }
  .sidebar { width: 260px; min-width: 260px; background: #141414; border-right: 1px solid #2a2a2a; overflow-y: auto; padding: 12px 0; }
  .sidebar-section { padding: 6px 16px 4px; font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
  .endpoint-btn { width: 100%; text-align: left; background: none; border: none; padding: 9px 16px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: background .15s; }
  .endpoint-btn:hover { background: #1e1e1e; }
  .endpoint-btn.active { background: #1e2a1e; border-left: 3px solid #4ade80; }
  .method { font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 3px; min-width: 36px; text-align: center; }
  .GET { background: #1a3a1a; color: #4ade80; }
  .POST { background: #1a2a3a; color: #60a5fa; }
  .endpoint-path { font-size: 12px; color: #ccc; }

  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
  .top-panel { padding: 20px 24px; border-bottom: 1px solid #2a2a2a; background: #141414; }
  .endpoint-title { font-size: 18px; font-weight: bold; color: #fff; margin-bottom: 4px; }
  .endpoint-desc { font-size: 13px; color: #888; }

  .panels { display: flex; flex: 1; overflow: hidden; }
  .request-panel { width: 420px; min-width: 420px; border-right: 1px solid #2a2a2a; display: flex; flex-direction: column; overflow-y: auto; }
  .response-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .panel-header { padding: 12px 16px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a; font-size: 12px; font-weight: bold; color: #888; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between; }
  .panel-body { padding: 16px; flex: 1; overflow-y: auto; }

  .field-group { margin-bottom: 14px; }
  .field-group label { display: block; font-size: 11px; color: #888; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .5px; }
  .field-group label span { color: #f87171; }
  .field-group input, .field-group select, .field-group textarea {
    width: 100%; background: #1e1e1e; border: 1px solid #333; color: #e0e0e0;
    padding: 8px 10px; border-radius: 5px; font-size: 13px; font-family: inherit;
    transition: border .15s;
  }
  .field-group input:focus, .field-group select:focus, .field-group textarea:focus { outline: none; border-color: #4ade80; }
  .field-group .hint { font-size: 11px; color: #555; margin-top: 4px; }

  .send-btn { width: 100%; padding: 11px; background: #16a34a; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background .15s; margin-top: 4px; }
  .send-btn:hover { background: #15803d; }
  .send-btn:active { background: #166534; }
  .send-btn.loading { background: #374151; cursor: not-allowed; }

  .curl-box { background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 5px; padding: 10px 12px; font-size: 11px; color: #a3e635; font-family: monospace; word-break: break-all; line-height: 1.6; position: relative; }
  .copy-btn { position: absolute; top: 6px; right: 6px; background: #333; border: none; color: #aaa; padding: 3px 8px; border-radius: 3px; font-size: 10px; cursor: pointer; }
  .copy-btn:hover { background: #444; color: #fff; }

  .response-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .badge { padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  .badge-200 { background: #14532d; color: #4ade80; }
  .badge-422 { background: #451a03; color: #fb923c; }
  .badge-429 { background: #450a0a; color: #f87171; }
  .badge-500 { background: #450a0a; color: #f87171; }
  .badge-502 { background: #450a0a; color: #f87171; }
  .badge-0   { background: #1e1b4b; color: #a5b4fc; }
  .time-badge { background: #1e1e1e; color: #888; padding: 3px 8px; border-radius: 4px; font-size: 11px; }

  .response-headers { font-size: 11px; color: #666; margin-top: 8px; }
  .response-headers span { color: #4ade80; }

  .json-output { flex: 1; overflow-y: auto; background: #0d0d0d; border: 1px solid #2a2a2a; border-radius: 5px; padding: 12px; font-size: 12px; font-family: monospace; line-height: 1.7; white-space: pre-wrap; word-break: break-word; margin-top: 10px; }
  .json-key { color: #60a5fa; }
  .json-str { color: #a3e635; }
  .json-num { color: #fb923c; }
  .json-bool { color: #c084fc; }
  .json-null { color: #888; }

  .placeholder { color: #444; font-size: 13px; text-align: center; margin-top: 60px; }
  .placeholder .icon { font-size: 40px; margin-bottom: 12px; }

  .error-codes { padding: 16px; }
  .error-codes h3 { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
  .error-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 8px; font-size: 12px; }
  .error-row .code { min-width: 36px; font-weight: bold; }
  .c200 { color: #4ade80; } .c422 { color: #fb923c; } .c429 { color: #f87171; } .c500 { color: #f87171; } .c502 { color: #f87171; }
  .error-row .desc { color: #888; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #111; }
  ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
</style>
</head>
<body>

<header>
  <div>🍳</div>
  <h1>FlavorFind API</h1>
  <span>Interactive Tester</span>
  <div class="status-bar" id="statusBar">
    <div class="stat"><span class="val" id="keysActive">—</span> keys active</div>
    <div class="stat" id="usageStat"><span class="val" id="usageVal">—</span> used today</div>
    <div class="stat"><span class="val" id="remainingVal">—</span> remaining</div>
  </div>
</header>

<div class="layout">
  <!-- SIDEBAR -->
  <nav class="sidebar">
    <div class="sidebar-section">System</div>
    <button class="endpoint-btn" onclick="load('health')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/health</span>
    </button>
    <button class="endpoint-btn" onclick="load('stats')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/stats</span>
    </button>

    <div class="sidebar-section">Recipes</div>
    <button class="endpoint-btn" onclick="load('findByIngredients')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/recipes</span>
    </button>
    <button class="endpoint-btn" onclick="load('search')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/recipes/search</span>
    </button>
    <button class="endpoint-btn" onclick="load('random')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/recipes/random</span>
    </button>
    <button class="endpoint-btn" onclick="load('recipeDetail')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/recipes/{id}</span>
    </button>

    <div class="sidebar-section">Ingredients</div>
    <button class="endpoint-btn" onclick="load('autocomplete')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/ingredients/autocomplete</span>
    </button>

    <div class="sidebar-section">Categories</div>
    <button class="endpoint-btn" onclick="load('categories')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/categories</span>
    </button>
    <button class="endpoint-btn" onclick="load('byCuisine')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/categories/cuisine/{c}</span>
    </button>
    <button class="endpoint-btn" onclick="load('byDiet')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/categories/diet/{d}</span>
    </button>
    <button class="endpoint-btn" onclick="load('byType')">
      <span class="method GET">GET</span><span class="endpoint-path">/api/categories/type/{t}</span>
    </button>
  </nav>

  <!-- MAIN -->
  <div class="main">
    <div class="top-panel">
      <div class="endpoint-title" id="epTitle">Select an endpoint</div>
      <div class="endpoint-desc" id="epDesc">Choose an endpoint from the sidebar to begin testing.</div>
    </div>

    <div class="panels">
      <!-- REQUEST -->
      <div class="request-panel">
        <div class="panel-header">
          Request
          <span id="methodBadge" style="font-size:11px;color:#4ade80;"></span>
        </div>
        <div class="panel-body">
          <div id="paramsForm"></div>
          <button class="send-btn" id="sendBtn" onclick="sendRequest()" style="display:none">▶ Send Request</button>

          <div style="margin-top:16px;" id="curlSection" style="display:none">
            <div class="panel-header" style="margin: 0 -16px; padding: 10px 16px;">cURL Command</div>
            <div style="margin-top:10px; position:relative;">
              <div class="curl-box" id="curlBox">Select an endpoint to generate cURL</div>
              <button class="copy-btn" onclick="copyCurl()">Copy</button>
            </div>
          </div>

          <div style="margin-top:16px;">
            <div class="panel-header" style="margin: 0 -16px; padding: 10px 16px;">Error Codes</div>
            <div class="error-codes">
              <div class="error-row"><span class="code c200">200</span><span class="desc">Success — data returned</span></div>
              <div class="error-row"><span class="code c422">422</span><span class="desc">Validation error — missing or invalid parameter</span></div>
              <div class="error-row"><span class="code c429">429</span><span class="desc">All Spoonacular API keys exhausted for today</span></div>
              <div class="error-row"><span class="code c500">500</span><span class="desc">Server error — unexpected exception</span></div>
              <div class="error-row"><span class="code c502">502</span><span class="desc">Spoonacular upstream error</span></div>
            </div>
          </div>
        </div>
      </div>

      <!-- RESPONSE -->
      <div class="response-panel">
        <div class="panel-header">
          Response
          <div class="response-meta" id="responseMeta"></div>
        </div>
        <div class="panel-body" style="display:flex;flex-direction:column;height:100%;">
          <div id="responseHeaders" class="response-headers"></div>
          <div class="json-output" id="jsonOutput">
            <div class="placeholder">
              <div class="icon">🍽️</div>
              <div>Send a request to see the response</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const BASE = window.location.origin;

const ENDPOINTS = {
  health: {
    title: 'Health Check',
    desc: 'Returns server status and a summary of all API key usage for today.',
    method: 'GET',
    path: '/api/health',
    params: [],
  },
  stats: {
    title: 'Key Usage Stats',
    desc: 'Detailed per-key breakdown — requests used, remaining, and exhausted status.',
    method: 'GET',
    path: '/api/stats',
    params: [],
  },
  findByIngredients: {
    title: 'Find Recipes by Ingredients',
    desc: 'Search for recipes that use the given ingredients. Returns up to `number` results ranked by ingredient match.',
    method: 'GET',
    path: '/api/recipes',
    params: [
      { name: 'ingredients', label: 'Ingredients', required: true, placeholder: 'chicken,rice,garlic', hint: 'Comma-separated list of ingredients' },
      { name: 'number', label: 'Number of results', required: false, placeholder: '12', hint: '1–50, default 12' },
    ],
  },
  search: {
    title: 'Complex Recipe Search',
    desc: 'Search recipes with optional filters for query, cuisine, diet, and meal type.',
    method: 'GET',
    path: '/api/recipes/search',
    params: [
      { name: 'query',   label: 'Search query',  required: false, placeholder: 'pasta', hint: 'Keyword to search' },
      { name: 'cuisine', label: 'Cuisine',        required: false, type: 'select', options: ['','African','Asian','American','British','Cajun','Caribbean','Chinese','European','French','German','Greek','Indian','Italian','Japanese','Korean','Mediterranean','Mexican','Middle Eastern','Spanish','Thai','Vietnamese'] },
      { name: 'diet',    label: 'Diet',           required: false, type: 'select', options: ['','Gluten Free','Ketogenic','Vegetarian','Vegan','Pescetarian','Paleo','Whole30'] },
      { name: 'type',    label: 'Meal type',      required: false, type: 'select', options: ['','main course','side dish','dessert','appetizer','salad','breakfast','soup','snack','drink'] },
      { name: 'number',  label: 'Number',         required: false, placeholder: '12', hint: '1–50' },
    ],
  },
  random: {
    title: 'Random Recipes',
    desc: 'Get random recipes, optionally filtered by tags.',
    method: 'GET',
    path: '/api/recipes/random',
    params: [
      { name: 'number', label: 'Number', required: false, placeholder: '10', hint: '1–20' },
      { name: 'tags',   label: 'Tags',   required: false, placeholder: 'vegetarian,dessert', hint: 'Comma-separated Spoonacular tags' },
    ],
  },
  recipeDetail: {
    title: 'Recipe Detail',
    desc: 'Get full details for a recipe by its Spoonacular ID.',
    method: 'GET',
    path: '/api/recipes/{id}',
    params: [
      { name: 'id', label: 'Recipe ID', required: true, placeholder: '716429', hint: 'Spoonacular recipe ID', pathParam: true },
    ],
  },
  autocomplete: {
    title: 'Ingredient Autocomplete',
    desc: 'Autocomplete ingredient names as the user types.',
    method: 'GET',
    path: '/api/ingredients/autocomplete',
    params: [
      { name: 'query',  label: 'Query',   required: true,  placeholder: 'chick', hint: 'Min 2 characters' },
      { name: 'number', label: 'Results', required: false, placeholder: '5', hint: 'Default 5' },
    ],
  },
  categories: {
    title: 'List All Categories',
    desc: 'Returns all available cuisines, diets, and meal types supported by the API.',
    method: 'GET',
    path: '/api/categories',
    params: [],
  },
  byCuisine: {
    title: 'Recipes by Cuisine',
    desc: 'Browse recipes filtered by cuisine type.',
    method: 'GET',
    path: '/api/categories/cuisine/{cuisine}',
    params: [
      { name: 'cuisine', label: 'Cuisine', required: true, type: 'select', pathParam: true,
        options: ['Italian','Mexican','Indian','Chinese','French','Japanese','Mediterranean','American','Thai','Greek','Spanish','Korean','Middle Eastern'] },
      { name: 'number',  label: 'Number',  required: false, placeholder: '12' },
    ],
  },
  byDiet: {
    title: 'Recipes by Diet',
    desc: 'Browse recipes filtered by dietary preference.',
    method: 'GET',
    path: '/api/categories/diet/{diet}',
    params: [
      { name: 'diet',   label: 'Diet',   required: true, type: 'select', pathParam: true,
        options: ['Vegetarian','Vegan','Gluten Free','Ketogenic','Paleo','Pescetarian','Whole30'] },
      { name: 'number', label: 'Number', required: false, placeholder: '12' },
    ],
  },
  byType: {
    title: 'Recipes by Meal Type',
    desc: 'Browse recipes filtered by meal type.',
    method: 'GET',
    path: '/api/categories/type/{type}',
    params: [
      { name: 'type',   label: 'Meal Type', required: true, type: 'select', pathParam: true,
        options: ['main course','side dish','dessert','appetizer','salad','breakfast','soup','snack','drink'] },
      { name: 'number', label: 'Number',    required: false, placeholder: '12' },
    ],
  },
};

let current = null;

function load(key) {
  current = key;
  const ep = ENDPOINTS[key];

  // Sidebar active state
  document.querySelectorAll('.endpoint-btn').forEach(b => b.classList.remove('active'));
  event.currentTarget.classList.add('active');

  document.getElementById('epTitle').textContent = ep.title;
  document.getElementById('epDesc').textContent = ep.desc;
  document.getElementById('methodBadge').textContent = `${ep.method} ${ep.path}`;
  document.getElementById('sendBtn').style.display = 'block';
  document.getElementById('curlSection') && (document.getElementById('curlSection').style.display = 'block');

  // Build form
  const form = document.getElementById('paramsForm');
  form.innerHTML = '';

  if (ep.params.length === 0) {
    form.innerHTML = '<p style="color:#555;font-size:12px;margin-bottom:12px;">No parameters required.</p>';
  } else {
    ep.params.forEach(p => {
      const div = document.createElement('div');
      div.className = 'field-group';
      const req = p.required ? '<span>*</span>' : '';
      let input;
      if (p.type === 'select') {
        input = `<select id="param_${p.name}" onchange="updateCurl()">
          ${p.options.map(o => `<option value="${o}">${o || '— none —'}</option>`).join('')}
        </select>`;
      } else {
        input = `<input type="text" id="param_${p.name}" placeholder="${p.placeholder||''}" onkeyup="updateCurl()" oninput="updateCurl()">`;
      }
      div.innerHTML = `<label>${p.label} ${req}</label>${input}${p.hint ? `<div class="hint">${p.hint}</div>` : ''}`;
      form.appendChild(div);
    });
  }

  updateCurl();
  document.getElementById('jsonOutput').innerHTML = '<div class="placeholder"><div class="icon">🍽️</div><div>Press Send to test this endpoint</div></div>';
  document.getElementById('responseMeta').innerHTML = '';
  document.getElementById('responseHeaders').innerHTML = '';
}

function buildUrl() {
  if (!current) return '';
  const ep = ENDPOINTS[current];
  let path = ep.path;
  const queryParams = [];

  ep.params.forEach(p => {
    const el = document.getElementById(`param_${p.name}`);
    if (!el) return;
    const val = el.value.trim();
    if (p.pathParam) {
      path = path.replace(`{${p.name}}`, encodeURIComponent(val || p.placeholder || ''));
    } else if (val) {
      queryParams.push(`${p.name}=${encodeURIComponent(val)}`);
    }
  });

  return BASE + path + (queryParams.length ? '?' + queryParams.join('&') : '');
}

function updateCurl() {
  const url = buildUrl();
  if (!url) return;
  document.getElementById('curlBox').textContent = `curl -s "${url}"`;
}

function copyCurl() {
  const text = document.getElementById('curlBox').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 1500);
  });
}

async function sendRequest() {
  if (!current) return;
  const btn = document.getElementById('sendBtn');
  btn.textContent = '⏳ Sending...';
  btn.classList.add('loading');
  btn.disabled = true;

  const url = buildUrl();
  const start = Date.now();

  try {
    const res = await fetch(url);
    const elapsed = Date.now() - start;
    const data = await res.json();

    // Status badge
    const statusClass = `badge-${res.status}`;
    document.getElementById('responseMeta').innerHTML = `
      <span class="badge ${statusClass}">${res.status} ${res.statusText}</span>
      <span class="time-badge">${elapsed}ms</span>
    `;

    // Headers
    const keyUsed = res.headers.get('X-Key-Used');
    const remaining = res.headers.get('X-Requests-Remaining');
    const rateLimit = res.headers.get('X-RateLimit-Remaining');
    let headerHtml = '';
    if (keyUsed !== null) headerHtml += `<span>X-Key-Used:</span> ${keyUsed} &nbsp;`;
    if (remaining !== null) headerHtml += `<span>X-Requests-Remaining:</span> ${remaining} &nbsp;`;
    if (rateLimit !== null) headerHtml += `<span>X-RateLimit-Remaining:</span> ${rateLimit}`;
    document.getElementById('responseHeaders').innerHTML = headerHtml;

    // Pretty JSON
    document.getElementById('jsonOutput').innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));

    // Refresh status bar
    loadStatus();
  } catch (e) {
    document.getElementById('responseMeta').innerHTML = `<span class="badge badge-0">Network Error</span>`;
    document.getElementById('jsonOutput').innerHTML = `<span style="color:#f87171">${e.message}</span>`;
  }

  btn.textContent = '▶ Send Request';
  btn.classList.remove('loading');
  btn.disabled = false;
}

function syntaxHighlight(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
    let cls = 'json-num';
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? 'json-key' : 'json-str';
    } else if (/true|false/.test(match)) {
      cls = 'json-bool';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

async function loadStatus() {
  try {
    const res = await fetch(`${BASE}/api/health`);
    const d = await res.json();
    document.getElementById('keysActive').textContent = `${d.keys.active}/${d.keys.total}`;
    document.getElementById('usageVal').textContent = d.usage.today;
    document.getElementById('remainingVal').textContent = d.usage.remaining;

    const pct = d.usage.capacity > 0 ? (d.usage.today / d.usage.capacity) * 100 : 0;
    const stat = document.getElementById('usageStat');
    stat.className = 'stat' + (pct >= 80 ? ' danger' : pct >= 50 ? ' warn' : '');
  } catch(e) {}
}

// Load status on page load
loadStatus();
setInterval(loadStatus, 30000);
</script>
</body>
</html>
