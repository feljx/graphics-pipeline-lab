/** A cancelable, demand-driven tween. No idle animation loop. */
export class Motion {
 constructor(private schedule:(fn:FrameRequestCallback)=>number=requestAnimationFrame,private unschedule:(id:number)=>void=cancelAnimationFrame){}
 private token=0;private frame=0;
 cancel(){++this.token;this.unschedule(this.frame);}
 run(apply:(t:number)=>void,done:()=>void,reduced=false){this.cancel();const token=this.token;let start:number|undefined;
 const tick=(now:number)=>{if(token!==this.token)return;start??=now;const t=reduced?1:Math.min(1,(now-start)/1800);apply(t);if(token!==this.token)return;if(t===1)done();else this.frame=this.schedule(tick);};this.frame=this.schedule(tick);
 }
}
