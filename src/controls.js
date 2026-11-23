import * as THREE from 'three';

export class SandboxControls {
  constructor(camera,canvas,physics,getItems,interact) {
    this.camera=camera;this.canvas=canvas;this.physics=physics;this.getItems=getItems;this.interact=interact;
    this.focus=new THREE.Vector3(0,1.65,0);
    this.distance=16;this.yaw=.58;this.pitch=.47;
    this.raycaster=new THREE.Raycaster();this.mouse=new THREE.Vector2();
    this.active=null;this.grab=null;this.mode='grab';this.keys=new Set();this.pointers=new Map();this.pinchDistance=0;
    this.updateCamera();this.bind();
  }
  updateCamera() {
    const c=Math.cos(this.pitch);
    this.camera.position.set(this.focus.x+Math.sin(this.yaw)*c*this.distance,this.focus.y+Math.sin(this.pitch)*this.distance,this.focus.z+Math.cos(this.yaw)*c*this.distance);
    this.camera.lookAt(this.focus);
  }
  pick(e) {
    const r=this.canvas.getBoundingClientRect();
    this.mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));
    this.raycaster.setFromCamera(this.mouse,this.camera);
    const meshes=[];
    for(const item of this.getItems())meshes.push(...item.meshes);
    const hits=this.raycaster.intersectObjects(meshes,true);
    for(const hit of hits){
      let obj=hit.object;
      while(obj && !obj.userData.item)obj=obj.parent;
      const item=obj?.userData.item;
      if(item){const part=item.pieces.find(piece=>piece.mesh===obj || piece.mesh===hit.object || hit.object.parent===piece.mesh);
        return {item,body:part?.body||item.primary,point:hit.point,distance:hit.distance};}
    }
    return null;
  }
  bind() {
    const el=this.canvas;
    el.addEventListener('contextmenu',e=>e.preventDefault());
    el.addEventListener('pointerdown',e=>{
      if(e.button===2){this.active={id:e.pointerId,x:e.clientX,y:e.clientY,orbit:true};el.setPointerCapture(e.pointerId);return;}
      this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size>1){this.grab=null;this.pinchDistance=0;return;}
      const hit=this.pick(e);
      this.active={id:e.pointerId,x:e.clientX,y:e.clientY,orbit:!hit};
      if(hit){this.interact(hit,this.mode);
        if(this.mode==='grab' && hit.body?.isDynamic()){
          this.grab={body:hit.body,distance:Math.max(1,hit.distance),target:hit.point.clone()};
          this.interact({item:hit.item,body:hit.body},'select');
        }
      }else this.interact(null,'deselect');
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(this.pointers.has(e.pointerId))this.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(this.pointers.size===2){const pts=[...this.pointers.values()];const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if(this.pinchDistance)this.distance=THREE.MathUtils.clamp(this.distance+ (this.pinchDistance-dist)*.03,5,34);
        this.pinchDistance=dist;this.grab=null;this.updateCamera();return;
      }
      if(!this.active || this.active.id!==e.pointerId)return;
      const dx=e.clientX-this.active.x,dy=e.clientY-this.active.y;
      this.active.x=e.clientX;this.active.y=e.clientY;
      if(this.grab){this.pickRay(e);this.grab.target.copy(this.raycaster.ray.at(this.grab.distance,new THREE.Vector3()));}
      else if(this.active.orbit){this.yaw-=dx*.007;this.pitch=THREE.MathUtils.clamp(this.pitch+dy*.006,-.08,1.24);this.updateCamera();}
    });
    const end=e=>{this.pointers.delete(e.pointerId);if(this.active?.id===e.pointerId){this.active=null;this.grab=null;}if(this.pointers.size<2)this.pinchDistance=0;};
    el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('lostpointercapture',end);
    el.addEventListener('wheel',e=>{e.preventDefault();this.distance=THREE.MathUtils.clamp(this.distance*Math.exp(e.deltaY*.001),5,34);this.updateCamera();},{passive:false});
    window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;this.keys.add(e.key.toLowerCase());});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur',()=>{this.keys.clear();this.grab=null;});
  }
  pickRay(e){const r=this.canvas.getBoundingClientRect();this.mouse.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));this.raycaster.setFromCamera(this.mouse,this.camera);}
  update(dt){
    const step=Math.min(.1,dt)*5;const side=new THREE.Vector3(Math.cos(this.yaw),0,-Math.sin(this.yaw)),front=new THREE.Vector3(-Math.sin(this.yaw),0,-Math.cos(this.yaw));
    let dirty=false;
    if(this.keys.has('w')||this.keys.has('arrowup')){this.focus.addScaledVector(front,step);dirty=true;}
    if(this.keys.has('s')||this.keys.has('arrowdown')){this.focus.addScaledVector(front,-step);dirty=true;}
    if(this.keys.has('a')||this.keys.has('arrowleft')){this.focus.addScaledVector(side,-step);dirty=true;}
    if(this.keys.has('d')||this.keys.has('arrowright')){this.focus.addScaledVector(side,step);dirty=true;}
    this.focus.x=THREE.MathUtils.clamp(this.focus.x,-9,9);this.focus.z=THREE.MathUtils.clamp(this.focus.z,-9,9);
    if(dirty)this.updateCamera();
    if(this.grab) {
      const {body,target}=this.grab;
      if(body.isDynamic())this.physics.pull(body,target,45);else this.grab=null;
    }
  }
  clearGrab(){this.grab=null;}
}
