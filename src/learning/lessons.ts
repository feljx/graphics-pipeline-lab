import {Vector4} from 'three';
import type {createLab} from '../scene/lab';
export type Kind='perspective'|'parent'|'clip';
export const titles:Record<Kind,string>={perspective:'Perspective versus orthographic',parent:'Local versus parent transforms',clip:'Near-plane clipping'};
/** Landmarks are transformed through the synchronized application matrices. */
export function measure(lab:ReturnType<typeof createLab>){
 lab.sync();const project=(x:number,y:number,z:number)=>new Vector4(x,y,z,1).applyMatrix4(lab.cube.matrixWorld).applyMatrix4(lab.camera.matrixWorldInverse).applyMatrix4(lab.camera.projectionMatrix);
 const a=project(-1,0,0),b=project(1,0,0),corners=lab.corners.map(p=>project(p.x,p.y,p.z));
 const xs=corners.map(p=>p.x/p.w);const depths=lab.corners.map(p=>-p.clone().applyMatrix4(lab.cube.matrixWorld).applyMatrix4(lab.camera.matrixWorldInverse).z);
 return {span:b.x/b.w-a.x/a.w,silhouette:Math.max(...xs)-Math.min(...xs),world:new Vector4(0,0,0,1).applyMatrix4(lab.cube.matrixWorld).toArray().slice(0,3),local:lab.cube.position.toArray(),depths,rejected:corners.filter(p=>p.z < -p.w).length};
}
export const close=(a:number,b:number)=>Math.abs(a-b)<1e-6;
