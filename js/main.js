document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  $("#year").textContent = new Date().getFullYear();

  // Wave-bounce identity typography: each glyph moves as a coordinated 3D wave.
  function waveLetters(node) {
    if (!node || node.dataset.waveReady) return;
    const label = node.textContent.trim();
    node.dataset.waveReady = "true";
    node.setAttribute("aria-label", label);
    node.textContent = "";
    [...label].forEach((char, index) => {
      const glyph = document.createElement("span");
      glyph.className = "wave-glyph";
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = char === " " ? "\u00a0" : char;
      glyph.style.setProperty("--wave-i", index);
      node.append(glyph);
    });
  }
  waveLetters(document.querySelector(".hero-name"));
  const heroHeading = document.querySelector(".hero h1");
  if (heroHeading) {
    const parts = [...heroHeading.childNodes];
    heroHeading.innerHTML = "";
    parts.forEach(part => {
      if (part.nodeType === Node.TEXT_NODE) {
        const holder = document.createElement("span"); holder.className = "wave-word";
        holder.textContent = part.textContent.trim();
        if (holder.textContent) waveLetters(holder);
        heroHeading.append(holder, document.createTextNode(" "));
      } else if (part.nodeType === Node.ELEMENT_NODE) {
        const holder = document.createElement("span"); holder.className = "wave-word red";
        holder.textContent = part.textContent.trim(); waveLetters(holder); heroHeading.append(holder);
      }
    });
    heroHeading.setAttribute("aria-label", "CHAD FDEV");
  }

  // Context-aware 3D click feedback. This is visual feedback only; normal links/actions remain intact.
  const fxLayer = document.createElement("div");
  fxLayer.className = "interaction-fx-layer";
  fxLayer.setAttribute("aria-hidden", "true");
  document.body.append(fxLayer);
  const clickMeaning = el => {
    if (el.matches(".filter")) return {tag:`FILTER / ${el.textContent.trim().toUpperCase()}`, symbol:"⌕"};
    if (el.matches("[data-command]")) return {tag:`TERMINAL / ${el.dataset.command.toUpperCase()}`, symbol:"$_"};
    if (el.matches("#terminalForm button")) return {tag:"COMMAND / EXECUTE", symbol:"↵"};
    if (el.matches("#copyEmail")) return {tag:"CONTACT / COPY EMAIL", symbol:"✉"};
    if (el.matches("#menuToggle")) return {tag:"NAVIGATION / OPEN", symbol:"⌘"};
    if (el.matches("#introEnter,#introSkip")) return {tag:"SYSTEM / ACCESS GRANTED", symbol:"↗"};
    const href = el.getAttribute("href") || "";
    if (href.startsWith("#")) return {tag:`NAVIGATE / ${href.slice(1).replace(/-/g," ").toUpperCase()}`, symbol:"⟡"};
    if (href.startsWith("mailto:")) return {tag:"CONTACT / EMAIL", symbol:"✉"};
    if (href.startsWith("tel:")) return {tag:"CONTACT / CALL", symbol:"⌁"};
    if (href.includes("github")) return {tag:"EXTERNAL / GITHUB", symbol:"⌘"};
    if (href) return {tag:"EXTERNAL / OPEN LINK", symbol:"↗"};
    return {tag:`INTERACTION / ${(el.getAttribute("aria-label") || el.textContent || "SELECT").trim().slice(0,28).toUpperCase()}`, symbol:"✳"};
  };
  document.addEventListener("click", event => {
    const target = event.target.closest("a,button,[role='button']");
    if (!target || target.disabled || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = target.getBoundingClientRect();
    const fx = document.createElement("div");
    fx.className = "interaction-burst";
    fx.style.left = `${Math.max(58,Math.min(innerWidth-58,rect.left+rect.width/2))}px`;
    fx.style.top = `${Math.max(58,Math.min(innerHeight-58,rect.top+rect.height/2))}px`;
    const meaning = clickMeaning(target);
    const core = document.createElement("span"); core.className="burst-core"; core.textContent=meaning.symbol;
    const ring = document.createElement("i"); ring.className="burst-ring burst-ring-a";
    const ring2 = document.createElement("i"); ring2.className="burst-ring burst-ring-b";
    const label = document.createElement("b"); label.className="burst-label"; label.textContent=meaning.tag;
    const sparks = document.createElement("i"); sparks.className="burst-sparks";
    fx.append(ring,ring2,sparks,core,label); fxLayer.append(fx);
    window.setTimeout(()=>fx.remove(),1050);
    target.classList.remove("click-activated"); void target.offsetWidth; target.classList.add("click-activated");
    window.setTimeout(()=>target.classList.remove("click-activated"),520);
  }, true);

  // Mobile navigation
  const menu = $("#menuToggle"), nav = $("#mainNav");
  // The menu button is controlled by the cinematic radial navigation wheel below.
  menu.setAttribute("aria-expanded", "false");
  $$("#mainNav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open"); menu.setAttribute("aria-expanded","false"); menu.textContent="☰";
  }));

  // Full-page language translation using text keys.
  const language = $("#languageSelect");
  function setLanguage(code) {
    const dict = window.PORTFOLIO_TRANSLATIONS[code] || window.PORTFOLIO_TRANSLATIONS.en;
    document.documentElement.lang = code;
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key]) el.textContent = dict[key];
    });
    localStorage.setItem("chad-fdev-language", code);
  }
  const saved = localStorage.getItem("chad-fdev-language");
  if (saved && [...language.options].some(o => o.value === saved)) language.value = saved;
  setLanguage(language.value);
  language.addEventListener("change", () => setLanguage(language.value));

  // Interactive terminal: safe, local portfolio commands + animated output.
  const terminal = $("#terminalOutput"), terminalForm = $("#terminalForm"), terminalInput = $("#terminalInput");
  const commandMap = {
    whoami: ["Victor Dibie (CHAD FDEV)", "identity"],
    skills: ["Cybersecurity · Linux · Python · JavaScript · Web · AI · Git", "data"],
    "uname -a": ["CHAD-FDEV 6.0.0-kali #1 SMP x86_64 GNU/Linux · portfolio simulation", "data"],
    neofetch: ["CHAD FDEV\n────────────\nOS      Kali Linux\nHOST    chad-fdev.netlify.app\nROLE    Developer / Cybersecurity learner\nFOCUS   Ethical security · Software · AI\nBASE    Spain", "system"],
    projects: ["VECTOR TECH · VEC Scientific Calculator · VelvetTone · VECTOR AI", "data"],
    focus: ["Cybersecurity first. Software engineering, AI development and technology entrepreneurship.", "data"],
    github: ["github.com/vic-tech7", "data"],
    contact: ["vectordevtech@gmail.com · LinkedIn: victor-dibie-dev-tech", "data"],
    ls: ["about/  skills/  projects/  cybersecurity/  contact/  README.md", "data"],
    "cat focus.txt": ["Cybersecurity\nSoftware Engineering\nAI Development\nTechnology Entrepreneurship", "data"],
    pwd: ["/home/chad/portfolio", "data"],
    date: [new Date().toLocaleString(), "data"],
    clear: ["", "clear"],
    help: ["whoami · skills · uname -a · neofetch · projects · focus · github · contact · ls · cat focus.txt · pwd · date · clear · help", "data"]
  };
  const history = []; let historyIndex = 0;
  function runCommand(raw) {
    const cmd = raw.trim().toLowerCase(); if (!cmd) return;
    history.push(cmd); historyIndex = history.length;
    if (cmd === "clear") { terminal.innerHTML = '<p class="terminal-system-note">SESSION CLEARED // READY</p>'; return; }
    const result = commandMap[cmd] || [`command not found: ${cmd}\nType help to view available commands.`, "error"];
    const block = document.createElement("div"); block.className = "terminal-response";
    const prompt = document.createElement("p"); prompt.className = "terminal-command-line";
    const promptLabel = document.createElement("span"); promptLabel.className = "prompt"; promptLabel.textContent = "chad@kali:~$ ";
    const commandText = document.createElement("b"); commandText.textContent = cmd; prompt.append(promptLabel, commandText);
    const output = document.createElement("pre"); output.className = `terminal-output terminal-${result[1]}`; output.textContent = "";
    block.append(prompt, output); terminal.append(block); terminal.scrollTop = terminal.scrollHeight;
    const fullText = result[0]; let char = 0;
    function typeOutput(){char=Math.min(fullText.length,char+Math.max(2,Math.ceil(fullText.length/90)));output.textContent=fullText.slice(0,char);terminal.scrollTop=terminal.scrollHeight;if(char<fullText.length)requestAnimationFrame(typeOutput)}
    requestAnimationFrame(typeOutput);
    while (terminal.children.length > 18) terminal.firstElementChild.remove();
  }
  $$(".terminal-controls button").forEach(button => button.addEventListener("click", () => runCommand(button.dataset.command)));
  terminalForm?.addEventListener("submit", e => { e.preventDefault(); runCommand(terminalInput.value); terminalInput.value = ""; });
  terminalInput?.addEventListener("keydown", e => {
    if (e.key === "ArrowUp") { e.preventDefault(); historyIndex=Math.max(0,historyIndex-1); terminalInput.value=history[historyIndex]||""; }
    if (e.key === "ArrowDown") { e.preventDefault(); historyIndex=Math.min(history.length,historyIndex+1); terminalInput.value=history[historyIndex]||""; }
  });

  // Project filters
  $$(".filter").forEach(button => button.addEventListener("click", () => {
    $$(".filter").forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    const chosen = button.dataset.filter;
    $$(".project-card").forEach(card => {
      card.classList.toggle("hidden", chosen !== "all" && !card.dataset.category.split(" ").includes(chosen));
    });
  }));

  // Copy email action
  $("#copyEmail").addEventListener("click", async () => {
    const status = $("#copyStatus");
    try {
      await navigator.clipboard.writeText("vectordevtech@gmail.com");
      status.textContent = "Email copied: vectordevtech@gmail.com";
    } catch {
      status.textContent = "Email: vectordevtech@gmail.com";
    }
  });

  // Active navigation section
  const sections = $$("main section[id]");
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      $$("#mainNav a").forEach(a => a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`));
    }
  }), {rootMargin:"-35% 0px -55% 0px"});
  sections.forEach(section => observer.observe(section));
});

/* =========================================================
   CINEMATIC BOOT + INTERACTION ENGINE — FAIL-SAFE
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("introScreen");
  if (!intro) return;
  const $ = id => document.getElementById(id);
  const bootLines = $("bootLines"), ruleFill = $("introRuleFill");
  const welcome = $("introWelcome"), subtitle = $("introSubtitle");
  const enter = $("introEnter"), skip = $("introSkip");
  const transition = $("pageTransition"), clock = $("introClock");
  let finished = false, raf = 0;
  const timers = [];
  document.body.classList.add("intro-active");
  window.scrollTo(0,0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const messages = [
    "Powering CHAD FDEV interface...",
    "Verifying identity: VICTOR DIBIE...",
    "Loading cybersecurity workspace...",
    "Initializing development modules...",
    "Establishing secure visual channel...",
    "Rendering 3D environment layers...",
    "Projects and systems ready."
  ];
  const started = performance.now();
  function clockTick(){
    if(finished) return;
    const sec=Math.floor((performance.now()-started)/1000);
    if(clock) clock.textContent=`00:${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;
    raf=requestAnimationFrame(clockTick);
  }
  clockTick();

  function line(text){
    if(!bootLines) return;
    const p=document.createElement("p");
    p.innerHTML='<span class="boot-prompt">root@chad-fdev:~#</span> ';
    const t=document.createElement("span"); t.textContent=text+" ";
    const ok=document.createElement("span"); ok.className="boot-ok"; ok.textContent="[ OK ]";
    p.append(t,ok); bootLines.appendChild(p);
    while(bootLines.children.length>5) bootLines.firstElementChild.remove();
  }
  function revealAll(){
    messages.forEach(line);
    if(ruleFill) ruleFill.style.width="100%";
    welcome?.classList.add("show"); subtitle?.classList.add("show"); enter?.classList.add("show");
  }
  function finish(){
    if(finished) return;
    finished=true; timers.forEach(clearTimeout); cancelAnimationFrame(raf);
    transition?.classList.add("active");
    setTimeout(()=>{
      intro.classList.add("is-leaving");
      document.body.classList.remove("intro-active");
      document.body.classList.add("intro-complete");
      transition?.classList.remove("active");
      setTimeout(()=>intro.remove(),1250);
    },650);
  }
  enter?.addEventListener("click",finish);
  skip?.addEventListener("click",finish);
  // Always show the core immediately. No CSS animation or preference can leave a blank boot screen.
  intro.querySelector(".intro-core")?.style.setProperty("visibility","visible");
  intro.querySelector(".intro-core")?.style.setProperty("opacity","1");
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){
    revealAll();
    timers.push(setTimeout(finish,6500));
  } else {
    messages.forEach((m,i)=>timers.push(setTimeout(()=>{
      line(m); if(ruleFill) ruleFill.style.width=`${Math.round((i+1)/messages.length*100)}%`;
    },500+i*1150)));
    timers.push(setTimeout(()=>welcome?.classList.add("show"),8500));
    timers.push(setTimeout(()=>subtitle?.classList.add("show"),9500));
    timers.push(setTimeout(()=>enter?.classList.add("show"),10500));
    timers.push(setTimeout(finish,19000));
  }

  const canvas=$("introParticles");
  if(canvas){
    const ctx=canvas.getContext("2d");
    if(ctx){
      let particles=[];
      function resize(){
        const dpr=Math.min(devicePixelRatio||1,2);
        canvas.width=innerWidth*dpr; canvas.height=innerHeight*dpr;
        canvas.style.width=innerWidth+"px"; canvas.style.height=innerHeight+"px";
        ctx.setTransform(dpr,0,0,dpr,0,0);
        particles=Array.from({length:Math.min(100,Math.floor(innerWidth/9))},()=>({
          x:Math.random()*innerWidth,y:Math.random()*innerHeight,
          r:.5+Math.random()*1.5,v:.12+Math.random()*.35,a:.12+Math.random()*.35
        }));
      }
      function draw(){
        if(finished||document.hidden)return;
        ctx.clearRect(0,0,innerWidth,innerHeight);
        particles.forEach(p=>{
          p.y-=p.v;if(p.y<0)p.y=innerHeight;
          ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,55,95,${p.a})`;ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      resize();draw();window.addEventListener("resize",resize,{passive:true});
    }
  }
});

/* Depth tilt, reveal choreography, reading progress and cursor. */
document.addEventListener("DOMContentLoaded", () => {
  const finePointer = window.matchMedia("(pointer:fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const progress = document.getElementById("scrollProgress");
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`;
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, {passive:true});

  if (!reducedMotion) {
    document.body.classList.add("reveal-ready");
    const revealTargets = document.querySelectorAll(
      ".section-title,.about-panel,.terminal-panel,.skill-card,.project-card,.cyber-step,.ethics,.contact-panel"
    );
    revealTargets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 75}ms`;
    });
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.12});
    revealTargets.forEach(el => revealObserver.observe(el));

    if (finePointer) {
      document.querySelectorAll("[data-tilt-card],.skill-card,.project-card,.cyber-step").forEach(card => {
        card.addEventListener("pointermove", event => {
          const r = card.getBoundingClientRect();
          const x = (event.clientX - r.left) / r.width;
          const y = (event.clientY - r.top) / r.height;
          const ry = (x - .5) * 12;
          const rx = (.5 - y) * 10;
          card.style.setProperty("--mx", `${x*100}%`);
          card.style.setProperty("--my", `${y*100}%`);
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
        });
        card.addEventListener("pointerleave", () => { card.style.transform = ""; card.style.removeProperty("--mx"); card.style.removeProperty("--my"); });
      });
    }
  }

  if (finePointer) {
    const cursor = document.getElementById("customCursor");
    if (cursor) {
      document.body.classList.add("has-custom-cursor");
      window.addEventListener("pointermove", e => {
        cursor.style.left = e.clientX + "px";
        cursor.style.top = e.clientY + "px";
        cursor.style.transform = "translate(-50%,-50%)";
        cursor.classList.add("cursor-visible");
      }, {passive:true});
      document.querySelectorAll("a,button,select").forEach(el => {
        el.addEventListener("pointerenter", () => cursor.classList.add("cursor-hover"));
        el.addEventListener("pointerleave", () => cursor.classList.remove("cursor-hover"));
      });
    }
  }

  // Ambient scene gently follows pointer for a layered 3D feel.
  const scene = document.getElementById("ambientScene");
  if (scene && finePointer && !reducedMotion) {
    window.addEventListener("pointermove", e => {
      const x = (e.clientX / innerWidth - .5) * 12;
      const y = (e.clientY / innerHeight - .5) * 12;
      scene.style.transform = `translate3d(${x}px,${y}px,0)`;
    }, {passive:true});
  }
});


/* RADIAL COMMAND WHEEL — navigation and language selection */
document.addEventListener("DOMContentLoaded",()=>{
  const overlay=document.getElementById("radialOverlay");
  const menuBtn=document.getElementById("menuToggle");
  const langWrap=document.querySelector(".language-wrap");
  const language=document.getElementById("languageSelect");
  if(!overlay||!menuBtn||!language) return;
  const navItems=[...document.querySelectorAll("#mainNav a")].map(a=>({label:a.textContent.trim(),href:a.getAttribute("href"),icon:"↗"}));
  const languages=[...language.options].map(o=>({label:o.textContent.trim(),value:o.value,icon:o.textContent.trim().slice(0,4)}));
  let mode="menu";
  function close(){
    overlay.classList.remove("open");overlay.setAttribute("aria-hidden","true");
    setTimeout(()=>{overlay.innerHTML="";},450);
  }
  function open(which){
    mode=which;
    const items=which==="language"?languages:navItems;
    overlay.innerHTML="";
    const stage=document.createElement("div");stage.className="radial-stage";
    const center=document.createElement("div");center.className="radial-center";
    center.innerHTML=which==="language"?'◎<small>LANGUAGE</small>':'CF<small>CHAD FDEV</small>';
    stage.append(center);
    items.forEach((item,i)=>{
      const angle=(360/items.length)*i-90;
      const b=document.createElement("button");b.type="button";b.className="radial-choice";
      b.style.setProperty("--angle",angle+"deg");b.style.setProperty("--i",i);
      const icon=document.createElement("span");icon.className="choice-icon";icon.textContent=which==="language"?(item.value==="en"?"🇬🇧":item.value==="es"?"🇪🇸":item.value==="fr"?"🇫🇷":item.value==="de"?"🇩🇪":item.value==="pt"?"🇵🇹":"🇸🇦"):item.icon;
      const label=document.createElement("span");label.textContent=item.label;
      b.append(icon,label);
      b.addEventListener("click",()=>{
        if(which==="language"){
          language.value=item.value;
          language.dispatchEvent(new Event("change",{bubbles:true}));
        }else{
          const target=document.querySelector(item.href);
          target?.scrollIntoView({behavior:"smooth",block:"start"});
          document.querySelectorAll("#mainNav a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")===item.href));
        }
        close();
      });
      stage.append(b);
    });
    const x=document.createElement("button");x.type="button";x.className="radial-close";x.setAttribute("aria-label","Close chooser");x.textContent="×";x.addEventListener("click",close);stage.append(x);
    const caption=document.createElement("div");caption.className="radial-caption";caption.textContent=which==="language"?"SELECT YOUR LANGUAGE":"SELECT A DESTINATION";stage.append(caption);
    overlay.append(stage);overlay.setAttribute("aria-hidden","false");
    requestAnimationFrame(()=>overlay.classList.add("open"));
  }
  menuBtn.addEventListener("click",()=>open("menu"));
  langWrap?.addEventListener("click",e=>{e.preventDefault();open("language");});
  overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&overlay.classList.contains("open"))close();});
});

/* Pointer-following specular highlight for 3D cards */
document.addEventListener("pointermove",e=>{
  const card=e.target.closest?.(".panel,.skill-card,.project-card,.cyber-step");
  if(!card)return;
  const r=card.getBoundingClientRect();
  card.style.setProperty("--mx",`${((e.clientX-r.left)/r.width)*100}%`);
  card.style.setProperty("--my",`${((e.clientY-r.top)/r.height)*100}%`);
},{passive:true});


/* CHAD FDEV SIGNAL — scroll-pinned canvas environment and animated chapter */
document.addEventListener("DOMContentLoaded",()=>{
 const track=document.getElementById("signal"),stage=track?.querySelector(".signal-stage"),canvas=document.getElementById("signalCanvas"),word=document.getElementById("signalWord");
 if(!track||!stage||!canvas||!word)return;
 const ctx=canvas.getContext("2d",{alpha:false}),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const chapters=[["INITIALIZE","01 / SYSTEM ONLINE","Every mission begins with <em>intent.</em>","Set the signal. Establish the environment. Start with curiosity and a clear direction."],["RECON","02 / UNDERSTAND THE TERRAIN","Observe beyond the <em>surface.</em>","Explore how systems, networks, Linux and the web connect — understand before you act."],["ENGINEER","03 / BUILD THE SYSTEM","Turn concepts into <em>working systems.</em>","Write code, test assumptions, refine the details and ship useful technology."],["FORTIFY","04 / DEFENSE IN DEPTH","Think ahead. <em>Secure by design.</em>","Build security knowledge through ethical practice, authorized labs and responsible methods."],["DEPLOY","05 / MAKE IT REAL","Move ideas into <em>the real world.</em>","CHAD FDEV. Victor Dibie. Founder of VECTOR TECH. Keep learning. Keep building."]];
 const caption=stage.querySelector(".signal-caption"),idx=stage.querySelector("#signalIndex"),side=[...stage.querySelectorAll(".signal-side-index b")],progress=stage.querySelector("#signalProgress"),thumb=stage.querySelector("#signalScrollThumb"),core=document.getElementById("signalCore");
 let w=1,h=1,dpr=1,target=0,current=0,px=0,py=0,mx=0,my=0,last=0,raf=0;
 const particles=Array.from({length:90},()=>({x:Math.random(),y:Math.random(),z:.15+Math.random()*.85,r:.4+Math.random()*1.8,p:Math.random()*Math.PI*2}));
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{x=clamp((x-a)/(b-a));return x*x*(3-2*x)};
 function resize(){dpr=Math.min(devicePixelRatio||1,2);w=stage.clientWidth;h=stage.clientHeight;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function read(){const r=track.getBoundingClientRect();target=clamp(-r.top/(track.offsetHeight-innerHeight||1))}
 function draw(t){
  const sec=t/1000;ctx.clearRect(0,0,w,h);const bg=ctx.createRadialGradient(w*.5,h*.48,0,w*.5,h*.48,Math.max(w,h)*.72);bg.addColorStop(0,"#210913");bg.addColorStop(.48,"#10070d");bg.addColorStop(1,"#050509");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.translate(w/2,h*.56);ctx.strokeStyle="rgba(255,48,91,.13)";ctx.lineWidth=.7;
  for(let i=-16;i<=16;i++){const x=i*34;ctx.beginPath();ctx.moveTo(x,-h*.2);ctx.lineTo(x*2.9,h*.54);ctx.stroke()}
  for(let i=0;i<18;i++){const y=Math.pow(i/17,1.8)*h*.62;ctx.beginPath();ctx.moveTo(-w*.85,y-h*.13);ctx.lineTo(w*.85,y-h*.13);ctx.stroke()}ctx.restore();
  for(const p of particles){const x=((p.x*w+sec*9*p.z)%w+w)%w,y=p.y*h+Math.sin(sec*.45+p.p)*13*p.z;ctx.fillStyle=`rgba(255,${90+Math.floor(p.z*70)},${125+Math.floor(p.z*70)},${.2+p.z*.55})`;ctx.beginPath();ctx.arc(x,y,p.r*p.z,0,Math.PI*2);ctx.fill()}
  for(let i=0;i<9;i++){const x=i/8*w;ctx.strokeStyle=`rgba(255,49,91,${.04+.05*Math.sin(sec*.7+i)})`;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+Math.sin(sec+i)*22,h);ctx.stroke()}
  ctx.save();ctx.translate(w/2+mx*13,h*.48+my*10);ctx.rotate(sec*.08);const pulse=1+Math.sin(sec*1.25)*.025;
  for(let k=0;k<3;k++){ctx.beginPath();ctx.ellipse(0,0,Math.min(w,h)*(.17+k*.055)*pulse,Math.min(w,h)*(.07+k*.023),k*.55+sec*.025,0,Math.PI*2);ctx.strokeStyle=`rgba(255,${65+k*35},${105+k*30},${.36-k*.08})`;ctx.lineWidth=1;ctx.shadowBlur=18;ctx.shadowColor="#ff1748";ctx.stroke()}ctx.restore();
  const scan=(sec*.12%1)*h,beam=ctx.createLinearGradient(0,scan-50,0,scan+50);beam.addColorStop(0,"transparent");beam.addColorStop(.5,"rgba(255,49,91,.10)");beam.addColorStop(1,"transparent");ctx.fillStyle=beam;ctx.fillRect(0,scan-50,w,100);
 }
 function update(t){
  last=t;current+=(target-current)*(reduce?1:.085);mx+=(px-mx)*.045;my+=(py-my)*.045;
  const step=current*4,i=Math.min(4,Math.floor(step)),f=step-i,fade=Math.sin(Math.PI*clamp(f)),ch=chapters[i];
  word.textContent=ch[0];word.style.opacity=String(.72+fade*.28);word.style.transform=`translate(-50%,-50%) translate3d(${(1-f)*(i%2?1:-1)*w*.08}px,${Math.sin(t*.0006)*8}px,0) rotateX(${my*4}deg) rotateY(${mx*5}deg) scale(${.88+fade*.18})`;
  core.style.transform=`translate(-50%,-50%) translate3d(${mx*18}px,${my*14}px,0) rotateX(${my*8}deg) rotateY(${mx*10}deg) scale(${1+Math.sin(t*.0009)*.025+current*.12})`;
  caption.querySelector(".signal-kicker").textContent=ch[1];caption.querySelector("h2").innerHTML=ch[2];caption.querySelector("p").textContent=ch[3];idx.textContent=`0${i+1} — 05`;side.forEach((el,k)=>el.classList.toggle("is-active",k===i));
  progress.style.width=`${current*100}%`;thumb.style.transform=`translateX(${current*700}%)`;draw(t);raf=requestAnimationFrame(update);
 }
 resize();read();addEventListener("resize",resize,{passive:true});addEventListener("scroll",read,{passive:true});addEventListener("pointermove",e=>{px=e.clientX/innerWidth*2-1;py=e.clientY/innerHeight*2-1},{passive:true});
 if(!reduce)raf=requestAnimationFrame(update);else{draw(0);caption.querySelector(".signal-kicker").textContent=chapters[0][1]}
 document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)raf=requestAnimationFrame(update)});
});


/* Portrait micro-particle field — motion stays clipped to the image frame. */
document.addEventListener("DOMContentLoaded",()=>{
 const canvas=document.getElementById("portraitParticles"),frame=canvas?.parentElement;if(!canvas||!frame)return;
 const ctx=canvas.getContext("2d"),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!ctx)return;
 let w=1,h=1,dpr=1,raf=0;const dots=Array.from({length:42},()=>({x:Math.random(),y:Math.random(),r:.5+Math.random()*1.4,v:.08+Math.random()*.22,a:.15+Math.random()*.45}));
 function resize(){const r=frame.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=r.width;h=r.height;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0)}
 function draw(t){ctx.clearRect(0,0,w,h);dots.forEach((p,i)=>{p.y-=p.v*.0018;if(p.y<0)p.y=1;const x=p.x*w+Math.sin(t*.00035+i)*8,y=p.y*h;ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,${70+i%70},${100+i%90},${p.a})`;ctx.fill()});if(!reduce)raf=requestAnimationFrame(draw)}
 resize();if(!reduce)raf=requestAnimationFrame(draw);else draw(0);addEventListener("resize",resize,{passive:true});document.addEventListener("visibilitychange",()=>{if(document.hidden)cancelAnimationFrame(raf);else if(!reduce)raf=requestAnimationFrame(draw)});
});

/* Keep the cursor's micro-cross inside the circular reticle. */
document.addEventListener("DOMContentLoaded",()=>{const cursor=document.getElementById("customCursor");if(!cursor)return;cursor.setAttribute("aria-hidden","true");document.querySelectorAll("a,button,select,[role=button]").forEach(el=>{el.addEventListener("pointerenter",()=>cursor.classList.add("cursor-hover"));el.addEventListener("pointerleave",()=>cursor.classList.remove("cursor-hover"))})});
