export function bindUI(app){
  const $=id=>document.getElementById(id);
  let toastTimer;
  const toast=message=>{
    const el=$('toast');el.textContent=message;el.classList.add('show');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800);
  };
  const update=()=>{
    document.querySelectorAll('[data-spawn]').forEach(el=>el.classList.toggle('selected',el.dataset.spawn===app.spawnType));
    document.querySelectorAll('[data-tool]').forEach(el=>el.classList.toggle('selected',el.dataset.tool===app.tool));
    $('objectCount').textContent=`${app.items.length} OBJECTS`;
    $('pauseBtn').textContent=app.paused?'▶ RESUME':'Ⅱ PAUSE';
    $('mobilePause').textContent=app.paused?'▶ RESUME':'Ⅱ PAUSE';
    $('status').textContent=app.paused?'SIMULATION PAUSED':'PHYSICS ENGINE ONLINE';
    $('hint').textContent=app.selected?`${app.selected.label} SELECTED`:'CLICK AN OBJECT TO INTERACT';
  };
  const chooseTool=type=>{app.tool=type;app.controls.mode=type;app.controls.clearGrab();update();toast(`${type.toUpperCase()} TOOL ACTIVE`);};
  const chooseSpawn=type=>{app.spawnType=type;update();};
  document.querySelectorAll('[data-spawn]').forEach(el=>el.addEventListener('click',()=>chooseSpawn(el.dataset.spawn)));
  document.querySelectorAll('[data-tool]').forEach(el=>el.addEventListener('click',()=>chooseTool(el.dataset.tool)));
  $('spawnBtn').addEventListener('click',()=>app.spawn());
  $('mobileSpawn').addEventListener('click',()=>app.spawn());
  $('mobileGrab').addEventListener('click',()=>chooseTool('grab'));
  $('mobilePush').addEventListener('click',()=>chooseTool('push'));
  $('resetBtn').addEventListener('click',()=>{app.reset();toast('SANDBOX RESET');});
  $('clearBtn').addEventListener('click',()=>{app.clear();toast('OBJECTS CLEARED');});
  const pause=()=>{app.paused=!app.paused;update();toast(app.paused?'SIMULATION PAUSED':'SIMULATION RESUMED');};
  $('pauseBtn').addEventListener('click',pause);$('mobilePause').addEventListener('click',pause);
  $('gravity').addEventListener('input',e=>{const value=Number(e.target.value);app.physics.setGravity(value);$('gravValue').textContent=`${value.toFixed(1)} m/s²`;});
  $('timeScale').addEventListener('input',e=>{app.timeScale=Number(e.target.value);$('timeValue').textContent=`${app.timeScale.toFixed(2)}×`;});
  $('helpBtn').addEventListener('click',()=>{$('help').classList.remove('hidden');app.controls.clearGrab();});
  const close=()=>$('help').classList.add('hidden');$('closeHelp').addEventListener('click',close);$('gotIt').addEventListener('click',close);
  window.addEventListener('keydown',e=>{
    if(e.target instanceof HTMLInputElement || !app.started)return;
    const k=e.key.toLowerCase();
    if('123456'.includes(k)&&k.length===1){const names=['dummy','cube','ball','barrel','plank','ramp'];chooseSpawn(names[Number(k)-1]);app.spawn();}
    if(k==='g')chooseTool('grab');if(k==='f')chooseTool('push');if(k==='r')chooseTool('freeze');if(k==='x')chooseTool('delete');
    if(k===' '){e.preventDefault();pause();}
    if(k==='delete'||k==='backspace'){e.preventDefault();if(app.selected){app.remove(app.selected);toast('OBJECT REMOVED');}}
    if(k==='escape'){app.selected=null;app.controls.clearGrab();close();update();}
  });
  app.notify=toast;app.refreshUI=update;update();
}
