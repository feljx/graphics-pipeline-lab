// A short, local silent WAV primes the same media element during the user's tap.
// Reusing that element matters on Safari; generated audio arrives much later.
const SILENCE='data:audio/wav;base64,UklGRsQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
type MediaControls={play:()=>void;pause:()=>void;nexttrack:()=>void;previoustrack:()=>void};

export class Voice {
 enabled=false;
 needsGesture=false;
 private worker?:Worker;
 private audio?:HTMLAudioElement;
 private url?:string;
 private busy=false;
 private id=0;
 private timer?:ReturnType<typeof setTimeout>;
 private finish?:()=>void;
 private ready?:()=>void;
 private unlocked=false;
 private priming=false;
 private controls?:MediaControls;

 constructor(private status:(text:string)=>void,private changed:()=>void=()=>{}){}

 private mediaState(state:MediaSessionPlaybackState){
  try{if(typeof navigator!=='undefined'&&navigator.mediaSession)navigator.mediaSession.playbackState=state;}catch{/* Optional OS integration. */}
 }

 setMediaControls(title:string,controls:MediaControls){
  this.controls=controls;
  if(typeof navigator==='undefined'||!navigator.mediaSession)return;
  if(typeof MediaMetadata!=='undefined')navigator.mediaSession.metadata=new MediaMetadata({title,artist:'Graphics Pipeline Lab',album:'Learn'});
  for(const action of ['play','pause','nexttrack','previoustrack'] as const){
   try{navigator.mediaSession.setActionHandler(action,controls[action]);}catch{/* Some browsers support only play/pause. */}
  }
 }

 private element(){
  if(!this.audio){this.audio=new Audio(SILENCE);this.audio.preload='auto';this.audio.setAttribute('playsinline','');}
  return this.audio;
 }

 /** Call synchronously in click handlers, before any restore/synthesis awaits. */
 unlock(){
  if(!this.enabled||this.ready||this.unlocked||this.priming)return;
  try{
   const audio=this.element();this.priming=true;audio.src=SILENCE;
   void audio.play().then(()=>{
    if(audio!==this.audio)return;
    this.unlocked=true;this.priming=false;
    if(audio.src===SILENCE)audio.pause();
   }).catch(()=>{if(audio===this.audio){this.priming=false;this.unlocked=false;}});
  }catch{this.priming=false;/* Generated audio will offer an explicit tap. */}
 }

 /** Retry already-generated audio from a tap, without reloading or resynthesizing. */
 playReady(){this.ready?.();}

 stop(){
  ++this.id;
  if(this.busy){this.worker?.terminate();this.worker=undefined;this.busy=false;}
  clearTimeout(this.timer);this.timer=undefined;
  this.ready=undefined;this.needsGesture=false;
  if(this.audio){
   this.audio.onplaying=null;this.audio.onended=null;this.audio.onerror=null;this.audio.onpause=null;
   if(!this.priming||this.url||!this.enabled)this.audio.pause();
   if(this.url)this.audio.src=SILENCE;
  }
  if(this.url)URL.revokeObjectURL(this.url);
  this.url=undefined;
  const finish=this.finish;this.finish=undefined;finish?.();
  this.mediaState('paused');this.changed();
 }

 mute(){
  this.enabled=!this.enabled;this.stop();
  if(this.enabled)this.unlock();
  this.status(this.enabled?'Local voice enabled. First use downloads ≈92 MB + runtime; captions work while it prepares.':'Captions only');
 }

 speak(text:string,start:()=>void):Promise<void>{
  this.stop();
  if(!this.enabled){start();return Promise.resolve();}
  const id=this.id;
  return new Promise(resolve=>{
   this.finish=resolve;
   let started=false;
   const begin=()=>{if(id!==this.id||started)return;started=true;start();};
   const end=()=>{if(id!==this.id)return;begin();this.stop();};
   const fail=(message:string)=>{if(id!==this.id)return;this.enabled=false;this.status(message);end();};
   this.timer=setTimeout(()=>fail('Voice took too long. Continuing with captions; you can retry Sound later.'),90000);
   try{
    this.worker??=new Worker(new URL('./speech.worker.ts',import.meta.url),{type:'module'});
    this.status('Preparing local voice: first download ≈92 MB + runtime. Sound off continues with captions.');
    this.worker.onmessage=e=>{
     if(id!==this.id||e.data.id!==id)return;
     if(e.data.status)this.status(e.data.status);
     if(e.data.error){fail(`Local voice failed: ${String(e.data.error).slice(0,160)}. Continuing with captions; turn Sound on to retry.`);return;}
     if(!e.data.blob)return;
     this.busy=false;clearTimeout(this.timer);
     try{
      const audio=this.element();this.url=URL.createObjectURL(e.data.blob);audio.src=this.url;
      audio.onplaying=()=>{
       if(id!==this.id)return;
       this.unlocked=true;this.needsGesture=false;this.ready=undefined;
       this.status('Speaking on this device');this.mediaState('playing');this.changed();begin();
      };
      audio.onended=()=>{if(id!==this.id)return;this.status('Local voice ready');end();};
      audio.onerror=()=>fail('Audio could not be played. Continuing with captions.');
      audio.onpause=()=>{if(id===this.id&&started&&!audio.ended)this.controls?.pause();};
      const play=()=>{
       if(id!==this.id)return;
       void audio.play().catch((error:unknown)=>{
        if(id!==this.id)return;
        if(error!==null&&typeof error==='object'&&'name' in error&&error.name==='NotAllowedError'){
         this.needsGesture=true;this.ready=play;this.mediaState('paused');
         this.status('Voice is ready. Tap Play audio to allow sound on this phone, or switch Sound off.');this.changed();
        }else fail('Audio playback unavailable. Continuing with captions.');
       });
      };
      // Bound both a missing playing/ended event and a blocked autoplay prompt.
      this.timer=setTimeout(()=>fail('Audio did not start or finish. Continuing with captions.'),60000);
      this.ready=play;play();
     }catch{fail('Audio unavailable. Continuing with captions.');}
    };
    this.worker.onerror=event=>fail(`Local voice unavailable${event?.message?': '+event.message.slice(0,160):''}. Continuing with captions; turn Sound on to retry.`);
    this.busy=true;this.worker.postMessage({id,text});
   }catch{fail('Local voice unavailable. Continuing with captions.');}
  });
 }

 dispose(){
  this.stop();this.worker?.terminate();this.worker=undefined;
  if(this.audio){this.audio.removeAttribute('src');this.audio.load();this.audio=undefined;}
  this.unlocked=false;this.priming=false;this.controls=undefined;
  if(typeof navigator!=='undefined'&&navigator.mediaSession){
   for(const action of ['play','pause','nexttrack','previoustrack'] as const){try{navigator.mediaSession.setActionHandler(action,null);}catch{/* Optional. */}}
   navigator.mediaSession.metadata=null;this.mediaState('none');
  }
 }
}
