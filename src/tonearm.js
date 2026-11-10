import * as THREE from 'three';

// A transparent, self-contained scene. The existing drawing remains the fallback.
const host = document.querySelector('.tonearm');
if (host) {
  try { mount(host); } catch (error) { console.info('Using the tonearm drawing.', error.message); }
}
function mount(host) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-110, 110, 180, -180, 1, 1200);
  camera.position.set(0, 0, 650);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x65557e, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 4); light.position.set(-150, 200, 350); scene.add(light);
  const rim = new THREE.DirectionalLight(0xb9caff, 3); rim.position.set(200, -50, 180); scene.add(rim);
  const silver = new THREE.MeshStandardMaterial({color:0xb9bfce, metalness:.72, roughness:.25});
  const dark = new THREE.MeshStandardMaterial({color:0x242636, metalness:.35, roughness:.4});
  const gold = new THREE.MeshStandardMaterial({color:0xe7bd6f, metalness:.65, roughness:.3});
  const moving = new THREE.Group(); moving.position.set(60,128,0); scene.add(moving);
  function box(w,h,d,x,y,z,material,parent=moving){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m;}
  function cylinder(radius,height,x,y,z,material,parent=moving){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,48),material);m.rotation.x=Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
  // Fixed plinth, gimbal and pivot bearing, seen from above.
  cylinder(29,12,60,128,-5,dark,scene);
  cylinder(23,8,60,128,4,silver,scene);
  cylinder(14,13,0,0,11,dark);
  cylinder(8,17,0,0,20,silver);
  box(31,30,23,0,29,17,dark);
  for(let y=19;y<43;y+=4)box(32,1.2,24,0,y,17,silver);
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,0,15), new THREE.Vector3(-5,-82,17),
    new THREE.Vector3(-12,-167,17),new THREE.Vector3(-29,-202,16),
    new THREE.Vector3(-86,-253,15)
  ]);
  moving.add(new THREE.Mesh(new THREE.TubeGeometry(curve,64,4.5,12,false),silver));
  const cartridge=new THREE.Group();cartridge.position.set(-88,-257,13);cartridge.rotation.z=-.72;moving.add(cartridge);
  box(23,40,9,0,0,0,dark,cartridge);
  box(15,22,7,0,-7,7,silver,cartridge);
  for(const x of [-6,6]){const screw=new THREE.Mesh(new THREE.SphereGeometry(2.2,12,8),silver);screw.position.set(x,12,6);cartridge.add(screw);}
  box(3,11,4,0,-24,1,gold,cartridge);
  // Finger lift makes the headshell more recognizable.
  const lift=new THREE.CatmullRomCurve3([new THREE.Vector3(10,8,0),new THREE.Vector3(27,5,8),new THREE.Vector3(31,1,15)]);
  cartridge.add(new THREE.Mesh(new THREE.TubeGeometry(lift,12,1.5,8),silver));
  renderer.domElement.setAttribute('aria-hidden','true');
  host.append(renderer.domElement);
  let target=host.classList.contains('lifted')?1:0, value=target, frame=0, last=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function draw(t){frame=0;const dt=last?Math.min((t-last)/1000,.05):.016;last=t;
    value=reduce.matches?target:value+(target-value)*(1-Math.exp(-11*dt));
    if(Math.abs(target-value)<.001)value=target;
    moving.rotation.z=-value*.32;moving.rotation.x=-value*.2;moving.position.z=value*14;
    renderer.render(scene,camera);
    if(value!==target)frame=requestAnimationFrame(draw);else last=0;
  }
  function render(){if(!frame)frame=requestAnimationFrame(draw);}
  new MutationObserver(()=>{target=host.classList.contains('lifted')?1:0;render();}).observe(host,{attributes:true,attributeFilter:['class']});
  new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight,false);render();}).observe(host);
  reduce.addEventListener('change',render);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);host.classList.remove('has-3d');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{host.classList.add('has-3d');render();});
  renderer.setSize(host.clientWidth,host.clientHeight,false);
  draw(performance.now());host.classList.add('has-3d');
}

import { mountRecords } from './records-3d.js';
mountRecords();
