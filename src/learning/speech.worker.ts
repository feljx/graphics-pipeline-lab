import {KokoroTTS} from 'kokoro-js';
import {env} from '@huggingface/transformers';
// Single-thread WASM works on Pages without COOP/COEP headers.
env.backends.onnx.wasm!.numThreads=1;
env.backends.onnx.wasm!.proxy=false;
let model:Promise<KokoroTTS>|undefined;
self.onmessage=async(e:MessageEvent<{id:number;text:string}>)=>{const {id,text}=e.data;try{
 model??=KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX',{dtype:'q8',device:'wasm',progress_callback:p=>self.postMessage({id,status:'Loading local voice: '+('progress' in p?Math.round(p.progress)+'%':p.status)})});
 const tts=await model;self.postMessage({id,status:'Generating speech on this device…'});const audio=await tts.generate(text,{voice:'af_heart'});self.postMessage({id,blob:audio.toBlob()});
 }catch(error){model=undefined;self.postMessage({id,error:String(error)});}};
