import type {createLab} from '../scene/lab';
import type {bindWorkbench} from '../ui/workbench';
import {measure,close,titles,type Kind} from './lessons';
import {Motion} from './player';
import {Voice} from './voice';
import {icon,button} from './transport';

type Host<S>={
 lab:ReturnType<typeof createLab>;
 workbench:ReturnType<typeof bindWorkbench>;
 readonly scene:string;
 command(c:{field:'position'|'rotation'|'near';index?:number;value:number}):void;
 cube():Promise<void>;capture():S;restore(s:S):Promise<void>;
 setup(k:Kind):void;selectParent():void;projection(ortho:boolean):void;sync():void;
};
type Phase='ready'|'running'|'paused'|'practice'|'completed';

export function mountLearning<S>(host:Host<S>){
 const $=(id:string)=>document.getElementById(id)!;
 $('panel-dock').insertAdjacentHTML('beforeend',`<button id="learn-tab" aria-label="Learn" aria-expanded="false">${icon('learn')}<span>Learn</span></button>`);
 document.querySelector('#app')!.insertAdjacentHTML('beforeend',`<section id="learn-card" aria-label="Learning walkthrough" hidden>
  <div id="lesson-chooser"><strong>Learn through the scene</strong><p id="learn-context"></p>${Object.entries(titles).map(([id,title])=>`<button id="lesson-${id}">${title}</button>`).join('')}</div>
  <div id="lesson-player" hidden><strong id="learn-title"></strong><p id="learn-caption" aria-live="polite"></p><small id="voice-status" role="status">Captions only</small>
   <div class="learn-footer"><div class="learn-transport">${['back','play','next','replay','sound'].map(id=>`<button id="learn-${id}" type="button"></button>`).join('')}</div>
   <div class="learn-actions"><button id="learn-exit" type="button"></button><button id="learn-keep" type="button" hidden></button></div></div>
  </div></section>`);
 const motion=new Motion(host.lab.scheduleFrame,host.lab.cancelFrame);
 const voice=new Voice(text=>$('voice-status').textContent=text,render);
 let original:S|undefined,checkpoint:S|undefined,kind:Kind='perspective',beat=0,token=0;
 let active=false,internal=false,baseline=0,silhouette=0,phase:Phase='ready';
 let highlighted:HTMLElement|undefined;
 let continueSilently:(()=>void)|undefined;
 const last=()=>kind==='perspective'?4:3;
 const caption=(text:string)=>{$('learn-caption').textContent=text;};

 function render(){
  const play=$('learn-play') as HTMLButtonElement;
  if(voice.needsGesture)button(play,'play','Play audio');
  else if(phase==='running')button(play,'pause','Pause');
  else if(phase==='paused')button(play,'play','Replay beat');
  else if(phase==='practice')button(play,'keep','Finish');
  else button(play,'play',phase==='completed'?'Complete':'Play');
  play.disabled=phase==='completed';
  button($('learn-sound'),voice.enabled?'sound':'muted',voice.enabled?'Sound on':'Sound off');
  $('learn-sound').setAttribute('aria-pressed',String(voice.enabled));
  ($('learn-back') as HTMLButtonElement).disabled=beat===0;
  ($('learn-next') as HTMLButtonElement).disabled=phase==='completed';
 }
 function setPhase(value:Phase){phase=value;render();}
 button($('learn-back'),'back','Back');button($('learn-next'),'next','Next');
 button($('learn-replay'),'replay','Replay');button($('learn-exit'),'exit','Exit & restore');button($('learn-keep'),'keep','Keep result');render();

 function clear(){highlighted?.classList.toggle('guide-target',false);highlighted=undefined;}
 function highlight(id:string,panel:'object'|'camera'|'math'){
  clear();host.workbench.select(panel);const el=$(id);
  if(!el||el.hidden){pause('The required control is unavailable. Replay when it is available.');return false;}
  highlighted=el;el.classList.toggle('guide-target',true);el.scrollIntoView?.({block:'nearest',behavior:'instant'});return true;
 }
 function pause(text='Paused after your interaction. Play replays this beat from its checkpoint.'){
  if(!active)return;
  ++token;continueSilently=undefined;motion.cancel();voice.stop();setPhase('paused');caption(text);
 }
 function cancel(){++token;continueSilently=undefined;motion.cancel();voice.stop();clear();}
 function configure(){host.setup(kind);if(kind==='parent')host.selectParent();baseline=measure(host.lab).span;silhouette=measure(host.lab).silhouette;}
 function prepare(index:number){
  internal=true;configure();
  if(kind==='perspective'&&index>=2){host.projection(true);baseline=measure(host.lab).span;silhouette=measure(host.lab).silhouette;}
  if(kind==='perspective'&&index===4)host.command({field:'position',index:2,value:4});
  if(kind==='parent'&&index>=2)host.command({field:'rotation',index:1,value:90});
  if(kind==='clip'&&index>=2)host.command({field:'near',value:4.5});
  beat=index;checkpoint=host.capture();internal=false;
 }
 function evidence(){
  const m=measure(host.lab);
  if(kind==='parent')return {
   valid:close(m.local[0],2)&&close(m.local[1],0)&&close(m.local[2],0)&&close(m.world[0],0)&&close(m.world[2],-2),
   text:`Local (${m.local.map(x=>x.toFixed(2)).join(', ')}); world (${m.world.map(x=>x.toFixed(2)).join(', ')}). Parent rotation carries the child around the parent origin.`,
  };
  if(kind==='clip'){
   const min=Math.min(...m.depths),max=Math.max(...m.depths);
   return {valid:close(min,4)&&close(max,6)&&m.rejected===4,text:`Front depth ${min.toFixed(2)}, rear depth ${max.toFixed(2)}. ${m.rejected} vertices fail z ≥ −w. Intersecting triangles are clipped in homogeneous clip space before division; one rejected vertex does not discard the whole object.`};
  }
  const ratio=m.span/baseline;
  return {valid:close(ratio,beat>=2?1:2),text:`Center-plane magnification: ${ratio.toFixed(3)}×. Silhouette: ${(m.silhouette/silhouette).toFixed(3)}×. ${beat>=2?'Orthographic size stays constant.':'Perspective depth halves from 8 to 4. The silhouette differs because its vertices have different depths.'}`};
 }
 function applyEnd(t:number){
  if(kind==='parent')host.command({field:'rotation',index:1,value:90*t});
  else if(kind==='clip')host.command({field:'near',value:.1+4.4*t});
  else host.command({field:'position',index:2,value:4*t});
 }
 async function explain(text:string,id:number,narrate:boolean){
  caption(text);
  if(!narrate||!voice.enabled){setPhase('ready');return;}
  setPhase('running');await voice.speak(text,()=>{});
  if(id===token)setPhase('ready');
 }
 async function finish(id:number){
  if(id!==token)return;
  const result=evidence();
  if(!result.valid){pause('Verification failed — observed: '+result.text);return;}
  // Pause must remain available throughout the result narration too.
  await explain(result.text,id,true);
 }
 async function run(narrateInfo=false){
  cancel();const id=token;active=true;setPhase('running');internal=true;
  if(checkpoint!==undefined)await host.restore(checkpoint);
  internal=false;if(id!==token)return;
  $('learn-title').textContent=`${titles[kind]} · ${beat+1}/${last()+1}`;
  $('learn-keep').hidden=beat!==last();
  voice.setMediaControls(titles[kind],{
   play:()=>{
    if(voice.needsGesture)voice.playReady();
    else if(phase==='ready'||phase==='paused'){voice.unlock();void run(true);}
   },
   pause:()=>pause('Paused using your device audio controls. Play replays this beat.'),
   nexttrack:()=>{voice.unlock();next();},previoustrack:()=>{voice.unlock();back();},
  });
  if(beat===last()){
   setPhase('practice');highlight(kind==='clip'?'near-0':kind==='parent'?'rotation-1':'position-2',kind==='clip'?'camera':'object');
   caption(kind==='clip'?'Try lowering near to restore geometry. Finish when you are ready.':kind==='parent'?'Try 45°. Inspect the measured world position in Inspect → Object position. Finish when you are ready.':'Try depth and switch projection in Camera. Compare the pinned output. Finish when you are ready.');return;
  }
  if((kind==='parent'||kind==='clip')&&beat===2){
   highlight(kind==='parent'?'object-origin':'trace','math');const result=evidence();
   if(!result.valid){pause('Verification failed — observed: '+result.text);return;}
   await explain(result.text+(kind==='parent'?' Play lets you try 45°.':' Play lets you lower the near plane.'),id,narrateInfo);return;
  }
  const target=kind==='clip'?'near-0':kind==='parent'?(beat===0?'hierarchy':'rotation-1'):beat===2?'projection':'position-2';
  if(!highlight(target,kind==='clip'||beat===2?'camera':'object'))return;
  if(beat===0||kind==='perspective'&&beat===2){
   await explain(beat===2?'Now orthographic height 6. Play repeats the same depth movement.':`Arranged an identity cube and parent with a fixed output camera. ${kind==='parent'?'Child local position is (2, 0, 0).':kind==='clip'?'Camera is at (0, 0, 5); near begins at 0.1.':'Camera is at (0, 0, 8), FOV 50°, output 4:3.'} Press Play to see the change.`,id,narrateInfo);return;
  }
  caption(kind==='parent'?'Rotate parent Y from zero to ninety degrees.':kind==='clip'?'Move the near plane to 4.5. Watch the frustum and output.':'Move cube Z from zero to four. Watch depth in the scene and size in the output.');
  let motionDone:()=>void=()=>{};
  const moved=new Promise<void>(resolve=>motionDone=resolve);
  let started=false;
  const startMotion=()=>{
   if(id!==token||started)return;started=true;
   motion.run(applyEnd,()=>{continueSilently=undefined;motionDone();},window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false);
  };
  continueSilently=startMotion;
  const spoken=voice.speak($('learn-caption').textContent!,startMotion);
  void Promise.all([moved,spoken]).then(()=>finish(id));
 }
 function complete(){
  const m=measure(host.lab);
  caption(`Complete. Measured local (${m.local.map(x=>x.toFixed(2)).join(', ')}), world (${m.world.map(x=>x.toFixed(2)).join(', ')}), center-plane span ${m.span.toFixed(3)} NDC, ${m.rejected} near-rejected vertices. Keep result or Exit & restore.`);
  $('learn-keep').hidden=false;setPhase('completed');
 }
 function next(){
  if(phase==='completed')return;
  cancel();
  if(beat===last()){complete();return;}
  if(beat===1||kind==='perspective'&&beat===3){
   applyEnd(1);const result=evidence();if(!result.valid){pause('Verification failed — '+result.text);return;}
  }
  prepare(beat+1);void run();
 }
 function back(){if(beat===0)return;cancel();prepare(beat-1);void run();}
 function primary(){
  // Retrying generated media must happen inside this tap, before any await.
  if(voice.needsGesture){voice.playReady();return;}
  if(phase==='running'){pause('Paused. Play replays this beat from its checkpoint.');return;}
  voice.unlock();
  if(phase==='paused')void run(true);
  else if(phase!=='completed')next();
 }
 async function start(k:Kind){
  if(active)return;
  kind=k;original=host.capture();internal=true;await host.cube();internal=false;
  active=true;host.lab.setLearningLayout(true);$('lesson-chooser').hidden=true;$('lesson-player').hidden=false;prepare(0);await run();
 }
 $('learn-tab').onclick=()=>{
  if(active){$('learn-card').hidden=false;return;}
  $('learn-card').hidden=!$('learn-card').hidden;$('learn-tab').setAttribute('aria-expanded',String(!$('learn-card').hidden));
  $('learn-context').textContent=host.scene==='woodland'?'These exact demonstrations use Cube lab. Choose a lesson to switch; Exit restores Woodland and your selection.':'Choose a short demonstration. Exit restores your arrangement.';
 };
 (Object.keys(titles) as Kind[]).forEach(k=>$(`lesson-${k}`).onclick=()=>{voice.unlock();void start(k);});
 $('learn-play').onclick=primary;
 $('learn-replay').onclick=()=>{voice.unlock();void run(true);};
 $('learn-back').onclick=()=>{voice.unlock();back();};
 $('learn-next').onclick=()=>{voice.unlock();next();};
 $('learn-sound').onclick=()=>{
  const replay=phase==='running'&&!voice.enabled;
  if(replay)pause('Sound enabled. Replaying this beat with narration.');
  voice.mute();render();
  // A slow model/download must never trap a learner who chooses captions.
  if(!voice.enabled)continueSilently?.();
  else if(replay)void run();
 };
 async function exit(restore:boolean){
  cancel();voice.dispose();active=false;internal=true;
  if(restore&&original!==undefined)await host.restore(original);
  internal=false;host.lab.setLearningLayout(false);original=undefined;checkpoint=undefined;
  $('learn-card').hidden=true;$('lesson-player').hidden=true;$('lesson-chooser').hidden=false;$('learn-tab').setAttribute('aria-expanded','false');setPhase('ready');
 }
 $('learn-exit').onclick=()=>void exit(true);$('learn-keep').onclick=()=>void exit(false);
 function interaction(e:Event){
  const node=e.target as Node;
  if(!active){if(!$('learn-card').contains(node)&&!$('learn-tab').contains(node))$('learn-card').hidden=true;return;}
  if(internal||beat===last())return;
  if($('learn-card').contains(node)||$('learn-tab').contains(node))return;
  pause();
 }
 const visibility=()=>{if(document.hidden)pause('Paused while the page was hidden. Play replays this beat.');};
 const gesture=()=>{if(!internal&&beat!==last())pause();};
 const reposition=()=>highlighted?.scrollIntoView?.({block:'nearest',behavior:'instant'});
 document.addEventListener('pointerdown',interaction,true);document.addEventListener('input',interaction,true);
 document.addEventListener('change',interaction,true);document.addEventListener('keydown',interaction,true);document.addEventListener('visibilitychange',visibility);
 host.lab.orbit.addEventListener('start',gesture);host.lab.gizmo.addEventListener('mouseDown',gesture);
 window.addEventListener('resize',reposition);window.visualViewport?.addEventListener('resize',reposition);
 window.addEventListener('beforeunload',()=>{
  cancel();voice.dispose();document.removeEventListener('pointerdown',interaction,true);document.removeEventListener('input',interaction,true);
  document.removeEventListener('change',interaction,true);document.removeEventListener('keydown',interaction,true);document.removeEventListener('visibilitychange',visibility);
  host.lab.orbit.removeEventListener('start',gesture);host.lab.gizmo.removeEventListener('mouseDown',gesture);
  window.removeEventListener('resize',reposition);window.visualViewport?.removeEventListener('resize',reposition);
 });
 return {sceneSwitch(){if(!internal&&active)void exit(false);}};
}
