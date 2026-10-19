/* wav.js — slice an AudioBuffer to a 16-bit PCM WAV Blob */
(function(){
  function sliceToWav(buffer, startSec, endSec){
    var rate = buffer.sampleRate;
    var ch = buffer.numberOfChannels;
    var s0 = Math.max(0, Math.floor(startSec * rate));
    var s1 = Math.min(buffer.length, Math.floor(endSec * rate));
    var len = Math.max(1, s1 - s0);
    var chans = [];
    for (var c = 0; c < ch; c++) chans.push(buffer.getChannelData(c).subarray(s0, s1));

    var bytesPerSample = 2;
    var blockAlign = ch * bytesPerSample;
    var dataLen = len * blockAlign;
    var ab = new ArrayBuffer(44 + dataLen);
    var view = new DataView(ab);

    function str(off, s){ for (var i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); }
    str(0, 'RIFF');
    view.setUint32(4, 36 + dataLen, true);
    str(8, 'WAVE');
    str(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);          // PCM
    view.setUint16(22, ch, true);
    view.setUint32(24, rate, true);
    view.setUint32(28, rate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    str(36, 'data');
    view.setUint32(40, dataLen, true);

    var off = 44;
    for (var i = 0; i < len; i++){
      for (var c2 = 0; c2 < ch; c2++){
        var v = Math.max(-1, Math.min(1, chans[c2][i] || 0));
        view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
        off += 2;
      }
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  function download(blob, filename){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); a.remove(); }, 400);
  }

  window.LeepWav = { sliceToWav: sliceToWav, download: download };
})();
