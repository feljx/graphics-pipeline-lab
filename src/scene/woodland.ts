import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {loadWoodland} from './woodland-assets';
import {trace, rows} from '../math/pipeline';

/** Standalone scene: owns only its host canvas, objects and event handlers. */
export async function createWoodland(host: HTMLElement, inspect: (data: ReturnType<typeof inspection>) => void) {
 const renderer = new T.WebGLRenderer({antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setClearColor(0x182a30);
 renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
 host.append(renderer.domElement);
 const scene=new T.Scene(); const world=new T.Group(); scene.add(world);
 const camera=new T.OrthographicCamera(-10,10,10,-10,.1,100);
 camera.position.set(16,14,16); camera.layers.enable(1);
 const orbit=new OrbitControls(camera,renderer.domElement); orbit.target.set(0,1,0); orbit.enableDamping=true;
 orbit.minZoom=.45; orbit.maxZoom=5; orbit.maxPolarAngle=Math.PI*.48;
 scene.add(new T.HemisphereLight(0xfff0d6,0x40535b,2.4));
 const sun=new T.DirectionalLight(0xffdfad,3);sun.position.set(-8,16,9);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12,far:50});sun.shadow.bias=-.0003;scene.add(sun);
 const {world:loaded,meshes}=await loadWoodland();world.add(loaded);
 const box=new T.BoxHelper(world,0xffd896);box.layers.set(1);box.visible=false;scene.add(box);
 const dot=new T.Mesh(new T.SphereGeometry(.075,12,8),new T.MeshBasicMaterial({color:0xffe8ae,depthTest:false}));dot.layers.set(1);dot.renderOrder=10;dot.visible=false;scene.add(dot);
 let selected:T.Mesh|undefined,vertex=0,stopped=false,pending=0;
 function inspection(){
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  if(!selected)return {name:'Select an object',vertices:0,vertex:0,trace:null,matrices:[] as {name:string;values:number[][]}[]};
  const positions=selected.geometry.getAttribute('position');vertex=Math.min(vertex,positions.count-1);
  const local=new T.Vector4(positions.getX(vertex),positions.getY(vertex),positions.getZ(vertex),1);
  const t=trace(local,selected.matrixWorld,camera.matrixWorldInverse,camera.projectionMatrix,host.clientWidth,host.clientHeight);
  dot.position.set(t.world.x,t.world.y,t.world.z);dot.visible=true;box.setFromObject(selected);box.visible=true;
  return {name:selected.name,vertices:positions.count,vertex,trace:t,matrices:[{name:'Model / actual mesh matrixWorld',values:rows(selected.matrixWorld)},{name:'View',values:rows(camera.matrixWorldInverse)},{name:'Projection',values:rows(camera.projectionMatrix)}]};
 }
 function render(){pending=0;if(stopped)return;const moving=orbit.update();inspect(inspection());renderer.render(scene,camera);if(moving)request();}
 function request(){if(!pending&&!stopped)pending=requestAnimationFrame(render);}
 function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h);camera.left=-10*w/h;camera.right=10*w/h;camera.updateProjectionMatrix();request();}
 const observer=new ResizeObserver(resize);observer.observe(host);orbit.addEventListener('change',request);
 let start=new T.Vector2();const down=(e:PointerEvent)=>{start.set(e.clientX,e.clientY);};
 const up=(e:PointerEvent)=>{if(start.distanceTo(new T.Vector2(e.clientX,e.clientY))>5)return;const r=renderer.domElement.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObjects(meshes,false)[0];if(hit){selected=hit.object as T.Mesh;vertex=hit.face?.a??0;request();}};
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);
 resize();selected=meshes.find(m=>m.name.startsWith('Amber tent'));request();
 return {scene,camera,world,renderer,orbit,request,setVertex(value:number){vertex=Math.max(0,Math.floor(value));request();},home(){camera.position.set(16,14,16);camera.zoom=1;camera.updateProjectionMatrix();orbit.target.set(0,1,0);orbit.update();request();},dispose(){stopped=true;cancelAnimationFrame(pending);observer.disconnect();orbit.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments){geometries.add(o.geometry);(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();}};
}
