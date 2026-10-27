const MAX_SCORE = 10; 
// change if your model’s score uses a different scale
const API_URL = "http://127.0.0.1:2200";
const platforms = ["Instagram","TikTok","YouTube","Facebook","WhatsApp","Snapchat","Twitter","LinkedIn","LINE","KakaoTalk","VKontakte","WeChat"];
const $ = id => document.getElementById(id);
$('Most_Used_Platform').innerHTML = platforms.map(p => `<option>${p}</option>`).join('');
document.getElementById('scale').textContent = `out of ${MAX_SCORE}`;

// live slider values
document.querySelectorAll('input[type=range]').forEach(r => {
  const o = document.querySelector(`output[for=${r.id}]`);
  const upd = () => o.textContent = r.value + (r.dataset.unit ? ' ' + r.dataset.unit : '');
  r.addEventListener('input', upd); upd();
});

// API health dot
async function ping(){
  const dot = $('dot');
  try { const r = await fetch($('apiUrl').value.replace(/\/$/,'') + '/'); dot.className = 'dot ' + (r.ok ? 'ok' : 'bad'); }
  catch { dot.className = 'dot bad'; }
}
$('apiUrl').addEventListener('change', ping); ping();

function band(s){
  const p = s / MAX_SCORE;
  return p >= .75 ? 'Strong wellbeing' : p >= .5 ? 'Moderate wellbeing' : 'Lower wellbeing';
}
function showScore(v){
  const arc = $('arc'), len = 251.33;
  arc.style.strokeDashoffset = len * (1 - Math.max(0, Math.min(1, v / MAX_SCORE)));
  $('score').textContent = v.toFixed(2);
}

$('form').addEventListener('submit', async e => {
  e.preventDefault();
  const out = $('out'), btn = $('btn');
  const radio = n => document.querySelector(`input[name=${n}]:checked`).value;
  const num = id => Number($(id).value);

  const payload = {
    Age: num('Age'),
    Gender: radio('Gender'),
    Country: $('Country').value.trim(),
    Academic_Level: radio('Academic_Level'),
    Most_Used_Platform: $('Most_Used_Platform').value,
    Purpose_Of_Use: $('Purpose_Of_Use').value,
    Avg_Daily_Usage_Hours: num('Avg_Daily_Usage_Hours'),
    Daily_Unlocks: num('Daily_Unlocks'),
    Study_Hours: num('Study_Hours'),
    Physical_Activity_Hours: num('Physical_Activity_Hours'),
    Sleep_Hours_Per_Night: num('Sleep_Hours_Per_Night'),
    Stress_Level: radio('Stress_Level')
  };

  if (!payload.Country || !(payload.Age >= 10 && payload.Age <= 100)) {
    out.innerHTML = '<p class="err">Enter an age between 10 and 100 and a country.</p>'; return;
  }

  btn.disabled = true; btn.textContent = 'Estimating…';
  try {
    const res = await fetch(API_URL + '/predict', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = `The API returned an error (${res.status}).`;
      try { const j = await res.json(); if (Array.isArray(j.detail)) msg = j.detail.map(d => `${d.loc.slice(-1)[0]}: ${d.msg}`).join('; '); } catch {}
      throw new Error(msg);
    }
    const data = await res.json();
    const v = data.predict_mental_health_score;
    showScore(v);
    out.innerHTML = `<span class="band">${band(v)}</span>`;
    $('dot').className = 'dot ok';
  } catch (err) {
    const offline = err instanceof TypeError;
    out.innerHTML = `<p class="err">${offline ? 'Cannot reach the API. Start it with <code>uvicorn main:app --reload</code> and check the API address below the form.' : err.message}</p>`;
    if (offline) $('dot').className = 'dot bad';
  } finally {
    btn.disabled = false; btn.textContent = 'Estimate score';
  }
});
