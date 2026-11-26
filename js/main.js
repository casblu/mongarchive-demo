(()=>{
const root=document.body.dataset.root||'';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];

/* ---------- menu / search overlays ---------- */
const menuBtn=$('[data-open-menu]');
menuBtn&&menuBtn.addEventListener('click',()=>{const o=document.body.classList.toggle('menu-open');menuBtn.setAttribute('aria-expanded',o);o?lenis&&lenis.stop():lenis&&lenis.start();});
$$('.nav-top[aria-expanded]').forEach(b=>b.addEventListener('click',()=>{const g=b.parentElement;const o=g.classList.toggle('open');b.setAttribute('aria-expanded',o);$$('.nav-group.open').forEach(x=>x!==g&&x.classList.remove('open'));}));
document.addEventListener('click',e=>{if(!e.target.closest('.nav-group'))$$('.nav-group.open').forEach(x=>x.classList.remove('open'));});
const sInput=$('[data-live-search]'),sRes=$('[data-live-results]');
function openSearch(){document.body.classList.add('search-open');lenis&&lenis.stop();setTimeout(()=>sInput&&sInput.focus(),50);}
function closeSearch(){document.body.classList.remove('search-open');lenis&&lenis.start();}
$$('[data-open-search]').forEach(b=>b.addEventListener('click',openSearch));
$$('[data-close-search]').forEach(b=>b.addEventListener('click',closeSearch));
addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openSearch();}if(e.key==='Escape'){closeSearch();document.body.classList.remove('menu-open');}});

const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function hl(t,q){if(!q)return esc(t);const i=t.toLowerCase().indexOf(q.toLowerCase());if(i<0)return esc(t.slice(0,160));const s=Math.max(0,i-60);return (s?'…':'')+esc(t.slice(s,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length,i+q.length+120))+'…';}
function search(q,col){const idx=window.MA_INDEX||[];q=(q||'').trim();if(!q&&!col)return[];const terms=q.toLowerCase().split(/\s+/).filter(Boolean);
  const out=[];for(const r of idx){if(col&&r.slug!==col)continue;const hay=(r.page+' '+r.heading+' '+r.text).toLowerCase();let score=0,ok=true;for(const t of terms){if(!hay.includes(t)){ok=false;break}score+=(r.heading.toLowerCase().includes(t)?3:0)+(r.page.toLowerCase().includes(t)?2:0)+1}if(ok)out.push([score,r]);}
  out.sort((a,b)=>b[0]-a[0]);const seen=new Set();return out.map(x=>x[1]).filter(r=>{const k=r.slug+r.heading;if(seen.has(k))return false;seen.add(k);return true}).slice(0,40);}
function render(list,q,el){el.innerHTML=list.map(r=>`<li><a href="${root}${r.slug==='home'?'index.html':'p/'+r.slug+'.html'}"><span class="r-page">${esc(r.page)}</span><span class="r-head">${esc(r.heading)}</span><span class="r-text">${hl(r.text,q.split(/\s+/)[0]||'')}</span></a></li>`).join('');}
sInput&&sInput.addEventListener('input',()=>{const q=sInput.value;render(search(q),q,sRes);if(q&&!search(q).length)sRes.innerHTML='<li class="adv-status">No matching restored pages.</li>';});

/* advanced search page */
if(document.body.classList.contains('page-advanced-search')){
  const params=new URLSearchParams(location.search);const q=params.get('q')||'',col=params.get('collection')||'';
  const form=$('main form');if(form){const i=$('input[name=q]',form);i&&(i.value=q);const s=$('select[name=collection]',form);s&&col&&(s.value=col);}
  const holder=$$('main p,main div').find(e=>e.children.length===0&&/Loading archive search/.test(e.textContent));
  if(holder){const ul=document.createElement('ol');ul.className='adv-results';const list=search(q,col);
    holder.textContent=(q||col)?(list.length?`${list.length} result${list.length>1?'s':''}${q?` for “${q}”`:''}`:`No restored pages match${q?` “${q}”`:''}.`):'Enter a keyword to search the restored pages.';holder.classList.add('adv-status');holder.after(ul);render(list,q,ul);}
}

/* ---------- split headline words ---------- */
$$('[data-split]').forEach(h=>{const words=h.textContent.trim().split(/\s+/);h.setAttribute('aria-label',h.textContent.trim());h.innerHTML=words.map(w=>`<span class="w" aria-hidden="true">${esc(w)}</span>`).join(' ');});

/* ---------- topbar ---------- */
const bar=$('[data-topbar]');let lastY=0;
function onScrollBar(y){bar.classList.toggle('solid',y>40);if(!document.body.classList.contains('menu-open'))bar.classList.toggle('hide',y>lastY+2&&y>400);if(y<lastY-2)bar.classList.remove('hide');lastY=y;}

let lenis=null;
if(reduce||!window.gsap||!window.ScrollTrigger){addEventListener('scroll',()=>onScrollBar(scrollY),{passive:true});return;}
gsap.registerPlugin(ScrollTrigger);
lenis=new Lenis({lerp:.085,wheelMultiplier:.9,smoothWheel:true,syncTouch:false});
lenis.on('scroll',e=>{ScrollTrigger.update();onScrollBar(e.scroll);});
gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0);
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=$(a.getAttribute('href'));if(t){e.preventDefault();lenis.scrollTo(t,{offset:-80});}}));

/* fixed stage: whole-page scrub of weave layers */
gsap.to('.w-a',{xPercent:-6,yPercent:-12,ease:'none',scrollTrigger:{trigger:document.documentElement,start:0,end:'max',scrub:1.2}});
gsap.to('.w-b',{xPercent:5,yPercent:-20,ease:'none',scrollTrigger:{trigger:document.documentElement,start:0,end:'max',scrub:1.6}});

/* section crossfades: each scene lights its colour layer */
const layers=$$('.stage .layer');
function light(n){layers.forEach((l,i)=>{if(i===0)return;gsap.to(l,{opacity:i===n?1:0,duration:1.1,ease:'power2.out',overwrite:true});});}
$$('[data-scene]').forEach(s=>{const n=(+s.dataset.scene)+1;ScrollTrigger.create({trigger:s,start:'top 60%',end:'bottom 40%',onToggle:self=>self.isActive&&light(n)});});
ScrollTrigger.create({trigger:'main',start:'top top',end:'top -1',onEnterBack:()=>light(0)});

const mm=gsap.matchMedia();

/* ---------- HOME hero: pinned scrubbed sequence + iris mask wipe ---------- */
const hh=$('[data-hero-home]');
if(hh){
  const words=$$('.hh-title .w');
  gsap.from(words,{yPercent:110,opacity:0,rotate:4,duration:1.2,ease:'expo.out',stagger:.08,delay:.15});
  gsap.from(['.hh-crest','.hh-lede','.focus'],{y:30,opacity:0,duration:1.1,ease:'expo.out',stagger:.1,delay:.45});
  gsap.from('.hh-textile',{opacity:0,scale:.85,duration:1.6,ease:'expo.out',delay:.1});
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:hh,start:'top top',end:'bottom bottom',scrub:1}});
  tl.to('.hh-textile.t1',{x:'-18vw',y:'-14vh',rotate:-32,scale:1.25},0)
    .to('.hh-textile.t2',{x:'18vw',y:'14vh',rotate:190,scale:1.25},0)
    .to('.r1',{scale:2.4,opacity:0},0).to('.r2',{scale:1.9,rotate:60},0).to('.r3',{scale:1.6,rotate:-40},0).to('.r4',{scale:1.35},0)
    .to('.hh-sun',{scale:1.8,opacity:.4},0)
    .to(words,{yPercent:-40,opacity:0,stagger:.03},.18)
    .to(['.hh-crest','.hh-lede','.focus'],{y:-60,opacity:0,stagger:.03},.12)
    .to('.hh-copy',{scale:.9},0)
    .to('.hh-iris',{scale:3.2,ease:'power2.in'},.45)
    .to('.hh-iris',{opacity:0,ease:'power1.out'},.86)
    .to('.scroll-cue',{opacity:0},0)
    .to('.hh-textile,.ring,.hh-sun',{opacity:0,ease:'power1.in'},.8);
}

/* banner + marquee */
$$('.banner-fig').forEach(f=>gsap.fromTo(f,{scale:.82,opacity:0,y:80},{scale:1,opacity:1,y:0,ease:'none',scrollTrigger:{trigger:f,start:'top 95%',end:'top 45%',scrub:1}}));
$$('.mq-track').forEach(t=>gsap.fromTo(t,{xPercent:0},{xPercent:-35,ease:'none',scrollTrigger:{trigger:t,start:'top bottom',end:'bottom top',scrub:1}}));

/* inner hero: scrub-out parallax */
$$('.hero-inner').forEach(h=>{
  const w=$$('.display .w',h);
  gsap.from(w,{yPercent:110,opacity:0,duration:1.1,ease:'expo.out',stagger:.06,delay:.1});
  gsap.from($$('.crumbs,.lede,.hero-extras',h),{y:24,opacity:0,duration:1,ease:'expo.out',stagger:.08,delay:.35});
  gsap.from($('.hero-textile',h),{x:120,opacity:0,rotate:30,duration:1.6,ease:'expo.out'});
  const tl=gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:h,start:'top top',end:'bottom top',scrub:1}});
  tl.to($('.hero-copy',h),{yPercent:-28,opacity:0},0).to($('.hero-textile',h),{yPercent:40,rotate:40,scale:1.3},0)
    .to($('.r1',h),{scale:1.8,opacity:0},0).to($('.r2',h),{scale:1.5,rotate:45},0).to($('.r3',h),{scale:1.3},0).to($('.scroll-cue',h),{opacity:0},0);
});

/* scene reveals: scrubbed in, crossfade out */
$$('.reveal').forEach(el=>{
  gsap.fromTo(el,{opacity:0,y:90,scale:.94},{opacity:1,y:0,scale:1,ease:'none',scrollTrigger:{trigger:el,start:'top 98%',end:'top 62%',scrub:.8}});
});
$$('.scene-inner').forEach(el=>{
  const items=$$(':scope .card,:scope .chips>*,:scope li,:scope .panel',el).slice(0,60);
  if(items.length>1)gsap.from(items,{opacity:0,y:30,duration:.8,ease:'power3.out',stagger:.03,scrollTrigger:{trigger:el,start:'top 75%',once:true}});
});
$$('.grid4 .panel').forEach((p,i)=>gsap.fromTo(p,{y:60+i*30},{y:0,ease:'none',scrollTrigger:{trigger:p,start:'top bottom',end:'top 55%',scrub:1}}));

/* collections: horizontal pinned scroll on desktop, staggered stack on phones */
const col=$('[data-collections]');
if(col){
  mm.add('(min-width:1000px)',()=>{
    col.classList.add('horizontal');
    const track=$('[data-track]',col),prog=$('[data-progress]',col);
    const dist=()=>Math.max(0,track.scrollWidth-innerWidth+Math.max(48,(innerWidth-1240)/2));
    const tw=gsap.to(track,{x:()=>-dist(),ease:'none',scrollTrigger:{trigger:col,start:'top top',end:()=>'+='+dist(),pin:$('.col-pin',col),scrub:1,invalidateOnRefresh:true,anticipatePin:1}});
    gsap.to(prog,{scaleX:1,ease:'none',scrollTrigger:{trigger:col,start:'top top',end:()=>'+='+dist(),scrub:true,invalidateOnRefresh:true}});
    $$('.hcard',col).forEach(c=>gsap.fromTo($('.hcard-motif',c),{rotate:0},{rotate:120,ease:'none',scrollTrigger:{trigger:col,start:'top top',end:()=>'+='+dist(),scrub:1}}));
    return()=>{col.classList.remove('horizontal');gsap.set(track,{clearProps:'transform'});};
  });
  mm.add('(max-width:999px)',()=>{
    $$('.hcard',col).forEach(c=>gsap.fromTo(c,{opacity:0,y:70,scale:.95},{opacity:1,y:0,scale:1,ease:'none',scrollTrigger:{trigger:c,start:'top 98%',end:'top 70%',scrub:.8}}));
  });
}

/* globe */
$$('.globe').forEach(g=>{gsap.fromTo(g,{scale:.7,rotate:-20},{scale:1,rotate:10,ease:'none',scrollTrigger:{trigger:g,start:'top bottom',end:'bottom 40%',scrub:1}});gsap.to($('.g-lon',g),{scaleX:-.55,duration:9,repeat:-1,yoyo:true,ease:'sine.inOut'});gsap.to($('.g-lon.b',g),{scaleX:.75,duration:7,repeat:-1,yoyo:true,ease:'sine.inOut'});});

/* footer mark */
$$('.foot-mark').forEach(m=>gsap.fromTo(m,{yPercent:40,opacity:0},{yPercent:0,opacity:1,ease:'none',scrollTrigger:{trigger:m,start:'top bottom',end:'top 60%',scrub:1}}));

addEventListener('load',()=>ScrollTrigger.refresh());
})();
