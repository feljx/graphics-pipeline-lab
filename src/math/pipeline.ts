import { Matrix4, Vector4 } from 'three';
export function trace(local: Vector4, model: Matrix4, view: Matrix4, projection: Matrix4, width: number, height: number) {
 const world=local.clone().applyMatrix4(model), camera=world.clone().applyMatrix4(view), clip=camera.clone().applyMatrix4(projection);
 const valid=Number.isFinite(clip.w)&&Math.abs(clip.w)>1e-8 && [clip.x,clip.y,clip.z].every(Number.isFinite);
 const ndc=valid ? [clip.x/clip.w,clip.y/clip.w,clip.z/clip.w] : null;
 const planes=['left','right','bottom','top','near','far'].filter((_,i)=>[clip.x < -clip.w,clip.x > clip.w,clip.y < -clip.w,clip.y > clip.w,clip.z < -clip.w,clip.z > clip.w][i]);
 const behind=camera.z>0;
 const status=!valid?'Invalid W':behind||clip.w<=0?'Behind camera':planes.length?`Clipped: ${planes.join(', ')}`:'Visible';
 return {local,world,camera,clip,ndc,screen:ndc?[(ndc[0]+1)*width/2,(1-ndc[1])*height/2]:null,status,visible:valid&&!behind&&clip.w>0&&!planes.length};
}
export const rows=(matrix:Matrix4)=>Array.from({length:4},(_,r)=>Array.from({length:4},(_,c)=>matrix.elements[c*4+r]));
