const $ = id => document.getElementById(id);
const drop = $('drop'), file = $('file'), go = $('go'), result = $('result'), urlInput = $('modelUrl');
const faces = ['bear','fox','bunny','owl','frog'];
const demoNames = ['Ayı','Tilki','Tavşan','Baykuş','Kurbağa'];
let img = null, model = null, loadedUrl = '';

function showFile(f){
  if(!f || !f.type.startsWith('image/')) return;
  const r = new FileReader();
  r.onload = e => {
    drop.classList.add('has');
    drop.querySelector('img')?.remove();
    img = new Image(); img.src = e.target.result; img.alt = 'Seçilen hayvan fotoğrafı';
    drop.appendChild(img);
    go.disabled = false;
  };
  r.readAsDataURL(f);
}
file.addEventListener('change', () => showFile(file.files[0]));
['dragenter','dragover'].forEach(t => drop.addEventListener(t, e => {e.preventDefault(); drop.classList.add('over');}));
['dragleave','drop'].forEach(t => drop.addEventListener(t, e => {e.preventDefault(); drop.classList.remove('over');}));
drop.addEventListener('drop', e => showFile(e.dataTransfer.files[0]));

async function getPredictions(){
  const url = urlInput.value.trim();
  if(!url){
    const p = demoNames.map(n => ({className:n, probability:Math.random()**2}));
    const sum = p.reduce((a,b) => a + b.probability, 0);
    p.forEach(x => x.probability /= sum);
    return {list:p, demo:true};
  }
  if(!model || loadedUrl !== url){
    const base = url.endsWith('/') ? url : url + '/';
    model = await tmImage.load(base + 'model.json', base + 'metadata.json');
    loadedUrl = url;
  }
  return {list: await model.predict(img), demo:false};
}

go.addEventListener('click', async () => {
  go.disabled = true; go.textContent = 'Düşünüyorum…';
  try{
    const {list, demo} = await getPredictions();
    list.sort((a,b) => b.probability - a.probability);
    const top = list[0];
    const i = demoNames.indexOf(top.className);
    const face = faces[i >= 0 ? i : Math.floor(Math.random()*faces.length)];
    result.innerHTML =
      `<div class="bubble pop"><svg viewBox="0 0 100 100"><use href="#${face}"/></svg>
        <div>Bence bu bir <b>${top.className}</b>!${demo ? '<br><small style="font-size:.8rem">(deneme modu)</small>' : ''}</div></div>` +
      list.map((p,k) => `<div class="bar ${k===0?'top':''}"><span>${p.className}</span>
        <div class="track"><div class="fill" data-w="${Math.round(p.probability*100)}"></div></div>
        <span>%${Math.round(p.probability*100)}</span></div>`).join('');
    requestAnimationFrame(() => requestAnimationFrame(() =>
      result.querySelectorAll('.fill').forEach(f => f.style.width = f.dataset.w + '%')));
  }catch(err){
    result.innerHTML = '<div class="empty">Model yüklenemedi 😿<br>Bağlantıyı kontrol edip tekrar dene.</div>';
    console.error(err);
  }
  go.textContent = 'Tekrar tahmin et!'; go.disabled = false;
});
