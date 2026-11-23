import * as THREE from 'three';

const COLORS = [0xffc34a,0x65d6d0,0xf18db9,0xa59aff,0x88d18b];
const surf=(color,metalness=.06)=>new THREE.MeshStandardMaterial({color,roughness:.67,metalness});
function roundedBox(size,material){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),material);
  mesh.castShadow=true;mesh.receiveShadow=true;
  return mesh;
}
export function createRagdoll(physics,scene,x=0,z=0,variant=0){
  const color=COLORS[variant%COLORS.length], shell=surf(color), dark=surf(0x263c4b), joints=surf(0x435b70,.18), eye=surf(0x172b38);
  const pieces=[],bodies=[],meshes=[],attachments=[];
  const make=(name,p,size,geometry,material)=>{
    const body=physics.body(p,size,geometry==='sphere'?'sphere':'box',{density:1.1,bounce:.12});
    const mesh=geometry==='sphere'?new THREE.Mesh(new THREE.SphereGeometry(size.x/2,16,12),material):roundedBox(size,material);
    mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
    pieces.push({name,body,mesh});bodies.push(body);meshes.push(mesh);return body;
  };
  const at=(a,b,pos)=>physics.spherical(a,b,{x:x+pos[0],y:pos[1],z:z+pos[2]});
  const torso=make('torso',{x,y:3.05,z},{x:.92,y:1.13,z:.48},'box',shell);
  const pelvis=make('pelvis',{x,y:2.31,z},{x:.79,y:.4,z:.43},'box',dark);
  const head=make('head',{x,y:3.94,z},{x:.55,y:.55,z:.55},'sphere',shell);
  at(torso,pelvis,[0,2.55,0]);at(torso,head,[0,3.65,0]);
  for(const s of [-1,1]){
    const shoulder=make(s===-1?'left upper arm':'right upper arm',{x:x+s*.7,y:3.03,z},{x:.28,y:.84,z:.29},'box',shell);
    const arm=make(s===-1?'left forearm':'right forearm',{x:x+s*.76,y:2.32,z},{x:.26,y:.78,z:.27},'box',dark);
    at(torso,shoulder,[s*.55,3.43,0]);at(shoulder,arm,[s*.75,2.65,0]);
    const thigh=make(s===-1?'left thigh':'right thigh',{x:x+s*.24,y:1.77,z},{x:.31,y:.92,z:.35},'box',shell);
    const shin=make(s===-1?'left shin':'right shin',{x:x+s*.24,y:.91,z},{x:.29,y:.86,z:.31},'box',dark);
    at(pelvis,thigh,[s*.22,2.10,0]);at(thigh,shin,[s*.24,1.32,0]);
  }
  // Decorative eyes are attached to the moving head mesh and have no colliders.
  for(const dx of [-.12,.12]){
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),eye);
    pupil.position.set(dx,.045,.257);head && pieces[2].mesh.add(pupil);
  }
  // Chest badge is purely visual.
  const badge=roundedBox({x:.36,y:.2,z:.025},joints);badge.position.set(0,.15,.25);pieces[0].mesh.add(badge);
  const item={kind:'dummy',label:'TEST DUMMY',pieces,bodies,meshes,attachments,primary:torso};
  for(const m of meshes)m.traverse(o=>o.userData.item=item);
  return item;
}
