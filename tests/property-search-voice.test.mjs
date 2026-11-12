import test from 'node:test';
import assert from 'node:assert/strict';
import {setupVoice} from '../src/voice.js';
test('找房语音使用独立控件，识别结果交给找房查询且停止时取消聆听',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,{value:'',checked:false,hidden:false,classList:{add(){},remove(){}},setAttribute(){}});return nodes.get(id);};
 let recognition,aborted=false,transcript='',spoken=[];
 globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
 globalThis.document={getElementById:get};globalThis.window={speechSynthesis:{getVoices(){return[];},cancel(){},speak(u){spoken.push(u);}},SpeechRecognition:class{constructor(){recognition=this;}start(){this.onstart();}stop(){this.onend();}abort(){aborted=true;}}};
 try{const voice=setupVoice({onTranscript:t=>transcript=t,ids:{'voice-question':'ps-voice','voice-status':'ps-voice-status','voice-read':'ps-read','xiaozhi-input':'ps-input','xiaozhi-chat':'property-search'}});
 get('ps-voice').onclick();assert.ok(recognition,'找房话筒应绑定独立识别器');
 recognition.onresult({results:[{0:{transcript:'500到800平方米研发空间'},isFinal:true}]});assert.equal(transcript,'500到800平方米研发空间');assert.equal(get('ps-input').value,transcript);voice.answer('找到两个空间');assert.equal(spoken[0].text,'找到两个空间');assert.equal(spoken[0].rate,.94);voice.stop();assert.ok(aborted);
 }finally{delete globalThis.window;delete globalThis.document;delete globalThis.SpeechSynthesisUtterance;}
});
