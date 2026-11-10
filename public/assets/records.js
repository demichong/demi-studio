(()=>{
  const crate=document.querySelector('.crate');if(!crate)return;
  const viewport=crate.querySelector('.crate-window'),albums=[...crate.querySelectorAll('.album')];
  if(!crate.querySelector('.album-spine'))return; // Older saved designs retain their ordinary project links.
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),steps=[...document.querySelectorAll('[data-step]')],edges=[...crate.querySelectorAll('[data-edge]')];
  let active=0,pulling=null,hoverTimer=0,edgeTimer=0,swallowClick=false;
  crate.classList.add('is-enhanced');
  function stop(){clearInterval(edgeTimer);edgeTimer=0;clearTimeout(hoverTimer);}
  function choose(index,focus=false){
    if(pulling)return;active=Math.max(0,Math.min(albums.length-1,index));
    albums.forEach((album,i)=>{
      const selected=i===active;album.classList.toggle('is-active',selected);
      const spine=album.querySelector('.album-spine');spine.setAttribute('aria-expanded',String(selected));
      album.querySelectorAll('a').forEach(a=>a.tabIndex=selected?0:-1);
    });
    steps.concat(edges).forEach(b=>b.disabled=Number(b.dataset.step||b.dataset.edge)<0?active===0:active===albums.length-1);
    if(focus)albums[active].querySelector('.album-spine').focus({preventScroll:true});
    document.querySelector('.crate-status').textContent=albums[active].getAttribute('aria-label')+', '+(active+1)+' of '+albums.length;
    // Wait for the sleeve to finish unfolding before keeping it in the mobile viewport.
    clearTimeout(choose.scrollTimer);choose.scrollTimer=setTimeout(()=>{
      const album=albums[active],left=album.offsetLeft-viewport.offsetLeft;
      if(left<viewport.scrollLeft||left+album.offsetWidth>viewport.scrollLeft+viewport.clientWidth)
        viewport.scrollTo({left:Math.max(0,left-12),behavior:reduce.matches?'instant':'smooth'});
    },reduce.matches?0:480);
  }
  function step(d,focus=false){choose(active+d,focus);}
  albums.forEach((album,i)=>{
    const spine=album.querySelector('.album-spine');
    album.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>choose(i),100);}});
    album.addEventListener('pointerleave',()=>clearTimeout(hoverTimer));
    spine.addEventListener('click',()=>choose(i));
    spine.addEventListener('focus',()=>choose(i));
    album.addEventListener('focusin',()=>{stop();if(active!==i)choose(i)});
  });
  steps.forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.step))));
  edges.forEach(b=>{
    const d=Number(b.dataset.edge);b.addEventListener('click',()=>step(d));
    b.addEventListener('pointerenter',e=>{if(e.pointerType!=='mouse'||reduce.matches)return;stop();edgeTimer=setInterval(()=>step(d),850);});
    b.addEventListener('pointerleave',stop);
  });
  viewport.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();stop();
    choose(e.key==='Home'?0:e.key==='End'?albums.length-1:active+(e.key==='ArrowRight'?1:-1),true);
  });
  document.addEventListener('visibilitychange',stop);window.addEventListener('blur',stop);reduce.addEventListener('change',stop);
  document.querySelectorAll('.pull-disc').forEach(link=>{
    link.addEventListener('dragstart',e=>e.preventDefault());
    link.addEventListener('click',e=>{if(swallowClick){e.preventDefault();swallowClick=false;}});
    link.addEventListener('pointerdown',e=>{if(e.button!==0)return;stop();pulling={link,id:e.pointerId,y:e.clientY,amount:0};link.setPointerCapture(e.pointerId)});
    link.addEventListener('pointermove',e=>{
      if(!pulling||pulling.link!==link||e.pointerId!==pulling.id)return;
      pulling.amount=Math.max(0,Math.min(125,pulling.y-e.clientY));link.classList.add('is-pulling');link.style.setProperty('--pull',-pulling.amount+'px');
    });
    function finish(e){
      if(!pulling||pulling.link!==link||e.pointerId!==pulling.id)return;
      const amount=pulling.amount,open=e.type==='pointerup'&&amount>55;pulling=null;
      link.classList.remove('is-pulling');link.style.removeProperty('--pull');
      swallowClick=amount>7;setTimeout(()=>swallowClick=false,0);
      if(open)location.href=link.href;
    }
    link.addEventListener('pointerup',finish);link.addEventListener('pointercancel',finish);link.addEventListener('lostpointercapture',finish);
  });
  choose(0);
})();
