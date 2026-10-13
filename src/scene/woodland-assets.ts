import * as T from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';

/** Load a deterministic woodland without creating a renderer or UI. */
export async function loadWoodland(){
 const world=new T.Group();world.name='Woodland';
 const meshes:T.Mesh[]=[];
 function block(name:string,x:number,y:number,z:number,sx:number,sy:number,sz:number,color:number){
  const mesh=new T.Mesh(new T.BoxGeometry(sx,sy,sz),new T.MeshStandardMaterial({color,roughness:1}));
  mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;world.add(mesh);meshes.push(mesh);return mesh;
 }
 block('Earth / diorama base',0,-.71,0,14,1.1,12,0x695043);
 block('Moss / ground',0,-.08,0,14,.16,12,0x789678);
 for(let i=0;i<10;i++)block('Stepping stone '+(i+1),Math.sin(i*.7)*.4,.04,5-i*.9,.85,.12,.66,0xc2b39a);
 const base=(import.meta as ImportMeta & {env:{BASE_URL:string}}).env.BASE_URL+'assets/nature/';
 const templates=new Map<string,T.Group>();
 async function asset(name:string){
  const materials=await new MTLLoader().loadAsync(base+name+'.mtl');materials.preload();
  const model=await new OBJLoader().setMaterials(materials).loadAsync(base+name+'.obj');templates.set(name,model);
 }
 try {await Promise.all(['tree_blocks','tree_blocks_fall','tree_pineDefaultA','tent_detailedOpen','campfire_stones','log','log_stack','rock_smallA','rock_smallB','mushroom_redGroup'].map(asset));}
 catch(error){world.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});throw error;}
 function place(type:string,label:string,x:number,z:number,scale:number,rotation=0){
  const group=templates.get(type)!.clone(true);group.name=label;group.position.set(x,0,z);group.scale.setScalar(scale);group.rotation.y=rotation;
  group.traverse(o=>{if(o instanceof T.Mesh){o.name=label+' / '+o.name;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;o.receiveShadow=true;meshes.push(o);}});world.add(group);return group;
 }
 place('tent_detailedOpen','Amber tent',2.5,-1,4,Math.PI*.85);
 place('campfire_stones','Stone fire ring',.5,1,3);
 place('log','Fallen log / seat',-1.5,1.2,3,.5);
 place('log_stack','Firewood',4,1.5,3);
 const trees:[number,number,number][]=[[-5,-4,3.8],[-2.6,-4.7,4.2],[1,-4.8,3.5],[4.8,-4.4,4],[-5.6,-1,3.5],[-4,2.4,3.1],[5.6,3.8,3.2],[5.5,-.3,3.4]];
 trees.forEach(([x,z,s],i)=>place(i%3===0?'tree_blocks_fall':i%3===1?'tree_blocks':'tree_pineDefaultA','Tree '+(i+1),x,z,s,i*.8));
 [[-5,4],[3.8,4.8],[-3,-2],[5,-3]].forEach(([x,z],i)=>place(i%2?'rock_smallA':'rock_smallB','Boulder '+(i+1),x,z,3.5,i));
 place('mushroom_redGroup','Red mushrooms',-3,3.5,3);
 return {world,meshes};
}
