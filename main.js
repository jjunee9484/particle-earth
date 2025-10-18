// Simple Perlin Noise
function perlin2D(x, y) {
  function fade(t){ return t*t*t*(t*(t*6-15)+10); }
  function lerp(a,b,t){ return a + t*(b-a); }
  function grad(hash, x, y){
    switch(hash & 3){
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      case 3: return -x - y;
      default: return 0;
    }
  }
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const p = [];
  for(let i=0;i<256;i++) p[i]=i;
  for(let i=0;i<256;i++){ let j=Math.floor(Math.random()*256); [p[i],p[j]]=[p[j],p[i]]; }
  const aa = p[(p[xi]+yi)&255];
  const ab = p[(p[xi]+yi+1)&255];
  const ba = p[(p[xi+1]+yi)&255];
  const bb = p[(p[xi+1]+yi+1)&255];
  const u = fade(xf);
  const v = fade(yf);
  const x1 = lerp(grad(aa,xf,yf), grad(ba,xf-1,yf), u);
  const x2 = lerp(grad(ab,xf,yf-1), grad(bb,xf-1,yf-1), u);
  return (lerp(x1,x2,v)+1)/2;
}

(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth, H = canvas.height = innerHeight;
  let center = {x: W/2, y:H/2};
  let mouse = {x:center.x, y:center.y, down:false};

  window.addEventListener('resize', ()=>{ 
    W=canvas.width=innerWidth; H=canvas.height=innerHeight; center={x:W/2,y:H/2};
  });
  window.addEventListener('mousedown', ()=>{mouse.down=true;});
  window.addEventListener('mouseup', ()=>{mouse.down=false;});
  window.addEventListener('mousemove', e=>{mouse.x=e.clientX; mouse.y=e.clientY;});

  const particleConfig = { count:1000, minSize:0.1, maxSize:2, speedMin:0.001, speedMax:0.004, orbitRadius:200, waveAmplitude:5, continentThreshold:0.45, noiseFactor:8 };
  const freeParticleConfig = { count:800, minRadius:50, maxRadius:particleConfig.orbitRadius*1.2, amplitudeMin:15, amplitudeMax:30, sizeMin:0.5, sizeMax:1.5, speedMin:0.001, speedMax:0.004 };
  const connectionConfig = { distance:6, pulse:1.5 };
  const renderConfig = { bgFade:0.8, color:'rgba(120,255,140,1)', auroraStrength:1.5, mouseFactor:1 };

  let particles = [], freeParticles = [];

  function randomRange(min,max){return min + Math.random()*(max-min);}

  function initParticles(){
    particles = [];
    let attempts=0;
    while(particles.length < particleConfig.count && attempts < particleConfig.count*10){
      attempts++;
      const phi=Math.random()*Math.PI;
      const theta=Math.random()*Math.PI*2;
      const nLarge=(Math.sin(theta*3+phi*2)*0.5+0.5);
      const nSmall=perlin2D(theta*5,phi*5);
      const n=(nLarge*0.7+nSmall*0.3);
      if(n>=particleConfig.continentThreshold){
        particles.push({
          theta, phi,
          size:particleConfig.minSize + (particleConfig.maxSize-particleConfig.minSize)*n,
          brightness:0.7+Math.random()*0.15,
          speed:particleConfig.speedMin + Math.random()*(particleConfig.speedMax-particleConfig.speedMin),
          wavePhase:Math.random()*Math.PI*2,
          phiSpeed:(Math.random()-0.5)*0.0005,
          clusterOffset:Math.sin(theta*3+phi*5)*particleConfig.noiseFactor*n,
          noiseVal:n,
          x:center.x, y:center.y,
          easeX:0.02+Math.random()*0.1,
          easeY:0.02+Math.random()*0.1,
          wiggle:0.5+Math.random()*1.5,
          mousePull:0.12+Math.random()*0.05
        });
      }
    }

    freeParticles = [];
    for(let i=0;i<freeParticleConfig.count;i++){
      const phi=Math.random()*Math.PI;
      const theta=Math.random()*Math.PI*2;
      const radius=randomRange(freeParticleConfig.minRadius,freeParticleConfig.maxRadius);
      freeParticles.push({
        phi, theta, radius,
        speed: randomRange(freeParticleConfig.speedMin, freeParticleConfig.speedMax),
        phase: Math.random()*Math.PI*2,
        amplitude: randomRange(freeParticleConfig.amplitudeMin,freeParticleConfig.amplitudeMax),
        size: randomRange(freeParticleConfig.sizeMin,freeParticleConfig.sizeMax),
        x:center.x, y:center.y,
        easeX:0.02+Math.random()*0.1,
        easeY:0.02+Math.random()*0.1,
        wiggle:0.5+Math.random()*1.5,
        mousePull:0.12+Math.random()*0.05
      });
    }
  }

  function updateParticlesProps() {
    particles.forEach(p => {
      const nLarge = (Math.sin(p.theta * 3 + p.phi * 2) * 0.5 + 0.5);
      const nSmall = perlin2D(p.theta * 5, p.phi * 5);
      const n = (nLarge * 0.7 + nSmall * 0.3);
      p.noiseVal = n;
      p.clusterOffset = Math.sin(p.theta * 3 + p.phi * 5) * particleConfig.noiseFactor * n;
      const fadeRange = 0.1;
      const fadeStart = particleConfig.continentThreshold - fadeRange;
      let fade = (n - fadeStart) / fadeRange;
      fade = Math.min(Math.max(fade, 0), 1);
      fade = fade * fade * (3 - 2 * fade);
      fade *= 0.85 + 0.15 * Math.random();
      const fadeMin = 0.2;
      fade = fadeMin + (1 - fadeMin) * fade;
      p.size = (particleConfig.minSize + (particleConfig.maxSize - particleConfig.minSize) * n) * fade;
      p.brightness = (0.7 + Math.random() * 0.15) * fade;
    });

    freeParticles.forEach(f => {
      f.size = randomRange(freeParticleConfig.sizeMin, freeParticleConfig.sizeMax);
      f.speed = randomRange(freeParticleConfig.speedMin, freeParticleConfig.speedMax);
      f.amplitude = randomRange(freeParticleConfig.amplitudeMin, freeParticleConfig.amplitudeMax);
      f.radius = randomRange(freeParticleConfig.minRadius, freeParticleConfig.maxRadius);
    });
  }

  const gui = new dat.GUI();
  const particleFolder = gui.addFolder('Particle Config');
  particleFolder.add(particleConfig,'count',0,2000,10).onFinishChange(initParticles);
  particleFolder.add(particleConfig,'minSize',0.05,5,0.05).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'maxSize',0.05,5,0.05).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'speedMin',0,0.15,0.0001).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'speedMax',0,0.15,0.0001).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'waveAmplitude',0,50,0.1).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'continentThreshold',0,1,0.01).onChange(updateParticlesProps);
  particleFolder.add(particleConfig,'noiseFactor',0,40,0.1).onChange(updateParticlesProps);
  particleFolder.open();

  const freeFolder = gui.addFolder('Free Particle Config');
  freeFolder.add(freeParticleConfig,'count',0,1000,10).onFinishChange(initParticles);
  freeFolder.add(freeParticleConfig,'minRadius',0,400,1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'maxRadius',0,400,1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'amplitudeMin',0,50,1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'amplitudeMax',0,50,1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'sizeMin',0.1,5,0.1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'sizeMax',0.1,5,0.1).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'speedMin',0,0.15,0.0001).onChange(updateParticlesProps);
  freeFolder.add(freeParticleConfig,'speedMax',0,0.15,0.0001).onChange(updateParticlesProps);
  freeFolder.add(renderConfig,'auroraStrength',0,30,0.05).onChange(updateParticlesProps);
  freeFolder.open();

  const connectionFolder = gui.addFolder('Connection Config');
  connectionFolder.add(connectionConfig,'distance',0,50,0.5);
  connectionFolder.add(connectionConfig,'pulse',0,10,0.05);
  connectionFolder.open();

  const renderFolder = gui.addFolder('Render Config');
  renderFolder.add(renderConfig,'bgFade',0,1,0.01);
  renderFolder.add(renderConfig,'mouseFactor',0,10,1);
  renderFolder.addColor(renderConfig,'color').name('Particle Color');
  renderFolder.open();

  function drawParticles(arr){
    arr.forEach(p=>{
      ctx.beginPath();
      ctx.fillStyle = renderConfig.color.replace('1)', `${p.brightness*0.7 || 1})`);
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fill();
    });
  }

  function drawConnections(arr){
    for(let i=0;i<arr.length;i++){
      for(let j=i+1;j<arr.length;j++){
        const dx=arr[i].x-arr[j].x, dy=arr[i].y-arr[j].y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<connectionConfig.distance){
          const pulse=(Math.sin(Date.now()*0.005+dist)*0.5+0.5)*connectionConfig.pulse;
          const color=renderConfig.color.replace(/rgba?\(([^,]+),([^,]+),([^,]+),?[^)]*\)/, `rgba($1,$2,$3,${pulse*0.2})`);
          ctx.strokeStyle=color;
          ctx.lineWidth=0.3;
          ctx.beginPath();
          ctx.moveTo(arr[i].x,arr[i].y);
          ctx.lineTo(arr[j].x,arr[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function loop(){
    ctx.fillStyle=`rgba(0,0,0,${renderConfig.bgFade})`;
    ctx.fillRect(0,0,W,H);
    const t=Date.now()*0.001;

    function update(p){
      p.theta += p.speed;
      p.phi += p.phiSpeed||0;
      const wave = Math.sin(t*2+p.wavePhase||0) * particleConfig.waveAmplitude;
      const r = (p.radius||particleConfig.orbitRadius) + wave + (p.clusterOffset||0);
      let targetX = r*Math.sin(p.phi)*Math.cos(p.theta) + center.x + Math.sin(t*p.wiggle)*2;
      let targetY = r*Math.cos(p.phi) + center.y + Math.cos(t*p.wiggle)*2;
      if(mouse.down){
        targetX += (mouse.x - targetX) * p.mousePull * renderConfig.mouseFactor;
        targetY += (mouse.y - targetY) * p.mousePull * renderConfig.mouseFactor;
      }
      p.x += (targetX - p.x) * p.easeX;
      p.y += (targetY - p.y) * p.easeY;
    }

    particles.forEach(update);
    freeParticles.forEach(f=>{
      const flowX = perlin2D(f.theta*3+t*0.2,f.phi*3)-0.5;
      const flowY = perlin2D(f.theta*3,f.phi*3+t*0.2)-0.5;
      f.theta += f.speed*0.5 + flowX*renderConfig.auroraStrength*0.01;
      f.phi += flowY*renderConfig.auroraStrength*0.01;
      update(f);
    });

    drawParticles(particles);
    drawParticles(freeParticles);
    drawConnections(particles.concat(freeParticles));

    requestAnimationFrame(loop);
  }

  initParticles();
  loop();

})();
