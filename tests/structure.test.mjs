import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url).pathname;
const read=file=>readFileSync(join(root,file),'utf8');
test('All static modules and main page exist',()=>{
  for(const p of ['index.html','style.css','src/main.js','src/physics.js','src/ragdoll.js','src/sandbox.js','src/controls.js','src/ui.js'])assert.ok(existsSync(join(root,p)),p);
});
test('Local module references resolve to tracked files',()=>{
  for(const [,link] of read('index.html').matchAll(/(?:href|src)="(\.\/[^\"]+)"/g))assert.ok(existsSync(join(root,link)),link);
  for(const file of ['main','physics','ragdoll','sandbox','controls','ui'])for(const [,link] of read(`src/${file}.js`).matchAll(/from ['"](\.\/[^'"]+)['"]/g))assert.ok(existsSync(join(root,'src',link)),link);
});
test('Game includes visible bootstrap controls and physics initialization',()=>{
  const html=read('index.html');const js=read('src/main.js');
  for(const id of ['startBtn','spawnBtn','gravity','timeScale','pauseBtn','resetBtn','help','game'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(js,/await app\.physics\.init\(\)/);
  assert.match(read('src/physics.js'),/createImpulseJoint/);
});
