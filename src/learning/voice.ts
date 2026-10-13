export class Voice {
 enabled=false;private worker?:Worker;private audio?:HTMLAudioElement;private url?:string;private busy=false;private id=0;private timer?:ReturnType<typeof setTimeout>;private finish?:()=>void;
 constructor(private status:(text:string)=>void){}
 stop(){++this.id;if(this.busy){this.worker?.terminate();this.worker=undefined;this.busy=false;}clearTimeout(this.timer);this.audio?.pause();this.audio=undefined;if(this.url)URL.revokeObjectURL(this.url);this.url=undefined;this.finish?.();this.finish=undefined;}
 mute(){this.enabled=!this.enabled;this.stop();this.status(this.enabled?'Local voice: initial download ≈92 MB + runtime. Text stays on-device.':'Captions only');}
 speak(text:string,start:()=>void):Promise<void>{this.stop();if(!this.enabled){start();return Promise.resolve();}const id=this.id;
 return new Promise(resolve=>{this.finish=resolve;let started=false;const begin=()=>{if(id!==this.id||started)return;started=true;start();};const end=()=>{if(id!==this.id)return;begin();this.stop();};
 this.timer=setTimeout(()=>{this.status('Voice timed out. Continue with captions.');this.worker?.terminate();this.worker=undefined;end();},90000);
 try{this.worker??=new Worker(new URL('./speech.worker.ts',import.meta.url),{type:'module'});this.status('Downloading/loading local voice ≈92 MB + runtime…');this.worker.onmessage=e=>{if(id!==this.id||e.data.id!==id)return;if(e.data.status)this.status(e.data.status);if(e.data.error){this.status('Local voice unavailable. Captions remain available.');end();}if(e.data.blob){this.status('Local voice ready · on-device');this.busy=false;this.url=URL.createObjectURL(e.data.blob);this.audio=new Audio(this.url);this.audio.onplaying=begin;this.audio.onended=end;this.audio.onerror=end;this.audio.play().catch(()=>{this.status('Audio playback unavailable. Continue with captions.');end();});}};this.worker.onerror=()=>{this.status('Local voice unavailable. Continue with captions.');end();};this.busy=true;this.worker.postMessage({id,text});}catch{this.status('Local voice unavailable. Continue with captions.');end();}
 });}
 dispose(){this.stop();this.worker?.terminate();}
}
