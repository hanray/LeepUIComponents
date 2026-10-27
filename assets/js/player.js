/* player.js — Leep audio controller
   One audio element + state persisted to localStorage so the mini-player
   on another page resumes where the full page left off.
   Audio is loaded into an in-memory blob URL so seeking works everywhere
   (local static servers often lack HTTP Range support). */
window.LeepPlayer = (function(){
  var LS = 'leep.player.v1';
  var SRC = './assets/audio/track.mp3';
  var fallbackDur = (window.LEEP_PEAKS && window.LEEP_PEAKS.dur) || 203;

  var state = { time:0, duration:fallbackDur, playing:false, volume:0.8,
                selA:null, selB:null, liked:false, following:false, savedSamples:0 };
  var audio=null, buffer=null, audioCtx=null, decoding=null;
  var listeners=[], tick=0, previewEnd=null, pendingSeek=null, blobReady=false;

  function load(){ try{ var s=JSON.parse(localStorage.getItem(LS)); if(s){ Object.assign(state,s); state.playing=!!s.playing; state.savedSamples=s.savedSamples||0; } }catch(e){} }
  function save(){ try{ localStorage.setItem(LS, JSON.stringify({ time:state.time, playing:state.playing, volume:state.volume, selA:state.selA, selB:state.selB, liked:state.liked, following:state.following, savedSamples:state.savedSamples })); }catch(e){} }
  function emit(){ for(var i=0;i<listeners.length;i++) listeners[i](state); }
  function on(fn){ listeners.push(fn); fn(state); }
  function toast(msg){ document.dispatchEvent(new CustomEvent('leep:toast',{detail:msg})); }

  function applyPending(){ if(pendingSeek!=null && audio && isFinite(audio.duration)){ try{ audio.currentTime=pendingSeek; }catch(e){} pendingSeek=null; } }

  function ensureAudio(){
    if(audio) return audio;
    audio = new Audio();
    audio.preload='auto'; audio.volume = state.volume;
    audio.addEventListener('loadedmetadata', function(){
      state.duration = audio.duration || fallbackDur;
      if(pendingSeek!=null){ applyPending(); }
      else if(state.time>0 && state.time < state.duration){ try{ audio.currentTime = state.time; }catch(e){} }
      emit();
    });
    audio.addEventListener('canplay', applyPending);
    audio.addEventListener('timeupdate', function(){
      if(pendingSeek!=null) return;
      state.time = audio.currentTime;
      if(audio.duration) state.duration = audio.duration;
      if(previewEnd!=null && audio.currentTime >= previewEnd){ audio.pause(); previewEnd=null; }
      if((++tick % 12)===0) save();
      emit();
    });
    audio.addEventListener('play', function(){ state.playing=true; save(); emit(); });
    audio.addEventListener('pause', function(){ state.playing=false; save(); emit(); });
    audio.addEventListener('ended', function(){ state.playing=false; state.time=0; previewEnd=null; save(); emit(); });
    audio.src = SRC;                     /* immediate playback source */
    /* upgrade to a fully-seekable in-memory blob */
    fetch(SRC).then(function(r){ return r.blob(); }).then(function(b){
      var at = state.time, wasPlaying = !audio.paused;
      audio.src = URL.createObjectURL(b);
      var onReady = function(){ try{ audio.currentTime = at; }catch(e){} if(wasPlaying){ var p=audio.play(); if(p&&p.catch) p.catch(function(){}); } audio.removeEventListener('loadedmetadata', onReady); };
      audio.addEventListener('loadedmetadata', onReady);
      audio.load(); blobReady=true;
    }).catch(function(){});
    return audio;
  }

  function play(){ previewEnd=null; ensureAudio(); var p=audio.play(); if(p&&p.catch) p.catch(function(){ state.playing=false; emit(); }); }
  function pause(){ ensureAudio(); audio.pause(); }
  function toggle(){ (state.playing? pause: play)(); }

  function seek(frac){
    ensureAudio(); previewEnd=null;
    var d = state.duration || fallbackDur;
    var tt = frac*d; state.time = tt;
    if(audio.readyState>=1 && isFinite(audio.duration)){ try{ audio.currentTime = tt; }catch(e){} pendingSeek=null; }
    else { pendingSeek = tt; }
    save(); emit();
  }
  function setVolume(v){ state.volume=Math.max(0,Math.min(1,v)); if(audio) audio.volume=state.volume; save(); emit(); }
  function setSelection(a,b){ state.selA=a; state.selB=b; save(); emit(); }
  function clearSelection(){ state.selA=null; state.selB=null; save(); emit(); }
  function toggleLike(){ state.liked=!state.liked; save(); emit(); return state.liked; }
  function toggleFollow(){ state.following=!state.following; save(); emit(); return state.following; }

  function saveSample(){
    if(state.selA==null || state.selB==null){ toast('Select a region first'); return; }
    state.savedSamples = (state.savedSamples||0) + 1;
    save(); emit(); toast('Saved to your samples');
  }

  function shareTrack(){
    var data={ title:'House Baby \u2014 Grugz', text:'House Baby by Grugz on Leep', url:location.href };
    if(navigator.share){ navigator.share(data).catch(function(){}); }
    else if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(data.url).then(function(){ toast('Link copied'); }).catch(function(){ toast('Copy failed'); }); }
    else { toast('Share this track'); }
  }

  function previewSelection(){
    if(state.selA==null || state.selB==null) return;
    ensureAudio();
    var d = state.duration || fallbackDur;
    if(audio.readyState>=1){ try{ audio.currentTime = state.selA*d; }catch(e){} } else { pendingSeek = state.selA*d; }
    previewEnd = state.selB*d;
    var p=audio.play(); if(p&&p.catch) p.catch(function(){});
    toast('Previewing selection');
  }

  function decode(){
    if(buffer) return Promise.resolve(buffer);
    if(decoding) return decoding;
    audioCtx = audioCtx || new (window.AudioContext||window.webkitAudioContext)();
    decoding = fetch(SRC).then(function(r){ return r.arrayBuffer(); })
      .then(function(ab){ return audioCtx.decodeAudioData(ab); })
      .then(function(buf){ buffer=buf; return buf; });
    return decoding;
  }

  function downloadSample(){
    if(state.selA==null || state.selB==null){ toast('Select a region first'); return; }
    toast('Rendering sample\u2026');
    decode().then(function(buf){
      var d = buf.duration;
      var blob = window.LeepWav.sliceToWav(buf, state.selA*d, state.selB*d);
      var name = 'house-baby_' + window.LeepFmt(state.selA*d).replace(':','m') + '-' + window.LeepFmt(state.selB*d).replace(':','m') + '.wav';
      window.LeepWav.download(blob, name);
      toast('Sample downloaded');
    }).catch(function(){ toast('Could not render sample'); });
  }

  function getState(){
    var d = state.duration || fallbackDur;
    return { progress: d? state.time/d : 0, selA:state.selA, selB:state.selB, duration:d, playing:state.playing };
  }

  function resume(){
    ensureAudio();
    if(state.playing){ var p=audio.play(); if(p&&p.catch) p.catch(function(){ state.playing=false; emit(); }); }
  }

  load();
  ensureAudio();   /* start loading the blob immediately so seeking is ready on first click */

  return { state:state, on:on, play:play, pause:pause, toggle:toggle, seek:seek,
           setVolume:setVolume, setSelection:setSelection, clearSelection:clearSelection,
           toggleLike:toggleLike, toggleFollow:toggleFollow, saveSample:saveSample, shareTrack:shareTrack, previewSelection:previewSelection,
           downloadSample:downloadSample, getState:getState, resume:resume, save:save };
})();

