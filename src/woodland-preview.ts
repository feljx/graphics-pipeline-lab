import {createWoodland} from './scene/woodland';
const el=(id:string)=>document.getElementById(id)!;
const fmt=(values:readonly number[])=>values.map(v=>v.toFixed(3)).join('  ');
createWoodland(el('world'),data=>{
 el('name').textContent=data.name;el('count').textContent=data.vertices+' mesh vertices (triangle buffer)';
 const input=el('vertex') as HTMLInputElement;if(document.activeElement!==input)input.value=String(data.vertex);input.max=String(Math.max(0,data.vertices-1));
 const t=data.trace;el('trace').textContent=t?['Local  '+fmt(t.local.toArray()),'World  '+fmt(t.world.toArray()),'View   '+fmt(t.camera.toArray()),'Clip   '+fmt(t.clip.toArray()),'NDC    '+(t.ndc?fmt(t.ndc):'undefined'),'Pixel  '+(t.screen?fmt(t.screen):'undefined'),t.status].join('\n'):'';
 const opened=Array.from(el('matrices').querySelectorAll('details')).map(d=>d.open);
 el('matrices').replaceChildren(...data.matrices.map((m,i)=>{const d=document.createElement('details');d.open=opened[i]??false;const s=document.createElement('summary');s.textContent=m.name;const pre=document.createElement('pre');pre.textContent=m.values.map(fmt).join('\n');d.append(s,pre);return d;}));
}).then(world=>{el('home').onclick=()=>world.home();el('vertex').onchange=e=>{const value=(e.target as HTMLInputElement).valueAsNumber;if(Number.isFinite(value))world.setVertex(value);};window.addEventListener('beforeunload',()=>world.dispose(),{once:true});}).catch(error=>{el('name').textContent='Assets could not load';el('count').textContent=String(error);});
