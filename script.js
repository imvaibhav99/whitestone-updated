(() => {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const smooth = t => t * t * (3 - 2 * t);
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let userMotion = null;
  try { userMotion = sessionStorage.getItem('white-stone-motion'); } catch {}
  let motion = userMotion === null ? !media.matches : userMotion === 'on';
  let pinned = false;
  const hero = $('.hero-journey'), sticky = $('.hero-sticky'), portal = $('.hero-portal');
  const intro = $('.hero-intro'), wordmark = $('.hero-wordmark'), heroFoot = $('.hero-foot');
  const leftImage = $('.float-left'), bottomImage = $('.float-bottom'), finale = $('.hero-finale');
  const expertise = $('.expertise-journey'), expertiseSticky = $('.expertise-sticky');
  const tabs = $$('.service-tabs button'), panels = $$('.service-panel'), frames = $$('.service-frame');
  let active = 0, serviceLockUntil = 0;
  let dimensions = {}, scheduled = false, pointerX = 0, pointerY = 0;

  const manifesto = $('.manifesto');
  // Preserve the heading's accessible wording while revealing each word visually.
  const originalText = manifesto.innerText.replace(/\s+/g, ' ').trim();
  manifesto.setAttribute('aria-label', originalText);
  manifesto.innerHTML = manifesto.innerHTML.split(/(<br\s*\/?\s*>)/i).map(part => /^<br/i.test(part) ? part : part.split(/(\s+)/).map(word => !word.trim() ? word : `<span class="word" aria-hidden="true">${word}</span>`).join('')).join('');
  const words = $$('.manifesto .word');

  const dialog = $('#menu-dialog'), menuButton = $('.menu-toggle');
  function closeMenu() { dialog.close(); document.body.classList.remove('menu-open'); menuButton.setAttribute('aria-expanded', 'false'); menuButton.focus({preventScroll:true}); }
  menuButton.addEventListener('click', () => { dialog.showModal(); document.body.classList.add('menu-open'); menuButton.setAttribute('aria-expanded', 'true'); });
  $('.menu-close').addEventListener('click', closeMenu);
  dialog.addEventListener('close', () => { document.body.classList.remove('menu-open'); menuButton.setAttribute('aria-expanded', 'false'); });
  dialog.querySelectorAll('nav a').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    closeMenu();
    if (target) {
      target.tabIndex = -1;
      target.focus({preventScroll:true});
      target.scrollIntoView({behavior:motion?'smooth':'instant'});
      history.replaceState(null, '', link.getAttribute('href'));
    }
  }));

  function selectService(index) {
    active = clamp(index, 0, 3);
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === active)); tab.tabIndex = i === active ? 0 : -1; });
    panels.forEach((panel, i) => { panel.classList.toggle('active', i === active); panel.hidden = i !== active; });
    frames.forEach((frame, i) => { frame.classList.toggle('active', i === active); frame.setAttribute('aria-hidden', String(i !== active)); });
    $('.service-step').textContent = `0${active + 1} — 04`;
    $('.service-prev').disabled = active === 0;
    $('.service-next').disabled = active === 3;
    $('.service-progress span').style.width = `${(active + 1) * 25}%`;
  }
  function goService(index, focus = false) {
    index = clamp(index, 0, 3);
    selectService(index);
    if (focus) tabs[index].focus({preventScroll:true});
    if (pinned) {
      serviceLockUntil = performance.now() + 1100;
      scrollTo({top: dimensions.expertiseTop + ((index + .22) / 4) * dimensions.serviceTravel, behavior: motion ? 'smooth' : 'instant'});
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => goService(i));
    tab.addEventListener('keydown', e => {
      const next = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : null;
      if (next !== null) { e.preventDefault(); goService(next, true); }
    });
  });
  $('.service-prev').addEventListener('click', () => goService(active - 1));
  $('.service-next').addEventListener('click', () => goService(active + 1));
  let touchStart = null;
  $('.service-visual').addEventListener('touchstart', e => {touchStart = {x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  $('.service-visual').addEventListener('touchend', e => { if(!touchStart)return; const x=e.changedTouches[0].clientX-touchStart.x,y=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(x)>65&&Math.abs(x)>Math.abs(y)*1.5)goService(active+(x<0?1:-1));touchStart=null; },{passive:true});
  selectService(0);

  function measure() {
    pinned = motion && innerWidth >= 1100 && innerHeight >= 760;
    root.classList.toggle('pin-services', pinned);
    // Use the unpinned presentation whenever content cannot fit below the header.
    if (pinned) {
      const box = expertiseSticky.getBoundingClientRect();
      const controls = $('.service-controls').getBoundingClientRect();
      const heading = $('.expertise-sticky .section-kicker').getBoundingClientRect();
      if (controls.bottom > box.top + innerHeight - 30 || heading.top < box.top + 85) {
        pinned = false;
        root.classList.remove('pin-services');
      }
    }
    dimensions = {
      heroTop: hero.offsetTop,
      heroTravel: Math.max(1, hero.offsetHeight - sticky.offsetHeight),
      expertiseTop: expertise.offsetTop,
      serviceTravel: Math.max(1, expertise.offsetHeight - expertiseSticky.offsetHeight),
      manifestoTop: manifesto.getBoundingClientRect().top + scrollY,
      manifestoHeight: manifesto.offsetHeight,
      contactTop: $('.contact').offsetTop,
      contactHeight: $('.contact').offsetHeight,
      mobile: innerWidth <= 760
    };
    requestRender();
  }
  function render() {
    scheduled = false;
    const y = scrollY, vh = innerHeight;
    $('.site-header').classList.toggle('scrolled', y > 80);
    $('.reading-progress').style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - vh))})`;
    if (motion) {
      const p = clamp((y - dimensions.heroTop) / dimensions.heroTravel), t = smooth(clamp((p - .06) / .70));
      const start = dimensions.mobile ? {left:71,top:14,width:23,height:16,rotate:5} : {left:75,top:15,width:20,height:27,rotate:4};
      portal.style.left = `${start.left * (1-t)}%`;
      portal.style.top = `${start.top * (1-t)}%`;
      portal.style.width = `${start.width + (100-start.width)*t}%`;
      portal.style.height = `${start.height + (100-start.height)*t}%`;
      portal.style.transform = `rotate(${start.rotate * (1-t)}deg)`;
      portal.style.zIndex = t > .05 ? '6' : '2';
      portal.querySelector('img').style.transform = `scale(${1.05 + t*.035}) translate3d(${pointerX*(1-t)*5}px,${pointerY*(1-t)*5}px,0)`;
      $('.portal-shade').style.opacity = String(t * .95);
      $('.portal-label').style.opacity = String(1-clamp(t*2));
      intro.style.opacity = String(1-clamp(p*5));
      intro.style.transform = `translate3d(0,${-p*120}px,0)`;
      intro.style.visibility = p > .25 ? 'hidden' : 'visible';
      wordmark.style.opacity = String(1-clamp(p*3.2));
      wordmark.style.transform = `translate3d(0,${p*170}px,0)`;
      heroFoot.style.opacity = String(1-clamp(p*5));
      leftImage.style.transform = `translate3d(${-p*350+pointerX*11}px,${-p*130+pointerY*9}px,0) rotate(${-5-p*16}deg)`;
      bottomImage.style.transform = `translate3d(${p*350-pointerX*15}px,${p*120-pointerY*12}px,0) rotate(${7+p*15}deg)`;
      leftImage.style.opacity = bottomImage.style.opacity = String(1-clamp(p*2.8));
      const fp = smooth(clamp((p-.52)/.25));
      finale.style.opacity = String(fp);
      finale.style.transform = `translate3d(0,${(1-fp)*45}px,0)`;
      finale.style.visibility = fp > .01 ? 'visible' : 'hidden';
      const wp = clamp((y + vh*.84-dimensions.manifestoTop) / (vh*.56+dimensions.manifestoHeight*.35));
      words.forEach((word,i) => word.style.setProperty('--fill', `${clamp(wp*words.length-i)*100}%`));
      if (pinned && performance.now() > serviceLockUntil && y > dimensions.expertiseTop-vh*.15 && y < dimensions.expertiseTop+dimensions.serviceTravel+vh*.1) {
        const sp = clamp((y-dimensions.expertiseTop)/dimensions.serviceTravel);
        const index = Math.min(3, Math.floor(sp*4));
        if(index!==active) selectService(index);
      }
      if(y+vh>dimensions.contactTop&&y<dimensions.contactTop+dimensions.contactHeight){const cp=(y+vh-dimensions.contactTop)/(vh+dimensions.contactHeight);$('.contact-backdrop img').style.transform=`translate3d(0,${(cp-.5)*100}px,0) scale(1.05)`;}
    } else words.forEach(w=>w.style.setProperty('--fill','100%'));
  }
  function requestRender(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  addEventListener('scroll', requestRender, {passive:true});
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,140);});
  function setMotion(enabled) {
    motion=enabled;root.classList.toggle('motion-enabled',motion);root.classList.toggle('no-motion',!motion);
    $('.motion-toggle').setAttribute('aria-pressed',String(motion));$('.motion-toggle span').textContent=motion?'on':'off';
    $('.motion-toggle').setAttribute('aria-label','Animations');
    if (!motion) {
      intro.style.visibility = 'visible';
      portal.style.zIndex = '2';
      portal.querySelector('img').style.transform = '';
      $('.portal-label').style.opacity = '';
      $('.contact-backdrop img').style.transform = '';
      $('.magnetic').forEach(el => el.style.transform = '');
    }
    measure();
  }
  $('.motion-toggle').addEventListener('click',()=>{setMotion(!motion);userMotion=motion?'on':'off';try{sessionStorage.setItem('white-stone-motion',userMotion);}catch{}});
  media.addEventListener('change', e=>{ if(userMotion===null)setMotion(!e.matches); });
  const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    const number=entry.target.querySelector('[data-count]');
    if(number&&motion){const target=Number(number.dataset.count),start=performance.now();const tick=time=>{const progress=clamp((time-start)/1400);number.textContent=String(Math.round(target*(1-Math.pow(1-progress,3))));if(progress<1&&motion)requestAnimationFrame(tick);else number.textContent=String(target);};requestAnimationFrame(tick);}
    revealObserver.unobserve(entry.target);
  }),{threshold:.12});
  $$('.reveal').forEach(el=>revealObserver.observe(el));
  $$('.value-grid article,.stats .stat,.team-member').forEach((el,i)=>el.style.setProperty('--delay',`${(i%3)*.09}s`));
  if(matchMedia('(hover:hover) and (pointer:fine)').matches){
    const halo=$('.cursor-halo');
    addEventListener('pointermove',e=>{if(!motion)return;pointerX=(e.clientX/innerWidth-.5)*2;pointerY=(e.clientY/innerHeight-.5)*2;halo.style.left=`${e.clientX}px`;halo.style.top=`${e.clientY}px`;halo.style.opacity='1';halo.classList.toggle('active',!!e.target.closest('a,button'));if(scrollY<sticky.offsetHeight)requestRender();},{passive:true});
    document.addEventListener('mouseleave',()=>{halo.style.opacity='0';});
    $$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{if(!motion)return;const r=el.getBoundingClientRect();el.style.transform=`translate3d(${(e.clientX-r.left-r.width/2)*.2}px,${(e.clientY-r.top-r.height/2)*.2}px,0)`;});el.addEventListener('pointerleave',()=>{el.style.transform='';});});
  }
  setMotion(motion);
  requestAnimationFrame(()=>root.classList.add('ready'));
  document.fonts.ready.then(measure);
  addEventListener('load',measure,{once:true});
})();
