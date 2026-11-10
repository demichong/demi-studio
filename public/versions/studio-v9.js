(()=>{'use strict';
const body=document.body,record=document.querySelector('#record'),disc=document.querySelector('#flipper'),status=document.querySelector('#status'),arm=document.querySelector('.tonearm'),motion=document.querySelector('#motion');
const pref=matchMedia('(prefers-reduced-motion: reduce)');let reduced=pref.matches,paused=false,busy=false,side='a',angle=0,velocity=0,drag=null,suppressClick=false,lastFrame=0,visible=true;
const announce=text=>status.textContent=text;
function updateMotion(){motion.textContent=paused?'Resume rotation':'Pause rotation';motion.setAttribute('aria-pressed',String(paused));}
motion.addEventListener('click',()=>{paused=!paused;velocity=0;updateMotion()});
pref.addEventListener('change',e=>{reduced=e.matches;velocity=0});
function apply(next){side=next;body.classList.toggle('side-b',side==='b');document.querySelectorAll('.key[data-flip]').forEach(k=>k.setAttribute('aria-pressed',String(k.dataset.flip===side)));record.setAttribute('aria-label',`Side ${side.toUpperCase()}. Click to flip, or drag to spin.`);record.querySelector('.face-a').setAttribute('aria-hidden',String(side!=='a'));record.querySelector('.face-b').setAttribute('aria-hidden',String(side!=='b'));announce(side==='b'?'Side B: outside work.':'Side A: product work.');updateCounter();}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function top(){if(scrollY<3)return;window.scrollTo({top:0,behavior:reduced?'instant':'smooth'});const start=performance.now();await new Promise(resolve=>{function check(){if(scrollY<3||performance.now()-start>1500){window.scrollTo({top:0,behavior:'instant'});resolve()}else requestAnimationFrame(check)}check()});}
function after(hash){if(!hash)return;document.querySelector(hash)?.scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});}
async function flip(next,hash){if(busy)return;if(side===next){after(hash);return}busy=true;record.setAttribute('aria-busy','true');arm.classList.add('lifted');await top();
if(reduced){apply(next);disc.style.transform=`rotateY(${next==='b'?180:0}deg)`;}else{
 await delay(140);const from=side==='a'?0:180,to=from+180;
 const anim=disc.animate([{transform:`translateY(0) rotateY(${from}deg) scale(1)`},{transform:`translateY(-28px) rotateY(${from+90}deg) scale(1.045)`,offset:.5},{transform:`translateY(0) rotateY(${to}deg) scale(1)`}],{duration:880,easing:'cubic-bezier(.45,0,.25,1)',fill:'forwards'});
 await delay(440);apply(next);await anim.finished;disc.style.transform=`rotateY(${next==='b'?180:0}deg)`;anim.cancel();
}history.replaceState(null,'',next==='b'?'#b':'#top');if(document.activeElement?.closest('.a-only,.b-only'))record.focus({preventScroll:true});busy=false;record.removeAttribute('aria-busy');arm.classList.remove('lifted');after(hash);}
document.addEventListener('click',e=>{const control=e.target.closest('[data-flip]');if(!control)return;e.preventDefault();flip(control.dataset.flip,control.dataset.then)});
document.addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey||e.repeat||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;if(e.key.toLowerCase()==='a'||e.key.toLowerCase()==='b'){e.preventDefault();flip(e.key.toLowerCase())}});
record.addEventListener('click',()=>{if(suppressClick){suppressClick=false;return}flip(side==='a'?'b':'a')});
function pointerAngle(e){const r=record.getBoundingClientRect();return Math.atan2(e.clientY-r.top-r.height/2,e.clientX-r.left-r.width/2)*180/Math.PI;}
record.addEventListener('pointerdown',e=>{if(busy||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,last:pointerAngle(e),time:performance.now(),distance:0};velocity=0;record.setPointerCapture(e.pointerId);arm.classList.add('lifted');record.classList.add('dragging')});
record.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const now=performance.now(),a=pointerAngle(e);let delta=a-drag.last;if(delta>180)delta-=360;if(delta< -180)delta+=360;drag.distance+=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;angle+=delta;velocity=Math.max(-600,Math.min(600,delta/Math.max(8,now-drag.time)*1000));drag.last=a;drag.time=now;record.style.setProperty('--spin',angle+'deg')});
function end(e){if(!drag||e.pointerId!==drag.id)return;suppressClick=drag.distance>7&&e.type!=='pointercancel';if(suppressClick)setTimeout(()=>suppressClick=false,0);drag=null;record.classList.remove('dragging');arm.classList.remove('lifted');if(reduced||paused)velocity=0;if(e.type==='pointercancel')velocity=0;}
record.addEventListener('pointerup',end);record.addEventListener('pointercancel',end);record.addEventListener('lostpointercapture',e=>{if(drag)end(e)});
new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(record);
document.addEventListener('visibilitychange',()=>lastFrame=0);
function tick(t){const dt=lastFrame?Math.min((t-lastFrame)/1000,.05):0;lastFrame=t;if(visible&&!document.hidden&&!drag&&!reduced&&!paused&&!busy){velocity+=(5.4-velocity)*(1-Math.exp(-2.3*dt));angle=(angle+velocity*dt)%360;record.style.setProperty('--spin',angle+'deg')}requestAnimationFrame(tick)}requestAnimationFrame(tick);
function updateCounter(){const max=document.documentElement.scrollHeight-innerHeight,progress=max>0?Math.min(1,Math.max(0,scrollY/max)):0;document.querySelector('.counter-fill').style.transform=`scaleX(${progress})`;document.querySelector('#counter-value').textContent=String(Math.round(progress*999)).padStart(3,'0');document.querySelector('#counter-side').textContent=side.toUpperCase();}
window.addEventListener('scroll',updateCounter,{passive:true});window.addEventListener('resize',updateCounter);new ResizeObserver(updateCounter).observe(body);
const initial=location.hash==='#b'||location.hash==='#outside'?'b':'a';apply(initial);disc.style.transform=`rotateY(${initial==='b'?180:0}deg)`;if(initial==='b')window.scrollTo({top:0,behavior:'instant'});updateMotion();requestAnimationFrame(()=>arm.classList.remove('lifted'));
})();
