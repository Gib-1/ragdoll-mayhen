import RAPIER from 'rapier';
import * as THREE from 'three';

export class PhysicsEngine {
  constructor() { this.world = null; this.objects = new Set(); this.gravity = 9.8; }
  async init() {
    await RAPIER.init();
    this.rapier = RAPIER;
    this.world = new RAPIER.World({ x: 0, y: -this.gravity, z: 0 });
    this.world.timestep = 1 / 60;
    this.makeFixedBox({ x: 0, y: -0.4, z: 0 }, { x: 80, y: .8, z: 80 });
  }
  vec(p) { return {x:p.x,y:p.y,z:p.z}; }
  setGravity(value) { this.gravity = value; this.world.gravity = {x:0,y:-value,z:0}; }
  makeFixedBox(pos, size, rotation) {
    const desc = RAPIER.RigidBodyDesc.fixed().setTranslation(pos.x,pos.y,pos.z);
    if (rotation) desc.setRotation(rotation);
    const body = this.world.createRigidBody(desc);
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2).setFriction(.8),body);
    return body;
  }
  body(pos, size, shape='box', opts={}) {
    const rb = RAPIER.RigidBodyDesc.dynamic().setTranslation(pos.x,pos.y,pos.z).setLinearDamping(.17).setAngularDamping(.7).setCanSleep(true);
    if (opts.rotation) rb.setRotation(opts.rotation);
    const body=this.world.createRigidBody(rb);
    const desc=shape==='sphere'?RAPIER.ColliderDesc.ball(size.x/2):shape==='cylinder'?RAPIER.ColliderDesc.cylinder(size.y/2,size.x/2):RAPIER.ColliderDesc.cuboid(size.x/2,size.y/2,size.z/2);
    this.world.createCollider(desc.setDensity(opts.density ?? 1).setRestitution(opts.bounce ?? .15).setFriction(opts.friction ?? .78),body);
    return body;
  }
  spherical(a,b,anchor) {
    const pa=a.translation(),pb=b.translation();
    const joint=RAPIER.JointData.spherical({x:anchor.x-pa.x,y:anchor.y-pa.y,z:anchor.z-pa.z},{x:anchor.x-pb.x,y:anchor.y-pb.y,z:anchor.z-pb.z});
    return this.world.createImpulseJoint(joint,a,b,true);
  }
  update() { this.world.step(); }
  remove(item) {
    // Joints connected to a body are automatically removed by Rapier.
    if (item.bodies) for (const b of item.bodies) { try { this.world.removeRigidBody(b); } catch(_) {} }
  }
  pull(body,target,strength=38) {
    if (!body || !body.isDynamic()) return;
    const p=body.translation(),v=body.linvel(),mass=body.mass();
    const diff=new THREE.Vector3(target.x-p.x,target.y-p.y,target.z-p.z);
    if(diff.length()>6)diff.setLength(6);
    const force=diff.multiplyScalar(strength * Math.max(.3,mass)).sub(new THREE.Vector3(v.x,v.y,v.z).multiplyScalar(7*Math.max(.3,mass)));
    body.addForce({x:force.x,y:force.y,z:force.z},true);
  }
  impulse(body,origin,power=10) {
    if(!body || !body.isDynamic())return;
    const p=body.translation();
    const direction=new THREE.Vector3(p.x-origin.x,p.y-origin.y,p.z-origin.z);
    if(direction.lengthSq()<.01)direction.set(0,1,0);
    direction.normalize().add(new THREE.Vector3(0,.45,0)).normalize().multiplyScalar(Math.min(18,power*Math.max(.75,Math.sqrt(body.mass()))));
    body.applyImpulse(this.vec(direction),true);
  }
  toggleFreeze(body) {
    if(!body)return false;
    const frozen=body.bodyType()===RAPIER.RigidBodyType.Dynamic;
    body.setBodyType(frozen?RAPIER.RigidBodyType.Fixed:RAPIER.RigidBodyType.Dynamic,true);
    return frozen;
  }
}