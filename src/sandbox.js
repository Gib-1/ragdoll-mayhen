import * as THREE from 'three';
import {createRagdoll} from './ragdoll.js';
const MAT=(color,roughness=.68)=>new THREE.MeshStandardMaterial({color,roughness,metalness:.05});
function box(scene,pos,size,color,cast=false,opacity=1){const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),MAT(color));mesh.position.set(pos.x,pos.y,pos.z);mesh.receiveShadow=true;mesh.castShadow=cast;scene.add(mesh);return mesh;}
export function buildArena(scene,physics){
  scene.background=new THREE.Color(0x8fcae8);
  scene.fog=new THREE.Fog(0x8fcae8,28,78);
  scene.add(new THREE.HemisphereLight(0xc7f3ff,0x61728b,2.0));
  const sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(-9,18,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-19;sun.shadow.camera.right=19;sun.shadow.camera.top=19;sun.shadow.camera.bottom=-19;sun.shadow.normalBias=.03;sun.shadow.bias=-.0001;scene.add(sun);
  box(scene,{x:0,y:-.36,z:0},{x:42,y:.72,z:42},0xd6e6ed);
  box(scene,{x:0,y:-.02,z:0},{x:23,y:.035,z:23},0xeaf4f7);
  const grid=new THREE.GridHelper(22,22,0xb3cad4,0xcbdce3);grid.position.y=.008;scene.add(grid);
  box(scene,{x:0,y:.13,z:-10.95},{x:22,y:.28,z:.5},0x4e708a,true);
  box(scene,{x:0,y:.13,z:10.95},{x:22,y:.28,z:.5},0x4e708a,true);
  box(scene,{x:-10.95,y:.13,z:0},{x:.5,y:.28,z:22},0x4e708a,true);
  box(scene,{x:10.95,y:.13,z:0},{x:.5,y:.28,z:22},0x4e708a,true);
  for(let x of [-10,10])for(let z of [-10,10]){
    box(scene,{x,y:1.8,z},{x:.65,y:3.6,z:.65},0x73bde7,true);
    box(scene,{x,y:3.66,z},{x:.95,y:.2,z:.95},0xf8b647,true);
  }
  for(let x of [-8,8]){
    const cube=box(scene,{x,y:.06,z:-8},{x:1.7,y:.1,z:1.7},0xffb24a);
    cube.receiveShadow=true;
  }
  const stage=box(scene,{x:0,y:.10,z:-5.5},{x:7,y:.2,z:3},0x5594b7,true);
  physics.makeFixedBox({x:0,y:.1,z:-5.5},{x:7,y:.2,z:3});
  for(const x of [-3.25,3.25]){box(scene,{x,y:.38,z:-5.5},{x:.16,y:.55,z:3},0xffbe4e);}
  // Decorations outside the play area.
  for(let x=-18;x<=18;x+=6){const p=box(scene,{x,y:-.05,z:-17},{x:2.2,y:.18,z:2.2},0x7ba9c2);p.receiveShadow=true;}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.15,12,48),MAT(0x5ad8c8));ring.rotation.x=Math.PI/2;ring.position.set(0,.065,1.7);scene.add(ring);
  return {stage};
}
function addBody(scene,physics,pos,size,color,shape='box',opts={}){
  const body=physics.body(pos,size,shape,opts);
  let geo;
  if(shape==='sphere')geo=new THREE.SphereGeometry(size.x/2,22,16);
  else if(shape==='cylinder')geo=new THREE.CylinderGeometry(size.x/2,size.x/2,size.y,20);
  else geo=new THREE.BoxGeometry(size.x,size.y,size.z);
  const mesh=new THREE.Mesh(geo,MAT(color,shape==='sphere'?.37:.7));
  mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  const item={kind:opts.kind||shape,label:opts.label||'PHYSICS OBJECT',pieces:[{body,mesh}],bodies:[body],meshes:[mesh],primary:body};
  mesh.userData.item=item;return item;
}
export function spawnItem(type,physics,scene,p,variant=0){
  const x=p.x,z=p.z;
  switch(type){
    case 'dummy':return createRagdoll(physics,scene,x,z,variant);
    case 'cube':return addBody(scene,physics,{x,y:3,z},{x:1.0,y:1,z:1},0x7dafec,'box',{label:'PHYSICS CUBE',density:1.1,bounce:.2});
    case 'ball':return addBody(scene,physics,{x,y:3,z},{x:1.05,y:1.05,z:1.05},0xf385b0,'sphere',{label:'BOUNCY BALL',density:.45,bounce:.86,friction:.42});
    case 'barrel':return addBody(scene,physics,{x,y:3,z},{x:1.04,y:1.25,z:1.04},0x56d0be,'cylinder',{label:'ROUND BARREL',density:.8,bounce:.2});
    case 'plank':return addBody(scene,physics,{x,y:3,z},{x:3.2,y:.28,z:.62},0xf6ba6b,'box',{label:'BUILDING BEAM',density:.8,bounce:.15});
    case 'ramp': {
      const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.25,0,0));
      return addBody(scene,physics,{x,y:1.5,z},{x:2.7,y:.26,z:2.2},0xa5a0ec,'box',{label:'RAMP',density:2,rotation});
    }
    default:return null;
  }
}
