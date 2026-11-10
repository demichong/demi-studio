import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const tau = Math.PI * 2;
function texture(draw, size=1024) {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  draw(canvas.getContext('2d'),size);
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  map.anisotropy=4;return map;
}
function ringText(ctx,text,radius,size){
  ctx.save();ctx.translate(size/2,size/2);ctx.font=`500 ${size*.027}px monospace`;ctx.fillStyle='#ded7ef';
  const spacing=tau/text.length;
  for(let i=0;i<text.length;i++){ctx.save();ctx.rotate(-Math.PI/2+i*spacing);ctx.translate(radius,0);ctx.rotate(Math.PI/2);ctx.fillText(text[i],0,0);ctx.restore();}
  ctx.restore();
}
function discTexture(text){return texture((c,s)=>{
  c.fillStyle='#171522';c.fillRect(0,0,s,s);
  for(let r=s*.255;r<s*.482;r+=s*.0032){c.beginPath();c.arc(s/2,s/2,r,0,tau);c.strokeStyle=Math.round(r)%3?'#292537':'#393242';c.lineWidth=s*.0009;c.stroke();}
  for(let i=0;i<100;i++){c.save();c.translate(s/2,s/2);c.rotate(i*tau/100);c.fillStyle='#a69bbd';c.fillRect(-s*.001,s*.487,s*.002,s*.01);c.restore();}
  ringText(c,text,s*.33,s);
});}
const bump=texture((c,s)=>{c.fillStyle='#777';c.fillRect(0,0,s,s);for(let r=s*.255;r<s*.48;r+=3){c.beginPath();c.arc(s/2,s/2,r,0,tau);c.strokeStyle='#aaa';c.lineWidth=1;c.stroke();}},512);
bump.colorSpace=THREE.NoColorSpace;
function labelTexture(title,image,background='#6550ad'){
  return texture((c,s)=>{c.fillStyle=background;c.fillRect(0,0,s,s);
    if(image){const crop=Math.min(image.naturalWidth,image.naturalHeight);c.drawImage(image,(image.naturalWidth-crop)/2,(image.naturalHeight-crop)*.38,crop,crop,0,0,s,s);}
    else{c.fillStyle='#f2ecff';c.font=`500 ${s*.074}px monospace`;c.textAlign='center';c.textBaseline='middle';const words=title.split(' ');let lines=[],line='';words.forEach(w=>{if((line+' '+w).length>17){lines.push(line);line=w;}else line+=(line?' ':'')+w;});if(line)lines.push(line);lines.forEach((l,i)=>c.fillText(l,s/2,s/2+(i-(lines.length-1)/2)*s*.105));}
    c.beginPath();c.arc(s/2,s/2,s*.465,0,tau);c.strokeStyle='#d6c9ee';c.lineWidth=s*.007;c.stroke();
  },512);
}
function makeRecord(frontText,backText,frontLabel,backLabel){
  const group=new THREE.Group(),spin=new THREE.Group();group.add(spin);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(1,1,.025,128,1,true),new THREE.MeshStandardMaterial({color:0x211e2c,metalness:.5,roughness:.26}));rim.rotation.x=Math.PI/2;spin.add(rim);
  function face(text,label,back){const side=new THREE.Group();if(back)side.rotation.y=Math.PI;
    const material=new THREE.MeshPhysicalMaterial({map:discTexture(text),bumpMap:bump,bumpScale:.009,metalness:.22,roughness:.32,clearcoat:.5,clearcoatRoughness:.25});
    const surface=new THREE.Mesh(new THREE.RingGeometry(.012,1,128),material);surface.position.z=.013;side.add(surface);spin.add(side);
    const paper=new THREE.Mesh(new THREE.RingGeometry(.027,.43,96),new THREE.MeshStandardMaterial({map:label,roughness:.82,metalness:0}));paper.position.z=.016;
    const labelGroup=new THREE.Group();if(back)labelGroup.rotation.y=Math.PI;labelGroup.add(paper);group.add(labelGroup);
  }
  face(frontText,frontLabel,false);face(backText,backLabel,true);
  return {group,spin};
}
function stage(host,className,extent){
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);
  renderer.domElement.className=className;renderer.domElement.setAttribute('aria-hidden','true');host.append(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-extent,extent,extent,-extent,.1,100);
  camera.position.z=8;
  scene.add(new THREE.HemisphereLight(0xf8f6ff,0x4c3c66,2));
  const key=new THREE.DirectionalLight(0xffffff,3.8);key.position.set(-3,4,6);scene.add(key);
  const fill=new THREE.DirectionalLight(0xc1c8ff,1.6);fill.position.set(3,-2,4);scene.add(fill);
  let visible=true,frame=0;
  function render(){if(visible&&!document.hidden)renderer.render(scene,camera);}
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('has-object-3d');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{host.classList.add('has-object-3d');render();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)request();}).observe(host);
  const resize=new ResizeObserver(()=>{const r=renderer.domElement.getBoundingClientRect();renderer.setSize(r.width,r.height,false);render();});resize.observe(host);
  function request(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;render();});}
  document.addEventListener('visibilitychange',request);
  return {renderer,scene,camera,render,request};
}
function loadImage(src){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});}

async function hero(){
  const host=document.querySelector('#record');if(!host)return;
  // Keep both labels in HTML so the accessible content and fallback stay intact.
  const image=await loadImage(host.querySelector('.face-b img').getAttribute('src'));
  const {scene,render,request}=stage(host,'vinyl-canvas',1.025);
  const slot=host.querySelector('.face-a .slot');
  const portrait=host.querySelector('.face-a .label img');
  const frontLabel=portrait?labelTexture('',await loadImage(portrait.getAttribute('src'))):labelTexture(slot?slot.childNodes[0].textContent.trim()+' '+slot.querySelector('small').textContent:host.querySelector('.face-a .label').textContent.trim());
  const backLabel=labelTexture('',image);
  const record=makeRecord(host.querySelector('.face-a text').textContent,host.querySelector('.face-b text').textContent,frontLabel,backLabel);
  scene.add(record.group);
  let side=document.body.classList.contains('side-b')?Math.PI:0,flip=null,frame=0,tilt={x:.10,y:-.13},target={...tilt};
  function draw(now){frame=0;
    if(flip){const p=Math.min(1,(now-flip.start)/flip.duration),ease=p*p*(3-2*p);side=flip.from+Math.PI*ease;record.group.position.y=Math.sin(p*Math.PI)*.1;if(p===1){side=flip.next;flip=null;record.group.position.y=0;}}
    tilt.x+=(target.x-tilt.x)*.16;tilt.y+=(target.y-tilt.y)*.16;
    record.group.rotation.set(tilt.x,side+tilt.y,0);record.spin.rotation.z=-parseFloat(host.style.getPropertyValue('--spin')||0)*Math.PI/180;
    render();
    if(flip||Math.abs(target.x-tilt.x)+Math.abs(target.y-tilt.y)>.0004)frame=requestAnimationFrame(draw);
  }
  function update(){if(!frame)frame=requestAnimationFrame(draw);}
  new MutationObserver(update).observe(host,{attributes:true,attributeFilter:['style']});
  new MutationObserver(()=>{if(!flip){side=document.body.classList.contains('side-b')?Math.PI:0;update();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
  host.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||host.hasAttribute('aria-busy'))return;const r=host.getBoundingClientRect();target={x:.10+(e.clientY-r.top-r.height/2)/r.height*.13,y:-.13+(e.clientX-r.left-r.width/2)/r.width*.18};update();});
  host.addEventListener('pointerleave',()=>{target={x:.10,y:-.13};update();});
  document.addEventListener('vinyl-flip',e=>{const next=e.detail.next==='b'?Math.PI:0;if(!e.detail.duration){side=next;flip=null;}else{flip={from:side,next,start:performance.now(),duration:e.detail.duration};}update();});
  reduced.addEventListener('change',()=>{if(flip){side=flip.next;flip=null;}target={x:.10,y:-.13};update();});
  host.classList.add('has-object-3d');update();request();
}
function sleeveTexture(album){
  const art=album.querySelector('.sleeve-art'),computed=getComputedStyle(art),title=art.querySelector('.sleeve-type');
  return texture((c,s)=>{
    c.fillStyle=computed.backgroundColor;c.fillRect(0,0,s,s);
    // Small paper grain and a folded edge rather than a glossy UI tile.
    for(let i=0;i<8000;i++){const x=(i*73.73)%s,y=(i*43.13)%s;c.fillStyle=i%2?'#ffffff06':'#00000005';c.fillRect(x,y,1,1);}
    c.fillStyle=computed.color;const face=getComputedStyle(title).fontFamily;
    c.font=`800 ${s*.225}px ${face}`;c.textBaseline='top';
    const lines=title.innerHTML.split(/<br\s*\/?\s*>/i).map(t=>t.replace(/<[^>]+>/g,''));
    c.save();c.translate(s*.095,s*.35);if(art.classList.contains('fashion'))c.rotate(-.10);
    lines.forEach((line,i)=>c.fillText(line,0,i*s*.20,s*.84));c.restore();
    c.font=`400 ${s*.026}px sans-serif`;c.fillText(art.querySelector('.cover-edition').textContent,s*.09,s*.91,s*.82);
    c.fillStyle='#ffffff14';c.fillRect(0,0,s*.008,s);c.fillStyle='#00000020';c.fillRect(s*.99,0,s*.01,s);
  });
}
function cover(album){
  const host=album.querySelector('.album-object');if(host.classList.contains('has-object-3d'))return;
  const {scene,camera,renderer,render}=stage(host,'sleeve-canvas',1.05);
  camera.top=1.785;camera.bottom=-1.05;camera.updateProjectionMatrix();
  const assembly=new THREE.Group();scene.add(assembly);
  const front=new THREE.MeshStandardMaterial({map:sleeveTexture(album),roughness:.94});
  const paper=new THREE.MeshStandardMaterial({color:0xb8adc6,roughness:1});
  const back=new THREE.MeshStandardMaterial({color:getComputedStyle(album).getPropertyValue('--sleeve').trim(),roughness:.92});
  const sleeve=new THREE.Mesh(new THREE.BoxGeometry(2,2,.065),[paper,paper,paper,paper,front,back]);
  assembly.add(sleeve);
  // A dark mouth along the sleeve's top edge makes the pull direction tangible.
  const mouth=new THREE.Mesh(new THREE.BoxGeometry(1.94,.012,.031),new THREE.MeshStandardMaterial({color:0x24202d,roughness:1}));mouth.position.set(0,1,.006);assembly.add(mouth);
  const name=album.getAttribute('aria-label');
  const vinyl=makeRecord(name+' / DEMI STUDIO / '+name+' / DEMI STUDIO / ',name+' / ',labelTexture(name),labelTexture(name));
  vinyl.group.scale.setScalar(.88);vinyl.group.position.set(0,.40,-.10);assembly.add(vinyl.group);
  let target={x:.09,y:-.24},current={x:.09,y:reduced.matches?-.24:1.35},frame=0,pull=0,amount=0;
  const link=album.querySelector('.pull-disc');
  function draw(){frame=0;
    const selected=album.classList.contains('is-active');
    current.x+=(target.x-current.x)*.18;current.y+=(target.y-current.y)*.18;pull=link.classList.contains('is-pulling')?amount:pull+(amount-pull)*.25;
    if(reduced.matches){current={x:.09,y:-.24};pull=amount;}
    assembly.rotation.set(current.x,current.y,0);vinyl.group.position.y=.40+pull;vinyl.spin.rotation.z=-pull*.8;
    render();
    if(selected&&(Math.abs(current.x-target.x)+Math.abs(current.y-target.y)>.0005||Math.abs(pull-amount)>.001)&&!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function update(){if(!frame)frame=requestAnimationFrame(draw);}
  host.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches||link.classList.contains('is-pulling'))return;const r=host.getBoundingClientRect();target={x:.09+(e.clientY-r.top-r.height/2)/r.height*.14,y:-.24+(e.clientX-r.left-r.width/2)/r.width*.38};update();});
  host.addEventListener('pointerleave',()=>{target={x:.09,y:-.24};update();});
  function readPull(){const r=host.getBoundingClientRect();amount=(Math.max(0,-parseFloat(link.style.getPropertyValue('--pull')||0))+(link.matches(':hover,:focus-visible')?20:0))/r.height*2;update();}
  new MutationObserver(readPull).observe(link,{attributes:true,attributeFilter:['style','class']});
  link.addEventListener('pointerenter',readPull);link.addEventListener('pointerleave',readPull);link.addEventListener('focus',readPull);link.addEventListener('blur',readPull);
  new ResizeObserver(()=>{const r=renderer.domElement.getBoundingClientRect(),height=2.835;camera.left=-height*r.width/r.height/2;camera.right=-camera.left;camera.updateProjectionMatrix();update();}).observe(host);
  new MutationObserver(()=>{if(album.classList.contains('is-active')){target={x:.09,y:-.24};current.y=reduced.matches?-.24:1.35;update();}}).observe(album,{attributes:true,attributeFilter:['class']});
  host.classList.add('has-object-3d');update();
}
export async function mountRecords(){
  try{await hero();}catch(error){console.info('Using the vinyl drawing.',error.message);}
  await document.fonts.ready;
  const albums=[...document.querySelectorAll('.album')];
  function enhance(){albums.forEach(album=>{if(album.classList.contains('is-active')&&!album.querySelector('.has-object-3d')){try{cover(album);}catch(error){console.info('Using the sleeve drawing.',error.message);}}});}
  albums.forEach(album=>new MutationObserver(enhance).observe(album,{attributes:true,attributeFilter:['class']}));enhance();
}
