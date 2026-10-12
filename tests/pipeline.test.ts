import {describe,it,expect} from 'vitest';
import {Matrix4,Vector4,PerspectiveCamera,OrthographicCamera,Object3D} from 'three';
import {trace,rows} from '../src/math/pipeline';
const I=new Matrix4();const run=(p=new Vector4(0,0,0,1),m=I,v=I,pr=I)=>trace(p,m,v,pr,600,600);
const close=(actual:number[]|null,expected:number[])=>{expect(actual).not.toBeNull();expected.forEach((x,i)=>expect(actual![i]).toBeCloseTo(x,8));};
describe('production homogeneous pipeline',()=>{
 it('identity and row display',()=>{close(run().clip.toArray(),[0,0,0,1]);expect(rows(new Matrix4().makeTranslation(1,2,3))[0]).toEqual([1,0,0,1]);});
 it('required perspective numerical example',()=>{const c=new PerspectiveCamera(90,1,1,10);const t=run(undefined,new Matrix4().makeTranslation(1,1,-3),I,c.projectionMatrix);close(t.world.toArray(),[1,1,-3,1]);close(t.clip.toArray(),[1,1,13/9,3]);close(t.ndc,[1/3,1/3,13/27]);close(t.screen,[400,200]);expect(t.visible).toBe(true);});
 it('rotation and multiplication order',()=>{const r=new Matrix4().makeRotationZ(Math.PI/2),t=new Matrix4().makeTranslation(2,0,0);close(run(new Vector4(1,0,0,1),t.clone().multiply(r)).world.toArray(),[2,1,0,1]);close(run(new Vector4(1,0,0,1),r.clone().multiply(t)).world.toArray(),[0,3,0,1]);});
 it('actual parent world composition',()=>{const p=new Object3D(),c=new Object3D();p.position.set(2,0,0);p.rotation.z=Math.PI/2;c.position.set(1,0,0);p.add(c);p.updateMatrixWorld(true);close(run(undefined,c.matrixWorld).world.toArray(),[2,1,0,1]);});
 it('actual camera inverse',()=>{const c=new PerspectiveCamera();c.position.set(0,0,5);c.updateMatrixWorld();close(run(undefined,I,c.matrixWorldInverse).camera.toArray(),[0,0,-5,1]);});
 it('orthographic projection preserves w',()=>{const c=new OrthographicCamera(-2,2,2,-2,1,11);const t=run(new Vector4(1,1,-6,1),I,I,c.projectionMatrix);close(t.clip.toArray(),[.5,.5,0,1]);close(t.screen,[450,150]);});
 it('clip boundaries inclusive, every plane classified',()=>{for(const p of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])expect(run(new Vector4(p[0],p[1],p[2]-2,1),I,I,new Matrix4().makeTranslation(0,0,2)).visible).toBe(true);for(const p of [[2,0,0],[-2,0,0],[0,2,0],[0,-2,0],[0,0,2],[0,0,-2]])expect(run(new Vector4(p[0],p[1],p[2]-2,1),I,I,new Matrix4().makeTranslation(0,0,2)).visible).toBe(false);});
 it('invalid zero, tiny and nonfinite W',()=>{for(const w of [0,1e-10,NaN,Infinity]){const t=run(new Vector4(0,0,0,w));expect(t.ndc).toBeNull();expect(t.status).toBe('Invalid W');}});
 it('behind camera',()=>{const c=new PerspectiveCamera();expect(run(new Vector4(0,0,2,1),I,I,c.projectionMatrix).status).toBe('Behind camera');});
 it('orthographic behind-camera classification uses view Z, not constant W',()=>{const c=new OrthographicCamera(-2,2,2,-2,1,10);const t=run(new Vector4(0,0,1,1),I,I,c.projectionMatrix);expect(t.clip.w).toBe(1);expect(t.status).toBe('Behind camera');expect(t.visible).toBe(false);expect(run(new Vector4(0,0,-.5,1),I,I,c.projectionMatrix).status).toBe('Clipped: near');});
 it('nonuniform scale',()=>close(run(new Vector4(1,1,1,1),new Matrix4().makeScale(2,3,4)).world.toArray(),[2,3,4,1]));
 it('top-left viewport corners and offscreen coordinates',()=>{close(run(new Vector4(-1,1,0,1)).screen,[0,0]);close(run(new Vector4(1,-1,0,1)).screen,[600,600]);close(run(new Vector4(2,0,0,1)).screen,[900,300]);});
});
