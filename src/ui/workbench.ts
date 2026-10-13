const views=['object','camera','math','view'] as const;
type View=typeof views[number];
/** One non-modal panel: outside touches dismiss it without blocking the scene. */
export function bindWorkbench(layoutChanged:()=>void){
 const panel=document.getElementById('floating-panel')!,dock=document.getElementById('panel-dock')!,body=document.getElementById('workbench-body')!;
 const buttons=views.map(view=>document.getElementById(`${view}-tab`)!);
 const viewport=window.visualViewport;
 function resize(){if(viewport){document.documentElement.style.setProperty('--visible-height',`${viewport.height}px`);document.documentElement.style.setProperty('--visible-top',`${viewport.offsetTop}px`);layoutChanged();}}
 viewport?.addEventListener('resize',resize);viewport?.addEventListener('scroll',resize);resize();
 let selected:View|undefined;
 function close(restoreFocus=false){panel.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(restoreFocus&&selected)buttons[views.indexOf(selected)].focus();selected=undefined;}
 function select(view:View){selected=view;panel.hidden=false;views.forEach((v,i)=>{document.getElementById(`${v}-controls`)!.hidden=v!==view;buttons[i].setAttribute('aria-expanded',String(v===view));});document.getElementById('vertex-panel')!.hidden=view!=='math';document.getElementById('panel-title')!.textContent={object:'Object',camera:'Scene camera',math:'Inspect',view:'View'}[view];body.scrollTop=0;document.getElementById('panel-close')!.focus();layoutChanged();}
 function outside(e:Event){if(!panel.hidden&&!panel.contains(e.target as Node)&&!dock.contains(e.target as Node))close();}
 function escape(e:KeyboardEvent){if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close(true);}}
 buttons.forEach((button,i)=>button.onclick=()=>selected===views[i]?close():select(views[i]));document.getElementById('panel-close')!.onclick=()=>close(true);
 document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);close();
 return {select,dispose(){viewport?.removeEventListener('resize',resize);viewport?.removeEventListener('scroll',resize);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);}};
}
