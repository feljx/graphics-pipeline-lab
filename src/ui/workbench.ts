const views=['object','camera','pipeline','math','view'] as const;
type View=typeof views[number];
/** One set of panels and controls; CSS determines their placement at each size. */
export function bindWorkbench(layoutChanged:()=>void){
 const root=document.getElementById('app')!,body=document.getElementById('workbench-body')!;
 const toggle=document.getElementById('panel-toggle')!;
 const buttons=views.map(view=>document.getElementById(view==='view'?'settings':`${view}-tab`)!);
 const panels=views.map(view=>document.getElementById(`${view}-controls`)!);
 function expand(open:boolean){body.hidden=!open;root.classList.toggle('controls-hidden',!open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Hide controls':'Show controls');toggle.textContent=open?'⌄':'⌃';layoutChanged();}
 function select(view:View){views.forEach((v,i)=>{const active=v===view;panels[i].hidden=!active;buttons[i].classList.toggle('active',active);buttons[i].setAttribute('aria-selected',String(active));buttons[i].tabIndex=active?0:-1;});document.getElementById('vertex-panel')!.hidden=view==='pipeline'||view==='view';body.scrollTop=0;expand(true);}
 function keydown(event:KeyboardEvent){const index=buttons.indexOf(event.target as HTMLElement);if(index<0)return;const next=event.key==='ArrowRight'?(index+1)%views.length:event.key==='ArrowLeft'?(index+views.length-1)%views.length:event.key==='Home'?0:event.key==='End'?views.length-1:-1;if(next<0)return;event.preventDefault();select(views[next]);buttons[next].focus();}
 buttons.forEach((button,i)=>button.onclick=()=>select(views[i]));toggle.onclick=()=>expand(body.hidden);
 root.addEventListener('keydown',keydown);select('object');
 return {select,dispose(){root.removeEventListener('keydown',keydown);}};
}
