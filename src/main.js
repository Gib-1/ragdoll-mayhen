import * as THREE from 'three';
import {PhysicsEngine} from './physics.js';
import {createRagdoll} from './ragdoll.js';
import {buildArena,spawnItem} from './sandbox.js';
import {SandboxControls} from './controls.js';
import {bindUI} from './ui.js';

const $=id=>document.getElementById(id);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(57,1,.1,110);
let renderer;
try{
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.3;
  $('game').appendChild(renderer.domElement);
}catch(err){$('bootMessage').textContent='WebGL is unavailable. Try an updated browser with hardware acceleration enabled.';throw err;}

const app={scene,camera,renderer,physics:new PhysicsEngine(),items:[],selected:null,spawnType:'dummy',tool:'grab',paused:false,timeScale:1,started:false,controls:null,notify:()=>{},refreshUI:()=>{},effects:[]};
const LIMITS={dummy:12,props:90};
let variations=0;
function spawn(type=app.spawnType,x,z){
  const dummies=app.items.filter(i=>i.kind==='dummy').length;
  if((type==='dummy'&&dummies>=LIMITS.dummy)||(type!=='dummy'&&app.items.length-dummies>=LIMITS.props)){
    app.notify('OBJECT LIMIT REACHED — CLEAR SOME OBJECTS');return null;
  }
  const p={x:THREE.MathUtils.clamp(x??app.controls.focus.x+(Math.random()-.5)*1.3,-8.6,8.6),z:THREE.MathUtils.clamp(z??app.controls.focus.z+(Math.random()-.5)*1.3,-8.6,8.6)};
  const item=spawnItem(type,app.physics,scene,p,variations++);if(item){app.items.push(item);app.selected=item;app.refreshUI();app.notify(`${item.label} SPAWNED`);}return item;
}
function remove(item){if(!item)return;app.controls.clearGrab();for(const mesh of item.meshes){scene.remove(mesh);mesh.traverse(o=>{if(o.geometry)o.geometry.dispose();});}app.physics.remove(item);const index=app.items.indexOf(item);if(index>=0)app.items.splice(index,1);if(app.selected===item)app.selected=null;app.refreshUI();}
function clear(){for(const item of [...app.items])remove(item);app.selected=null;app.refreshUI();}
function reset(){clear();app.physics.setGravity(9.8);app.paused=false;app.timeScale=1;$('gravity').value='9.8';$('gravValue').textContent='9.8 m/s²';$('timeScale').value='1';$('timeValue').textContent='1.00×';app.controls.focus.set(0,1.65,0);app.controls.distance=16;app.controls.yaw=.58;app.controls.pitch=.47;app.controls.updateCamera();spawn('dummy',0,1.5);spawn('cube',-2,1);spawn('ball',2,1);app.refreshUI();}
function ripple(pos,color=0x83f5e3){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.55,.06,8,32),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.set(pos.x,pos.y,pos.z);scene.add(ring);app.effects.push({mesh:ring,life:0});
}
function interact(hit,mode){
  if(mode==='deselect'){app.selected=null;app.refreshUI();return;}
  if(!hit)return;
  const {item,body}=hit;
  if(mode==='select'||mode==='grab'){app.selected=item;app.refreshUI();return;}
  if(mode==='delete'){remove(item);app.notify('OBJECT REMOVED');return;}
  if(mode==='freeze'){
    const isFrozen=body.bodyType()===app.physics.rapier.RigidBodyType.Dynamic;
    for(const b of item.bodies){if(isFrozen&&b.isDynamic())b.setBodyType(app.physics.rapier.RigidBodyType.Fixed,true);else if(!isFrozen&&!b.isDynamic())b.setBodyType(app.physics.rapier.RigidBodyType.Dynamic,true);}
    app.notify(isFrozen?'OBJECT FROZEN':'OBJECT UNFROZEN');app.selected=item;app.refreshUI();return;
  }
  if(mode==='push'){
    if(!app.paused){const origin=app.camera.position;for(const b of item.bodies)app.physics.impulse(b,origin,item.kind==='dummy'?2.2:9);ripple(hit.point,0xffcc66);app.notify('IMPULSE APPLIED');}
    app.selected=item;app.refreshUI();
  }
}
Object.assign(app,{spawn,remove,clear,reset});
async function boot(){
  try{
    $('bootMessage').textContent='Initializing Rapier physics…';
    await app.physics.init();
    buildArena(scene,app.physics);
    app.controls=new SandboxControls(camera,renderer.domElement,app.physics,()=>app.items,interact);
    bindUI(app);
    reset();
    const startBtn=$('startBtn');startBtn.disabled=false;startBtn.textContent='▶ ENTER SANDBOX';
    $('bootMessage').textContent='Physics loaded • Press ENTER SANDBOX to play';
    startBtn.addEventListener('click',()=>{$('boot').classList.add('hidden');app.started=true;app.refreshUI();});
    window.addEventListener('resize',resize);resize();
    let last=performance.now(),accumulator=0,frames=0,fpsTime=0;
    function animate(now){
      requestAnimationFrame(animate);
      const dt=Math.min((now-last)/1000,.08);last=now;
      if(app.started&&$('help').classList.contains('hidden'))app.controls.update(dt);
      if(app.started&&!app.paused&&$('help').classList.contains('hidden')){
        accumulator+=dt*app.timeScale;
        const fixedDt=1/60;let count=0;
        while(accumulator>=fixedDt&&count<5){
          app.controls.update(0); // Applies the spring force once per physics step.
          app.physics.update();accumulator-=fixedDt;count++;
        }
        if(count===5)accumulator=0;
      }else accumulator=0;
      for(const item of app.items)for(const piece of item.pieces){
        if(!piece.body.isValid())continue;
        const p=piece.body.translation(),q=piece.body.rotation();
        piece.mesh.position.set(p.x,p.y,p.z);piece.mesh.quaternion.set(q.x,q.y,q.z,q.w);
      }
      for(let i=app.effects.length-1;i>=0;i--){const e=app.effects[i];e.life+=dt;e.mesh.scale.setScalar(1+e.life*5);e.mesh.material.opacity=Math.max(0,1-e.life/0.6);if(e.life>.6){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();app.effects.splice(i,1);}}
      renderer.render(scene,camera);
      frames++;fpsTime+=dt;if(fpsTime>=1){$('fps').textContent=`${Math.round(frames/fpsTime)} FPS`;frames=0;fpsTime=0;}
    }
    requestAnimationFrame(animate);
  }catch(error){console.error(error);$('bootMessage').textContent=`Could not start physics: ${error?.message||'Network or browser error'}. Check internet access and reload.`;$('startBtn').textContent='FAILED TO LOAD';}
}
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
boot();
