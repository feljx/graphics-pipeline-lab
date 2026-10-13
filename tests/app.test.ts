import {beforeEach,afterEach,expect,it,vi} from 'vitest';
import type {PerspectiveCamera} from 'three';
import type {createLab} from '../src/scene/lab';

// Keep scene objects, math, OrbitControls and TransformControls real. Only the
// browser DOM and GPU renderer are replaced so application handlers run in Node.
class ElementStub extends EventTarget {
 value=''; checked=false; hidden=false; textContent=''; className=''; min=''; max='';
 style={}; classList={toggle:vi.fn()}; clientWidth=1000;clientHeight=800;
 onclick?:()=>void;onchange?:()=>void;
 tabIndex=0;scrollTop=0;private attributes=new Map<string,string>();
 setAttribute(name:string,value:string){this.attributes.set(name,value);}
 getAttribute(name:string){return this.attributes.get(name)??null;}
 focus(){}
 contains(node:unknown){return node===this;}
 private html='';
 constructor(public id=''){super();}
 get innerHTML(){return this.html;}
 set innerHTML(value:string){this.html=value;this.parseInputs(value);}
 get valueAsNumber(){return this.value===''?NaN:Number(this.value);}
 get ownerDocument(){return document;}
 getRootNode(){return document;}
 setPointerCapture(){}
 releasePointerCapture(){}
 append(){}
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
 insertAdjacentHTML(_position:string,value:string){this.parseInputs(value);}
 private parseInputs(html:string){for(const tag of html.matchAll(/<input\b[^>]*>/g)){const id=tag[0].match(/id="([^"]+)"/)?.[1];if(!id)continue;const input=element(id);for(const key of ['value','min','max'] as const){const val=tag[0].match(new RegExp(`${key}="([^"]+)"`))?.[1];if(val!==undefined)input[key]=val;}}}
}
let elements:Map<string,ElementStub>;
function element(id:string){if(!elements.has(id))elements.set(id,new ElementStub(id));return elements.get(id)!;}
const frames=new Map<number,FrameRequestCallback>();let frameId=0;
function flushFrames(){for(let i=0;frames.size&&i<200;i++){const queued=[...frames.values()];frames.clear();for(const fn of queued)fn(0);}expect(frames.size).toBe(0);}

vi.mock('three',async importOriginal=>{
 const three=await importOriginal<typeof import('three')>();
 return {...three,WebGLRenderer:class {
  domElement=new ElementStub('canvas');shadowMap={enabled:false};private ratio=1;
  setPixelRatio(v:number){this.ratio=v;}getPixelRatio(){return this.ratio;}
  setClearColor(){}setSize(){}setScissorTest(){}setViewport(){}setScissor(){}
  render(scene:import('three').Scene,camera:import('three').Camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}
  dispose(){}
 }};
});
let lab:ReturnType<typeof createLab>;
let doc:EventTarget;
beforeEach(async()=>{
 vi.resetModules();elements=new Map();frames.clear();frameId=0;
 doc=Object.assign(new EventTarget(),{getElementById:element,querySelector:()=>element('app'),querySelectorAll:()=>[]});
 vi.stubGlobal('document',doc);vi.stubGlobal('window',new EventTarget());vi.stubGlobal('devicePixelRatio',2);
 vi.stubGlobal('requestAnimationFrame',vi.fn((fn:FrameRequestCallback)=>{frames.set(++frameId,fn);return frameId;}));
 vi.stubGlobal('cancelAnimationFrame',(id:number)=>frames.delete(id));
 vi.stubGlobal('ResizeObserver',class {observe(){}disconnect(){}});
 element('hierarchy').value='cube';element('space').value='local';
 const scene=await import('../src/scene/lab');const original=scene.createLab;
 vi.spyOn(scene,'createLab').mockImplementation((...args)=>{lab=original(...args);return lab;});
 await import('../src/main');flushFrames();frames.clear();
});
afterEach(()=>{lab?.dispose();vi.restoreAllMocks();vi.unstubAllGlobals();});
function change(id:string,value:string){element(id).value=value;element(id).onchange!();}
function edit(id:string,value:string){const input=element(id);input.value=value;doc.dispatchEvent(Object.defineProperty(new Event('input'),'target',{value:input}));}

it('renders mode, space and hierarchy changes while idle',()=>{
 expect(lab.gizmo.space).toBe('local');
 doc.dispatchEvent(Object.defineProperty(Object.assign(new Event('keydown'),{key:'e',code:'KeyE'}),'target',{value:{tagName:'BODY'}}));
 expect(lab.gizmo.mode).toBe('rotate');expect(frames.size).toBeGreaterThan(0);
 flushFrames();frames.clear();change('space','world');expect(frames.size).toBeGreaterThan(0);
 flushFrames();frames.clear();change('hierarchy','parent');expect(lab.gizmo.object).toBe(lab.parent);expect(frames.size).toBeGreaterThan(0);
});
it('can pick and drag a real gizmo handle and synchronizes numeric inputs',()=>{
 lab.sync();flushFrames();
 // Three.js consumes normalized {x,y,button}; @types declares PointerEvent.
 let pointer:PointerEvent|undefined;
 for(let x=-.3;x<=.3&&!pointer;x+=.02)for(let y=-.3;y<=.3&&!pointer;y+=.02){lab.gizmo.pointerHover({x,y,button:0} as PointerEvent);if(['X','Y','Z'].includes(lab.gizmo.axis??''))pointer={x,y,button:0} as PointerEvent;}
 expect(pointer).toBeDefined();const initial=lab.cube.position.clone();
 lab.gizmo.pointerDown(pointer!);expect(lab.gizmo.dragging).toBe(true);expect(lab.orbit.enabled).toBe(false);
 lab.gizmo.pointerMove({...pointer!,x:pointer!.x+.1,y:pointer!.y+.1,button:-1});
 expect(lab.cube.position.distanceTo(initial)).toBeGreaterThan(.001);flushFrames();
 lab.cube.position.toArray().forEach((v,i)=>expect(Number(element(`position-${i}`).value)).toBeCloseTo(v,2));
 lab.renderer.domElement.dispatchEvent(new Event('pointercancel'));expect(lab.gizmo.dragging).toBe(false);expect(lab.orbit.enabled).toBe(true);
});
it('keeps orders per object and camera edits leave both model matrices unchanged',()=>{
 edit('position-0','2');edit('position-1','0');edit('rotation-1','0');edit('rotation-2','90');
 change('hierarchy','parent');change('order','RTS');change('hierarchy','cube');
 expect(element('order').value).toBe('TRS');expect(lab.gizmo.enabled).toBe(true);
 const cube=lab.cube.matrixWorld.clone(),parent=lab.parent.matrixWorld.clone();edit('fov-0','60');
 change('projection','orthographic');element('camera-reset').onclick!();
 expect(lab.cube.matrixWorld.equals(cube)).toBe(true);expect(lab.parent.matrixWorld.equals(parent)).toBe(true);
 expect(lab.cube.matrixWorld.elements.slice(12,15)).toEqual([2,0,0]);
 change('hierarchy','parent');expect(element('order').value).toBe('RTS');expect(lab.gizmo.enabled).toBe(false);
});
it('parent rotation checkbox works with parent selected, including RTS composition',()=>{
 change('hierarchy','parent');change('order','RTS');edit('position-0','2');
 element('parent-enabled').checked=true;element('parent-enabled').onchange!();
 expect(lab.parent.rotation.y).toBeCloseTo(Math.PI/6);expect(Number(element('rotation-1').value)).toBe(30);
 expect(lab.parent.matrixWorld.elements[12]).toBeCloseTo(Math.sqrt(3));
 expect(lab.parent.matrixWorld.elements[14]).toBeCloseTo(-1);
 element('parent-enabled').checked=false;element('parent-enabled').onchange!();
 expect(lab.parent.rotation.y).toBe(0);expect(Number(element('rotation-1').value)).toBe(0);
});

it('opens one floating panel, preserves edits and dismisses on outside touch',()=>{
 expect(element('floating-panel').hidden).toBe(true);edit('position-0','2');
 element('camera-tab').onclick!();
 expect(element('floating-panel').hidden).toBe(false);expect(element('object-controls').hidden).toBe(true);
 expect(element('camera-tab').getAttribute('aria-expanded')).toBe('true');
 const inside=Object.defineProperty(new Event('pointerdown'),'target',{value:element('floating-panel')});doc.dispatchEvent(inside);
 expect(element('floating-panel').hidden).toBe(false);
 const outside=Object.defineProperty(new Event('pointerdown',{cancelable:true}),'target',{value:element('canvas')});doc.dispatchEvent(outside);
 expect(element('floating-panel').hidden).toBe(true);expect(outside.defaultPrevented).toBe(false);
 element('object-tab').onclick!();expect(element('position-0').value).toBe('2');expect(lab.cube.position.x).toBe(2);
 element('object-tab').onclick!();expect(element('floating-panel').hidden).toBe(true);flushFrames();
});
it('supports Escape and keeps inspection separate from object and view panels',()=>{
 element('math-tab').onclick!();expect(element('vertex-panel').hidden).toBe(false);
 doc.dispatchEvent(Object.assign(new Event('keydown'),{key:'Escape'}));
 expect(element('floating-panel').hidden).toBe(true);
 element('view-tab').onclick!();expect(element('view-controls').hidden).toBe(false);expect(element('vertex-panel').hidden).toBe(true);
 element('panel-close').onclick!();expect(element('view-tab').getAttribute('aria-expanded')).toBe('false');flushFrames();
});
it('fits a portrait viewport and resizes without changing the scene camera',()=>{
 const camera=lab.camera.projectionMatrix.clone();
 element('viewport').clientWidth=402;element('viewport').clientHeight=874;lab.request();flushFrames();lab.frame();flushFrames();
 const inspection=lab.orbit.object as PerspectiveCamera;inspection.updateMatrixWorld(true);
 for(const corner of lab.corners){const p=corner.clone().applyMatrix4(lab.cube.matrixWorld).applyMatrix4(inspection.matrixWorldInverse).applyMatrix4(inspection.projectionMatrix);expect(Math.abs(p.x/p.w)).toBeLessThan(.8);expect(Math.abs(p.y/p.w)).toBeLessThan(.8);}
 expect(lab.camera.projectionMatrix.equals(camera)).toBe(true);
 expect(lab.gizmo.size).toBeLessThan(1);
 const direction=inspection.position.clone().sub(lab.orbit.target).normalize(),target=lab.orbit.target.clone();
 element('viewport').clientWidth=874;element('viewport').clientHeight=402;lab.request();flushFrames();
 expect(lab.orbit.target.equals(target)).toBe(true);expect(inspection.position.clone().sub(target).normalize().distanceTo(direction)).toBeLessThan(1e-10);
});

it('coalesces drag inspection into one frame and avoids unchanged buffer resizes',()=>{
 const resize=vi.spyOn(lab.renderer,'setSize');
 const before=element('matrices').innerHTML;
 lab.cube.position.x=2;
 for(let i=0;i<20;i++)lab.gizmo.dispatchEvent({type:'objectChange'});
 expect(element('matrices').innerHTML).toBe(before);
 expect(frames.size).toBe(1);flushFrames();
 expect(Number(element('position-0').value)).toBe(2);
 expect(element('matrices').innerHTML).not.toBe(before);
 expect(resize).not.toHaveBeenCalled();
 element('viewport').clientWidth=600;lab.request();flushFrames();
 expect(resize).toHaveBeenCalledExactlyOnceWith(600,800,false);
});
it.each(['mouse','touch'])('%s dragging moves immediately, keeps damping rendering, then settles',pointerType=>{
 const canvas=lab.renderer.domElement;
 function pointer(type:string,x:number){canvas.dispatchEvent(Object.assign(new Event(type),{pointerId:1,pointerType,clientX:x,clientY:100,pageX:x,pageY:100,button:type==='pointermove'?-1:0}));}
 const initial=lab.orbit.object.position.clone();
 pointer('pointerdown',100);pointer('pointermove',200);
 expect(lab.orbit.object.position.distanceTo(initial)).toBeGreaterThan(.1);
 pointer('pointerup',200);
 const released=lab.orbit.object.position.clone();
 expect(frames.size).toBeGreaterThan(0);flushFrames();
 expect(lab.orbit.object.position.distanceTo(released)).toBeGreaterThan(.01);
 expect(frames.size).toBe(0);expect(lab.orbit.enabled).toBe(true);
});

it('keeps panels within the visual viewport when the phone keyboard opens',async()=>{
 const viewport=Object.assign(new EventTarget(),{height:420,offsetTop:35});
 Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
 const style={setProperty:vi.fn()};Object.assign(doc,{documentElement:{style}});
 const {bindWorkbench}=await import('../src/ui/workbench');const panel=bindWorkbench(()=>{});
 expect(style.setProperty).toHaveBeenCalledWith('--visible-height','420px');
 expect(style.setProperty).toHaveBeenCalledWith('--visible-top','35px');
 viewport.height=300;viewport.dispatchEvent(new Event('resize'));
 expect(style.setProperty).toHaveBeenCalledWith('--visible-height','300px');
 panel.dispose();style.setProperty.mockClear();viewport.dispatchEvent(new Event('resize'));expect(style.setProperty).not.toHaveBeenCalled();
});


it('integrates woodland selection, actual mesh transforms, preview, reset and return to cube',async()=>{
 const T=await import('three');const assets=await import('../src/scene/woodland-assets');
 const world=new T.Group(),parent=new T.Group();parent.position.set(2,0,-1);parent.scale.setScalar(3);world.add(parent);
 const mesh=new T.Mesh(new T.BoxGeometry(1,2,1),new T.MeshStandardMaterial());mesh.name='Amber tent / fixture';mesh.position.y=1;parent.add(mesh);
 vi.spyOn(assets,'loadWoodland').mockResolvedValue({world,meshes:[mesh]});
 element('scene-choice').value='woodland';await element('scene-choice').onchange!();flushFrames();
 expect(world.parent).toBe(lab.scene);expect(world.visible).toBe(true);expect(lab.parent.visible).toBe(false);expect(lab.floor.visible).toBe(false);
 expect(lab.gizmo.object).toBe(mesh);expect(element('object-name').textContent).toBe(mesh.name);expect(element('vertex').innerHTML).toContain('mesh');
 expect(lab.camera).toBeInstanceOf(T.OrthographicCamera);expect(element('projection').value).toBe('orthographic');
 edit('position-0','1.5');flushFrames();expect(mesh.position.x).toBe(1.5);expect(mesh.matrixWorld.elements[12]).toBe(6.5);
 const numeric=element('matrices').innerHTML;expect(numeric).toContain('6.500');expect(element('trace').innerHTML).toContain('World');
 element('compare').onclick!();flushFrames();const ghost=lab.scene.children.find(o=>o instanceof T.Mesh&&o.material instanceof T.MeshBasicMaterial&&o.material.wireframe) as import('three').Mesh;
 expect(ghost.geometry).toBe(mesh.geometry);expect(ghost.matrix.equals(mesh.matrixWorld)).toBe(true);
 change('hierarchy','parent');expect(lab.gizmo.object).toBe(parent);edit('rotation-1','30');flushFrames();expect(parent.rotation.y).toBeCloseTo(Math.PI/6);
 element('reset').onclick!();flushFrames();expect(mesh.position.x).toBe(0);expect(parent.rotation.y).toBe(0);expect(parent.scale.x).toBe(3);
 element('scene-choice').value='cube';await element('scene-choice').onchange!();flushFrames();expect(world.visible).toBe(false);expect(lab.parent.visible).toBe(true);expect(lab.gizmo.object).toBe(lab.cube);expect(element('object-name').textContent).toBe('Cube.001');
});

it('walkthrough commands use real controls, verify perspective/orthographic and restore',async()=>{
 const initial=lab.cube.matrixWorld.clone(),camera=lab.camera.matrixWorld.clone();
 element('lesson-perspective').onclick!();await Promise.resolve();await Promise.resolve();
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 expect(lab.cube.position.z).toBe(0);expect(lab.camera).toBeInstanceOf((await import('three')).OrthographicCamera);
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 expect(lab.cube.position.z).toBe(4);expect(Number(element('position-2').value)).toBe(4);
 element('learn-exit').onclick!();await Promise.resolve();await Promise.resolve();flushFrames();
 expect(lab.cube.matrixWorld.equals(initial)).toBe(true);expect(lab.camera.matrixWorld.equals(camera)).toBe(true);
});
it.each(['parent','clip'])('walkthrough %s completes its mathematical motion through application commands',async kind=>{
 element(`lesson-${kind}`).onclick!();await Promise.resolve();await Promise.resolve();
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 if(kind==='parent'){expect(lab.cube.position.toArray()).toEqual([2,0,0]);expect(lab.cube.matrixWorld.elements[12]).toBeCloseTo(0);expect(lab.cube.matrixWorld.elements[14]).toBeCloseTo(-2);}else{expect(lab.camera.near).toBe(4.5);const {measure}=await import('../src/learning/lessons');expect(measure(lab).rejected).toBe(4);}
 element('learn-exit').onclick!();await Promise.resolve();await Promise.resolve();flushFrames();
});
it('manual input cancels queued walkthrough motion, replay restores checkpoint, scene switch cancels',async()=>{
 element('lesson-perspective').onclick!();await Promise.resolve();await Promise.resolve();element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 edit('position-2','1');flushFrames();expect(lab.cube.position.z).toBe(1);
 element('learn-replay').onclick!();await Promise.resolve();await Promise.resolve();expect(lab.cube.position.z).toBe(0);
 element('scene-choice').value='cube';await element('scene-choice').onchange!();flushFrames();expect(lab.cube.position.z).toBe(0);expect(element('learn-card').hidden).toBe(true);
});

it('measures perspective and orthographic animated results from actual matrices',async()=>{
 const {measure}=await import('../src/learning/lessons');element('lesson-perspective').onclick!();await Promise.resolve();await Promise.resolve();const initial=measure(lab);
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 for(const time of [0,900,1800,2700]){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));}await Promise.resolve();await Promise.resolve();
 expect(measure(lab).span/initial.span).toBeCloseTo(2);expect(measure(lab).silhouette/initial.silhouette).toBeCloseTo(7/3);expect(element('learn-caption').textContent).toContain('2.000');
 element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();const ortho=measure(lab).span;element('learn-next').onclick!();await Promise.resolve();await Promise.resolve();
 for(const time of [3000,3900,4800,5700]){const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));}await Promise.resolve();await Promise.resolve();expect(measure(lab).span).toBeCloseTo(ortho);
 element('learn-exit').onclick!();await Promise.resolve();await Promise.resolve();flushFrames();
});
it('restores Woodland selection, transforms, projection and open panel after an explicit cube lesson',async()=>{
 const T=await import('three'),assets=await import('../src/scene/woodland-assets');const world=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial());mesh.name='Amber tent fixture';world.add(mesh);vi.spyOn(assets,'loadWoodland').mockResolvedValue({world,meshes:[mesh]});element('scene-choice').value='woodland';await element('scene-choice').onchange!();edit('position-0','1.7');element('math-tab').onclick!();const before=mesh.matrixWorld.clone();
 element('lesson-parent').onclick!();await Promise.resolve();await Promise.resolve();await Promise.resolve();element('learn-exit').onclick!();for(let i=0;i<6;i++)await Promise.resolve();flushFrames();
 expect(world.visible).toBe(true);expect(lab.gizmo.object).toBe(mesh);expect(mesh.matrixWorld.equals(before)).toBe(true);expect(element('math-tab').getAttribute('aria-expanded')).toBe('true');expect(lab.camera).toBeInstanceOf(T.OrthographicCamera);
});
it('restores parent selection, nonstandard order, selected vertex and inspection projection',async()=>{
 change('hierarchy','parent');change('order','RTS');edit('position-0','2');edit('rotation-1','25');change('vertex','6');element('camera-tab').onclick!();const matrix=lab.parent.matrixWorld.clone(),far=lab.inspection.far,position=lab.inspection.position.clone();
 element('lesson-clip').onclick!();await Promise.resolve();await Promise.resolve();element('learn-exit').onclick!();for(let i=0;i<4;i++)await Promise.resolve();flushFrames();
 expect(lab.parent.matrixWorld.equals(matrix)).toBe(true);expect(lab.gizmo.object).toBe(lab.parent);expect(element('order').value).toBe('RTS');expect(lab.gizmo.enabled).toBe(false);expect(element('vertex').value).toBe('6');expect(lab.inspection.far).toBe(far);expect(lab.inspection.position.distanceTo(position)).toBeLessThan(1e-8);expect(element('camera-tab').getAttribute('aria-expanded')).toBe('true');
});
