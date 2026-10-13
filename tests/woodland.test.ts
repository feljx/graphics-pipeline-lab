/// <reference types="vite/client" />
import {expect,it,vi} from 'vitest';
import * as T from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import {loadWoodland} from '../src/scene/woodland-assets';
import {trace} from '../src/math/pipeline';

it('loads the vendored pack deterministically and traces an actual imported vertex',async()=>{
 const files=import.meta.glob<string>('../public/assets/nature/*.{obj,mtl}',{query:'?raw',import:'default',eager:true});
 const source=(url:string)=>files['../public/assets/nature/'+url.split('/').pop()];
 const mtl=vi.spyOn(MTLLoader.prototype,'loadAsync').mockImplementation(async function(this:MTLLoader,url:string){return this.parse(source(url),'');});
 const obj=vi.spyOn(OBJLoader.prototype,'loadAsync').mockImplementation(async function(this:OBJLoader,url:string){return this.parse(source(url));});
 try{
  const first=await loadWoodland(),second=await loadWoodland();
  first.world.updateMatrixWorld(true);second.world.updateMatrixWorld(true);
  expect(first.meshes.length).toBeGreaterThan(20);expect(first.meshes.map(m=>m.matrixWorld.toArray())).toEqual(second.meshes.map(m=>m.matrixWorld.toArray()));
  const mesh=first.meshes.find(m=>m.name.startsWith('Amber tent'))!;expect(mesh).toBeDefined();
  const p=mesh.geometry.getAttribute('position'),local=new T.Vector4(p.getX(0),p.getY(0),p.getZ(0),1);
  const camera=new T.OrthographicCamera(-13,13,10,-10,.1,100);camera.position.set(16,14,16);camera.lookAt(0,1,0);camera.updateMatrixWorld(true);
  const t=trace(local,mesh.matrixWorld,camera.matrixWorldInverse,camera.projectionMatrix,800,600);
  expect(t.world.toArray()).toEqual(local.clone().applyMatrix4(mesh.matrixWorld).toArray());expect(t.clip.w).toBeCloseTo(1,12);expect(t.visible).toBe(true);
  const trees=first.meshes.filter(m=>m.name.includes('tree_blocks')&&!m.name.includes('fall'));expect(trees.length).toBeGreaterThan(1);expect(trees[0].material).not.toBe(trees[1].material);
  expect(first.meshes.every(m=>m.layers.mask===1)).toBe(true);
  const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();for(const entry of [first,second])entry.world.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 }finally{mtl.mockRestore();obj.mockRestore();}
});
