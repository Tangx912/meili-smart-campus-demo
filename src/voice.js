export function setupVoice({onTranscript,ids={}}){
 const $=id=>document.getElementById(ids[id]||id),button=$('voice-question'),status=$('voice-status'),read=$('voice-read'),Recognition=window.SpeechRecognition||window.webkitSpeechRecognition,synth=window.speechSynthesis;let recognition=null,listening=false;
 function say(text){if(!synth){status.textContent='当前浏览器不支持语音播报。';return;}synth.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='zh-CN';utterance.rate=.94;utterance.pitch=1.02;const voices=synth.getVoices().filter(v=>/^zh(-|_)/i.test(v.lang));const voice=voices.find(v=>/natural|neural|xiaoxiao|xiaoyi|enhanced|premium/i.test(v.name))||voices.find(v=>/zh-CN/i.test(v.lang))||voices[0];if(voice)utterance.voice=voice;utterance.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))status.textContent='播报未能开始，可继续阅读文字回答。';};synth.speak(utterance);}
 function reset(){listening=false;button.classList.remove('listening');button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','语音提问');button.title='语音提问';}
 function stop(){recognition?.abort();recognition=null;reset();synth?.cancel();}
 button.onclick=()=>{if(listening){recognition?.stop();return;}if(!Recognition){status.textContent='当前浏览器不支持语音识别，请使用文字提问；可尝试Chrome或Edge。';return;}synth?.cancel();let submitted=false,failed=false;recognition=new Recognition();recognition.lang='zh-CN';recognition.interimResults=true;recognition.continuous=false;
  recognition.onstart=()=>{listening=true;button.classList.add('listening');button.setAttribute('aria-pressed','true');button.setAttribute('aria-label','结束聆听');button.title='结束聆听';status.textContent='正在聆听，请说出园区相关问题…';};
  recognition.onresult=e=>{let final='',interim='';for(let i=0;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript;else interim+=e.results[i][0].transcript;}const text=(final||interim).trim();$('xiaozhi-input').value=text;status.textContent=text?`识别：${text}`:'正在聆听…';if(final.trim()&&!submitted){submitted=true;recognition.stop();read.checked=true;status.textContent='识别完成，正在查询…';onTranscript(final.trim());}};
  recognition.onerror=e=>{failed=true;const messages={'not-allowed':'未获得麦克风授权。可在浏览器站点设置中允许，或继续文字提问。','service-not-allowed':'浏览器语音服务不可用，请继续文字提问。','audio-capture':'未检测到可用麦克风。','no-speech':'没有听清，请再试一次。',network:'浏览器语音识别网络不可用，请继续文字提问。',aborted:'语音已停止。'};status.textContent=messages[e.error]||'语音识别暂不可用，请继续文字提问。';reset();};
  recognition.onend=()=>{reset();if(!failed&&!submitted)status.textContent='聆听结束，可再次点击语音提问。';};
  try{recognition.start();}catch{reset();status.textContent='语音未能启动，请重试或使用文字提问。';}
 };
 read.onchange=()=>{if(!read.checked)synth?.cancel();};
 if(!synth){read.disabled=true;}status.textContent=Recognition?'点击语音提问，首次需允许麦克风；识别可能依赖网络。':'当前浏览器不支持语音识别，可文字提问并尝试播报。';
 return {answer(text){if(read.checked&&!$('xiaozhi-chat').hidden)say(text.replace(/\n+/g,'。'));},stop};
}
