import {it,expect,vi,afterEach} from 'vitest';
import {Motion} from '../src/learning/player';
import {Voice} from '../src/learning/voice';
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it('canceled and stale frame callbacks cannot apply mutations',()=>{let callback:FrameRequestCallback=()=>{};const mutate=vi.fn(),done=vi.fn();const motion=new Motion(fn=>{callback=fn;return 1;},vi.fn());motion.run(mutate,done);const stale=callback;motion.cancel();stale(100);expect(mutate).not.toHaveBeenCalled();motion.run(mutate,done);callback(0);callback(1800);expect(done).toHaveBeenCalledOnce();});
it('muted speech preserves caption motion without loading a worker',async()=>{const worker=vi.fn();vi.stubGlobal('Worker',worker);const voice=new Voice(vi.fn()),start=vi.fn();await voice.speak('caption',start);expect(start).toHaveBeenCalledOnce();expect(worker).not.toHaveBeenCalled();voice.dispose();});
it('worker failure and bounded timeout preserve caption playback',async()=>{vi.useFakeTimers();let worker:{onmessage?:(e:{data:unknown})=>void;onerror?:()=>void;postMessage:ReturnType<typeof vi.fn>;terminate:ReturnType<typeof vi.fn>};vi.stubGlobal('Worker',class {onmessage?:typeof worker.onmessage;onerror?:()=>void;postMessage=vi.fn();terminate=vi.fn();constructor(){worker=this;}});const status=vi.fn(),voice=new Voice(status),start=vi.fn();voice.mute();const first=voice.speak('caption',start);worker!.onerror!();await first;expect(start).toHaveBeenCalledOnce();expect(voice.enabled).toBe(false);voice.mute();const second=voice.speak('caption two',start);await vi.advanceTimersByTimeAsync(90000);await second;expect(start).toHaveBeenCalledTimes(2);expect(worker!.terminate).toHaveBeenCalledOnce();voice.dispose();});
it('mute invalidates stale generated audio without starting motion',async()=>{let receive:(e:{data:unknown})=>void=()=>{};vi.stubGlobal('Worker',class {set onmessage(fn:typeof receive){receive=fn;}postMessage(){}terminate(){}});const voice=new Voice(vi.fn()),start=vi.fn();voice.mute();const pending=voice.speak('measured caption',start);voice.mute();receive({data:{id:1,blob:new Blob()}});await pending;expect(start).not.toHaveBeenCalled();voice.dispose();});
it('motion begins on actual audio playing, and stale audio events cannot restart it',async()=>{
 let receive:(e:{data:unknown})=>void=()=>{};let message:{id:number};vi.stubGlobal('Worker',class {set onmessage(fn:typeof receive){receive=fn;}postMessage(value:typeof message){message=value;}terminate(){}});
 let audio:{onplaying?:()=>void;onended?:()=>void;pause:ReturnType<typeof vi.fn>};vi.stubGlobal('Audio',class {onplaying?:()=>void;onended?:()=>void;pause=vi.fn();play=vi.fn().mockResolvedValue(undefined);setAttribute(){}removeAttribute(){}load(){}constructor(){audio=this;}});
 const create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:lesson'),revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});try{const voice=new Voice(vi.fn()),start=vi.fn();voice.mute();const pending=voice.speak('measured values',start);receive({data:{id:message!.id,blob:new Blob()}});expect(start).not.toHaveBeenCalled();audio!.onplaying!();expect(start).toHaveBeenCalledOnce();const stale=audio!.onplaying!;voice.stop();await pending;stale();expect(start).toHaveBeenCalledOnce();expect(revoke).toHaveBeenCalledWith('blob:lesson');voice.dispose();}finally{create.mockRestore();revoke.mockRestore();}
});

function mediaMocks(){
 let receive:(e:{data:unknown})=>void=()=>{};
 let message:{id:number};
 const post=vi.fn((value:{id:number})=>{message=value;});
 vi.stubGlobal('Worker',class {set onmessage(fn:typeof receive){receive=fn;}postMessage=post;terminate=vi.fn();});
 class AudioMock {
  src='';preload='';ended=false;onplaying:(()=>void)|null=null;onended:(()=>void)|null=null;onpause:(()=>void)|null=null;
  play=vi.fn().mockResolvedValue(undefined);pause=vi.fn();setAttribute=vi.fn();removeAttribute=vi.fn();load=vi.fn();
 }
 const elements:AudioMock[]=[];
 vi.stubGlobal('Audio',class extends AudioMock{constructor(src:string){super();this.src=src;elements.push(this);}});
 const create=vi.spyOn(URL,'createObjectURL').mockReturnValue('blob:generated'),revoke=vi.spyOn(URL,'revokeObjectURL').mockImplementation(()=>{});
 return {elements,post,generated(){receive({data:{id:message!.id,blob:new Blob()}});},restore(){create.mockRestore();revoke.mockRestore();}};
}

it('unlocks during the tap and reuses the same media element for consecutive cues',async()=>{
 const mock=mediaMocks();try{
  const voice=new Voice(vi.fn()),start=vi.fn();voice.mute();
  expect(mock.elements).toHaveLength(1);expect(mock.elements[0].play).toHaveBeenCalledOnce();
  expect(mock.elements[0].src).toMatch(/^data:audio\/wav/);await Promise.resolve();
  const first=voice.speak('first cue',start);mock.generated();expect(mock.elements).toHaveLength(1);
  const audio=mock.elements[0];expect(start).not.toHaveBeenCalled();audio.onplaying!();audio.onended!();await first;
  const second=voice.speak('second cue',start);mock.generated();expect(mock.elements).toHaveLength(1);audio.onplaying!();audio.onended!();await second;
  expect(start).toHaveBeenCalledTimes(2);voice.dispose();
 }finally{mock.restore();}
});
it('blocked mobile autoplay retains generated speech and retries directly from a tap',async()=>{
 const mock=mediaMocks();try{
  const status=vi.fn(),voice=new Voice(status),start=vi.fn();voice.mute();await Promise.resolve();
  const audio=mock.elements[0];audio.play.mockRejectedValueOnce({name:'NotAllowedError',message:'Tap required'});
  const pending=voice.speak('measured cue',start);mock.generated();await Promise.resolve();
  expect(voice.needsGesture).toBe(true);expect(start).not.toHaveBeenCalled();expect(status).toHaveBeenLastCalledWith(expect.stringContaining('Tap Play audio'));
  const count=audio.play.mock.calls.length;voice.playReady();expect(audio.play).toHaveBeenCalledTimes(count+1);expect(mock.post).toHaveBeenCalledOnce();
  audio.onplaying!();expect(start).toHaveBeenCalledOnce();expect(voice.needsGesture).toBe(false);audio.onended!();await pending;voice.dispose();
 }finally{mock.restore();}
});
it('a missing media playback event is bounded and falls back to captions',async()=>{
 vi.useFakeTimers();const mock=mediaMocks();try{
  const voice=new Voice(vi.fn()),start=vi.fn();voice.mute();await Promise.resolve();const pending=voice.speak('cue',start);mock.generated();
  await vi.advanceTimersByTimeAsync(60000);await pending;expect(start).toHaveBeenCalledOnce();expect(voice.needsGesture).toBe(false);voice.dispose();
 }finally{mock.restore();}
});
it('registers supported phone media actions, reflects playback and clears them on exit',async()=>{
 const mock=mediaMocks(),handlers=new Map<string,(()=>void)|null>();
 const session={playbackState:'none',metadata:null,setActionHandler:vi.fn((name:string,handler:(()=>void)|null)=>{handlers.set(name,handler);})};
 vi.stubGlobal('navigator',{mediaSession:session});vi.stubGlobal('MediaMetadata',class{constructor(public data:unknown){}});
 try{
  const controls={play:vi.fn(),pause:vi.fn(),nexttrack:vi.fn(),previoustrack:vi.fn()},voice=new Voice(vi.fn());
  voice.setMediaControls('Perspective',controls);expect(session.metadata).not.toBeNull();handlers.get('play')!();expect(controls.play).toHaveBeenCalledOnce();
  voice.mute();await Promise.resolve();const pending=voice.speak('cue',vi.fn());mock.generated();const audio=mock.elements[0];audio.onplaying!();expect(session.playbackState).toBe('playing');
  audio.onpause!();expect(controls.pause).toHaveBeenCalledOnce();voice.stop();await pending;expect(session.playbackState).toBe('paused');
  voice.dispose();expect(session.playbackState).toBe('none');expect(session.metadata).toBeNull();expect([...handlers.values()]).toEqual([null,null,null,null]);
 }finally{mock.restore();}
});
