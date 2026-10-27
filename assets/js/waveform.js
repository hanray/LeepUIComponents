/* waveform.js — Hybrid waveform: dense single-sided bars + glowing teal selection
   Base   = dense precise bars rising from a baseline (not reflected).
   Select = solid glowing teal bars (the sample "lights up") + rising sparks.
   Highlight = setHover({a,b,color}) tints a sampled region on demand (driven by
               HTML marker dots / remix cards, so the markers scale independently).
   Input  = LEFT click/drag scrubs (click plays). RIGHT-click drag selects.
            Touch: tap plays, drag scrubs, hold-then-drag (or Select mode) selects. */
(function(){
  var TEAL='#2BD4C0', TEAL_SOFT='rgba(43,212,192,0.55)', SELFILL='rgba(43,212,192,0.07)', SELEDGE='rgba(43,212,192,0.75)',
      PANEL='rgba(8,10,12,0.55)', PLAYED='rgba(240,239,233,0.6)', MUTE='rgba(240,239,233,0.2)',
      BASE_LN='rgba(240,239,233,0.2)', PH='#F4F2EC';

  function fmt(s){ if(!isFinite(s))s=0; var m=Math.floor(s/60), ss=Math.round(s%60); if(ss===60){ss=0;m++;} return m+':'+(ss<10?'0':'')+ss; }
  function clamp(v){ return Math.max(0,Math.min(1,v)); }
  function rgba(hex,a){ hex=hex.replace('#',''); var r=parseInt(hex.substr(0,2),16),g=parseInt(hex.substr(2,2),16),b=parseInt(hex.substr(4,2),16); return 'rgba('+r+','+g+','+b+','+a+')'; }

  function LeepWaveform(canvas, opts){
    this.c=canvas; this.peaks=opts.peaks||[]; this.BASE=this.peaks.length||1;
    this.getState=opts.getState; this.onScrub=opts.onScrub||function(){}; this.onSelect=opts.onSelect||function(){};
    this.onTap=opts.onTap||this.onScrub; this.getSelectMode=opts.getSelectMode||function(){return false;};
    this._hl=null;
    this.mini=!!opts.mini; this.bare=!!opts.bare; this.ctx=null;
    this._setup(); this._bind();
    var self=this;
    window.addEventListener('resize', function(){ clearTimeout(self._rt); self._rt=setTimeout(function(){ self._setup(); },120); });
    if(window.ResizeObserver){ this._ro=new ResizeObserver(function(){ self._setup(); }); this._ro.observe(canvas); }
    this._loop();
  }

  LeepWaveform.prototype.setHover=function(r){ this._hl=r; };   /* highlight a sampled region, or null */

  LeepWaveform.prototype.amp=function(f){
    if(f<0)f=0; if(f>1)f=1;
    var x=f*(this.BASE-1), i=Math.floor(x), t=x-i;
    var a=this.peaks[i], b=this.peaks[Math.min(this.BASE-1,i+1)];
    return a+(b-a)*t;
  };

  LeepWaveform.prototype._setup=function(){
    var c=this.c, r=c.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
    if(r.width<1) return;
    c.width=Math.round(r.width*dpr); c.height=Math.round(r.height*dpr);
    this.ctx=c.getContext('2d'); this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.W=r.width; this.H=r.height;
  };

  LeepWaveform.prototype._bind=function(){
    var self=this, c=this.c, dragging=false, sx=0, moved=false, mode='scrub', lp=null;
    c.addEventListener('contextmenu', function(e){ e.preventDefault(); });
    c.addEventListener('pointerdown', function(e){
      dragging=true; moved=false; sx=e.offsetX;
      try{ c.setPointerCapture(e.pointerId); }catch(_){}
      if(e.button===2 || self.getSelectMode()){ mode='select'; return; }
      mode='scrub';
      if(e.pointerType==='touch'){ lp=setTimeout(function(){ if(dragging && !moved){ mode='select'; } }, 420); }
      else { self.onScrub(clamp(e.offsetX/self.W)); }
    });
    c.addEventListener('pointermove', function(e){
      if(!dragging) return;
      if(Math.abs(e.offsetX-sx)>6){ moved=true; if(lp){ clearTimeout(lp); lp=null; } }
      if(mode==='scrub'){ if(moved) self.onScrub(clamp(e.offsetX/self.W)); }
      else if(moved){ var a=sx/self.W, b=e.offsetX/self.W; self.onSelect(Math.max(0,Math.min(a,b)), Math.min(1,Math.max(a,b))); }
    });
    c.addEventListener('pointerup', function(e){
      if(lp){ clearTimeout(lp); lp=null; }
      if(dragging && mode==='scrub'){ var fr=clamp(e.offsetX/self.W); if(moved) self.onScrub(fr); else self.onTap(fr); }
      dragging=false;
    });
    c.addEventListener('pointercancel', function(){ if(lp){ clearTimeout(lp); lp=null; } dragging=false; });
  };

  LeepWaveform.prototype._loop=function(){ var self=this; function step(ts){ self._draw(ts/1000); requestAnimationFrame(step); } requestAnimationFrame(step); };

  LeepWaveform.prototype._draw=function(t){
    if(!this.ctx){ this._setup(); if(!this.ctx) return; }
    var x=this.ctx, W=this.W, H=this.H;
    var st=this.getState()||{};
    var prog=st.duration?(st.progress||0):0;
    var hasSel=st.selA!=null && st.selB!=null && (st.selB-st.selA)>0.002;
    var s0f=hasSel?st.selA:0, s1f=hasSel?st.selB:0, s0=s0f*W, s1=s1f*W;
    var mini=this.mini, bare=this.bare;
    var baseY=(mini?0.84:0.82)*H, topPad=0.1*H, maxLen=baseY-topPad;
    var ts=3, tickW=mini?1.6:2;
    x.clearRect(0,0,W,H);

    if(!mini && !bare){
      x.strokeStyle='rgba(240,239,233,0.05)'; x.lineWidth=0.5;
      for(var g=0; g<=8; g++){ var gx=g/8*W; x.beginPath(); x.moveTo(gx,topPad); x.lineTo(gx,baseY); x.stroke(); }
    }
    x.strokeStyle=BASE_LN; x.lineWidth=1; x.beginPath(); x.moveTo(0,baseY); x.lineTo(W,baseY); x.stroke();

    for(var m=0;m<W;m+=ts){
      var cx=m+tickW/2, f=cx/W;
      if(hasSel && cx>=s0 && cx<=s1) continue;
      var a=this.amp(f), h=Math.max(0.8, a*maxLen);
      x.strokeStyle = f<=prog?PLAYED:MUTE; x.lineWidth=tickW;
      x.beginPath(); x.moveTo(cx,baseY); x.lineTo(cx,baseY-h); x.stroke();
    }

    /* sampled-region highlight (shown while a marker dot / remix card is hovered) */
    if(this._hl){ var r=this._hl, hx0=r.a*W, hx1=r.b*W;
      x.fillStyle=rgba(r.color,0.18); x.fillRect(hx0, 0, hx1-hx0, baseY);
      x.fillStyle=rgba(r.color,0.8); x.fillRect(hx0-0.5,0,1,baseY); x.fillRect(hx1-0.5,0,1,baseY);
    }

    if(hasSel){
      x.fillStyle=PANEL; x.fillRect(s0,0,s1-s0,baseY);
      x.fillStyle=SELFILL; x.fillRect(s0,0,s1-s0,baseY);
      x.save();
      if(!mini){ x.shadowColor=TEAL_SOFT; x.shadowBlur=6; }
      var breathe=0.9+0.1*Math.sin(t*1.6);
      for(var sm=s0; sm<s1; sm+=ts){
        var scx=sm+tickW/2, sf=scx/W, sa=this.amp(sf), sh=Math.max(1, sa*maxLen*breathe);
        x.strokeStyle=TEAL; x.lineWidth=tickW;
        x.beginPath(); x.moveTo(scx,baseY); x.lineTo(scx,baseY-sh); x.stroke();
      }
      x.restore();
      if(!mini){
        var SP=14;
        for(var k=0;k<SP;k++){
          var fx=s0 + ((k+0.5)/SP)*(s1-s0), fa=this.amp(fx/W), top=baseY - fa*maxLen;
          var ph=((t*0.42 + k*0.37) % 1), py=top - ph*maxLen*0.55 - 2, al=(1-ph)*0.7;
          x.globalAlpha=al; x.fillStyle=TEAL; x.beginPath(); x.arc(fx, py, 1.5, 0, 6.28); x.fill();
        }
        x.globalAlpha=1;
      }
      x.fillStyle=SELEDGE; x.fillRect(s0-0.5,0,1,baseY); x.fillRect(s1-0.5,0,1,baseY);
      var by=mini?5:7;
      x.strokeStyle=SELEDGE; x.lineWidth=1.2;
      x.beginPath(); x.moveTo(s0,by+5); x.lineTo(s0,by); x.lineTo(s1,by); x.lineTo(s1,by+5); x.stroke();
      if(!mini && !bare){
        x.fillStyle=TEAL; x.font='500 9px "Geist Mono",monospace'; x.textAlign='center'; x.textBaseline='bottom';
        x.fillText(fmt((s1f-s0f)*(st.duration||0)), (s0+s1)/2, by-2);
      }
    }

    var phx=prog*W;
    x.fillStyle=PH; x.fillRect(phx-0.5,0,1.1,baseY);
    x.beginPath(); x.arc(phx, 3, mini?2:2.6, 0, 6.28); x.fill();
  };

  window.LeepWaveform=LeepWaveform;
  window.LeepFmt=fmt;
})();
