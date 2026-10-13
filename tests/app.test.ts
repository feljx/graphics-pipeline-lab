import {beforeEach,afterEach,expect,it,vi} from 'vitest';
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
 lab.gizmo.pointerUp({...pointer!,button:0});expect(lab.orbit.enabled).toBe(true);
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

it('shares controls across workbench tabs and restores a collapsed panel',()=>{
 edit('position-0','2');
 element('camera-tab').onclick!();
 expect(element('object-controls').hidden).toBe(true);
 expect(element('camera-controls').hidden).toBe(false);
 expect(element('camera-tab').getAttribute('aria-selected')).toBe('true');
 element('panel-toggle').onclick!();expect(element('workbench-body').hidden).toBe(true);
 element('math-tab').onclick!();expect(element('workbench-body').hidden).toBe(false);
 expect(element('math-controls').hidden).toBe(false);
 element('object-tab').onclick!();expect(element('position-0').value).toBe('2');
 expect(lab.cube.position.x).toBe(2);flushFrames();
});
it('supports roving keyboard tabs without changing the pipeline stage',()=>{
 const event=Object.defineProperty(Object.assign(new Event('keydown'),{key:'End'}),'target',{value:element('object-tab')});
 element('app').dispatchEvent(event);
 expect(element('settings').tabIndex).toBe(0);
 expect(element('view-controls').hidden).toBe(false);
 expect(element('vertex-panel').hidden).toBe(true);
 element('pipeline-tab').onclick!();expect(element('pipeline-controls').hidden).toBe(false);flushFrames();
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
