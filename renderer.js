import {raycast,TEAM_COLORS,clamp,angleDiff} from './game.js';

// All art is original, generated locally once. No asset downloads or network dependency.
const TAU=Math.PI*2;
const HIP_FOV=1.12;
// Optical magnification uses focal length, so targets scale by the stated ratio.
export function cameraView(kit,aim=0){const amount=clamp(aim,0,1),power=kit==='marksman'?4:kit==='carbine'?1.45:1.2,magnification=1+(power-1)*amount;return {fov:2*Math.atan(Math.tan(HIP_FOV/2)/magnification),magnification,scoped:kit==='marksman'&&amount>.92};}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fill();}
function panel(c,x,y,w,h,color,edge='#0d2029'){c.fillStyle=color;c.fillRect(x,y,w,h);c.strokeStyle=edge;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);}
function material(type){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');c.fillStyle=type===1?'#728080':type===2?'#a77b4d':'#506f65';c.fillRect(0,0,128,128);let seed=type*12345;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<2400;i++){c.fillStyle=rand()>.5?'#ffffff0a':'#0718210c';c.fillRect(rand()*128,rand()*128,1+rand()*3,1+rand()*3);}
 if(type===1){for(let y=0;y<128;y+=24){c.fillStyle='#354b4e';c.fillRect(0,y,128,2);for(let x=(y/24%2)*32-64;x<128;x+=64)c.fillRect(x,y,2,24);}c.fillStyle='#d2c3a522';c.fillRect(0,0,128,5);for(let i=0;i<18;i++){c.fillStyle='#293d3f33';c.fillRect(rand()*128,rand()*100+16,rand()*3+1,rand()*25);}}
 if(type===2){for(let y=0;y<128;y+=24){c.fillStyle='#4e412f';c.fillRect(0,y,128,3);c.fillStyle='#e1b98466';c.fillRect(0,y+3,128,1);}for(const x of [8,112]){c.fillStyle='#594b3b';c.fillRect(x,0,8,128);for(let y=10;y<128;y+=24)ellipse(c,x+4,y,2,2,'#d8b687');}c.save();c.translate(64,64);c.rotate(-.15);panel(c,-22,-20,44,38,'#d4c3a0');c.fillStyle='#403d32';c.font='bold 8px monospace';c.textAlign='center';c.fillText('YARD',0,-5);c.fillText('SUPPLY',0,6);c.fillRect(-12,11,24,2);c.restore();}
 if(type===3){for(let x=0;x<128;x+=8){c.fillStyle='#233f3b55';c.fillRect(x,0,3,128);c.fillStyle='#94a69855';c.fillRect(x+3,0,1,128);}for(const y of [5,118]){c.fillStyle='#213f3d';c.fillRect(0,y,128,5);for(let x=8;x<128;x+=24)ellipse(c,x,y+2,1.6,1.6,'#b5bbb1');}panel(c,25,35,78,39,'#e0d2a8');c.fillStyle='#30443e';c.font='bold 9px monospace';c.textAlign='center';c.fillText('LANG YARD',64,49);c.font='7px monospace';c.fillText('AUTHORISED CHAOS',64,62);}
 return canvas;}
export class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.buffer=document.createElement('canvas');this.buffer.width=800;this.buffer.height=450;this.c=this.buffer.getContext('2d',{alpha:false});this.z=new Float32Array(800);this.flash=0;this.hit=0;this.hurt=0;this.walk=0;this.pitch=0;this.motion=0;this.aim=0;this.recoil=0;this.lastAmmo=null;this.lastGame=null;this.casings=[];this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.materials=[null,material(1),material(2),material(3)];this.lastPlayer=null;}
 get lookScale(){return 1/cameraView(this.lastGame?.kit,this.aim).magnification;}
 resize(){
  const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight),aspect=w/h;
  // Preserve the viewport aspect and bound work in both portrait and landscape.
  const outputScale=Math.min(1,1920/w,1080/h);
  this.canvas.width=Math.max(1,Math.round(w*outputScale));this.canvas.height=Math.max(1,Math.round(h*outputScale));
  const quality=this.quality||'auto',target=quality==='low'?480:quality==='high'?960:w<700?560:800;
  const pixelBudget=quality==='low'?160000:quality==='high'?620000:360000;
  this.buffer.width=Math.max(1,Math.round(Math.min(target,w,Math.sqrt(pixelBudget*aspect))));
  this.buffer.height=Math.max(1,Math.round(this.buffer.width/aspect));
  this.z=new Float32Array(this.buffer.width);
 }
 // Paint on the ground plane before walls: capture markings remain naturally occluded.
 zone(c,w,h,horizon,p,projection,g){
  const project=(x,y)=>{const dx=x-p.x,dy=y-p.y,depth=dx*Math.cos(p.a)+dy*Math.sin(p.a);if(depth<.18)return null;return [w/2+(-dx*Math.sin(p.a)+dy*Math.cos(p.a))*projection/depth,horizon+projection*.46/depth];};
  const color=g.owner<0?'#ead69a':TEAM_COLORS[g.owner];
  c.save();c.beginPath();c.rect(0,horizon,w,h-horizon);c.clip();
  for(let i=0;i<72;i++){
   if(i%6===5)continue;
   const a=i*TAU/72,b=(i+1)*TAU/72,points=[[14+Math.cos(a)*3.9,14+Math.sin(a)*3.9],[14+Math.cos(b)*3.9,14+Math.sin(b)*3.9],[14+Math.cos(b)*4.05,14+Math.sin(b)*4.05],[14+Math.cos(a)*4.05,14+Math.sin(a)*4.05]].map(([x,y])=>project(x,y));
   if(points.every(Boolean)){c.globalAlpha=.55;polygon(c,points,color);}
  }
  c.globalAlpha=.32;
  for(const [x,y]of [[12.5,14],[15.5,14],[14,12.5],[14,15.5]]){const points=[[x-.13,y-.13],[x+.13,y-.13],[x+.13,y+.13],[x-.13,y+.13]].map(([x,y])=>project(x,y));if(points.every(Boolean))polygon(c,points,color);}
  c.restore();
 }
 // At most one recent shot and one damage bearing are retained by the simulation.
 combat(c,w,h,horizon,projection,g){
  const shot=g.lastShot,p=g.player,age=shot?g.time-shot.time:Infinity;
  if(shot&&age>=0&&age<.24&&!p.dead){
   if(this.effectShot!==shot){
    this.effectShot=shot;
    const wall=raycast(g.map,shot.x,shot.y,shot.a,32);
    const targetDistance=shot.hit&&shot.target?Math.hypot(shot.target.x-shot.x,shot.target.y-shot.y):Infinity;
    this.effectDistance=Math.max(.1,Math.min(wall.distance-.015,targetDistance,32));this.effectHasImpact=shot.hit||wall.tile!==0;
   }
   const distance=this.effectDistance,dx=Math.cos(shot.a),dy=Math.sin(shot.a);
   const project=(t)=>{const muzzle=(1-this.aim)*.1*Math.max(0,1-t/2),x=shot.x+dx*t-dy*muzzle-p.x,y=shot.y+dy*t+dx*muzzle-p.y,depth=x*Math.cos(p.a)+y*Math.sin(p.a);if(depth<.18)return null;const height=.46+Math.tan(shot.pitch||0)*t-.14*Math.max(0,1-t/2);return {x:w/2+(-x*Math.sin(p.a)+y*Math.cos(p.a))*projection/depth,y:horizon+(.46-height)*projection/depth,depth};};
   const impact=project(distance);
   c.save();
   // A short, sampled streak follows the actual shot ray and is clipped by wall depth.
   if(!this.reduced&&age<.09){
    c.globalAlpha=(1-age/.09)*.55;c.strokeStyle='#ffe3a2';c.lineWidth=Math.max(1,w/800);c.lineCap='round';
    let previous=null;
    for(let n=0;n<=20;n++){
     const point=project(Math.max(.22,distance*(.12+n*.88/20)));
     if(point&&point.x>=0&&point.x<w&&point.depth<=this.z[Math.floor(point.x)]+.08){
      if(previous){c.beginPath();c.moveTo(previous.x,previous.y);c.lineTo(point.x,point.y);c.stroke();}previous=point;
     }else previous=null;
    }
   }
   if(this.effectHasImpact&&impact&&impact.x>=0&&impact.x<w&&impact.depth<=this.z[Math.floor(impact.x)]+.12){
    const radius=clamp(projection/impact.depth*.035,1.4,5),fade=1-age/.24;
    c.globalAlpha=this.reduced?.65:fade;c.strokeStyle=shot.hit?'#ffc482':'#eadbb3';c.fillStyle=shot.hit?'#ffe5bc':'#37433c';c.lineWidth=1;
    c.beginPath();c.arc(impact.x,impact.y,radius,0,TAU);c.fill();c.stroke();
    if(!this.reduced){for(let n=0;n<4;n++){const a=n*TAU/4+.4,r=radius*(1+age*8);c.beginPath();c.moveTo(impact.x+Math.cos(a)*r,impact.y+Math.sin(a)*r);c.lineTo(impact.x+Math.cos(a)*(r+radius),impact.y+Math.sin(a)*(r+radius));c.stroke();}}
   }
   c.restore();
  }
 }
 incoming(c,w,h,g){
  const damage=g.lastDamage,age=damage?g.time-damage.time:Infinity;
  if(!damage||age<0||age>1.1||g.player.dead)return;
  const bearing=angleDiff(damage.angle,g.player.a)-Math.PI/2,r=Math.min(w,h)*.19;
  c.save();c.translate(w/2,h/2);c.globalAlpha=this.reduced?.85:clamp((1.1-age)*1.8,0,1);
  c.strokeStyle='#ffad8b';c.lineWidth=Math.max(3,w*.004);c.lineCap='round';c.beginPath();c.arc(0,0,r,bearing-.32,bearing+.32);c.stroke();
  c.rotate(bearing);polygon(c,[[r+10,0],[r+18,-4],[r+18,4]],'#ffad8b','#6b302c');c.restore();
 }
 sky(c,w,h,horizon,p){const grad=c.createLinearGradient(0,0,0,Math.max(1,horizon));grad.addColorStop(0,'#254655');grad.addColorStop(.65,'#91a5a2');grad.addColorStop(1,'#e6cda0');c.fillStyle=grad;c.fillRect(0,0,w,h);const sun=w*.5+angleDiff(-.8,p.a)*w*.6;const glow=c.createRadialGradient(sun,horizon*.48,2,sun,horizon*.48,w*.42);glow.addColorStop(0,'#ffe9b382');glow.addColorStop(.15,'#f6dab333');glow.addColorStop(1,'#edd9ad00');c.fillStyle=glow;c.fillRect(0,0,w,horizon);ellipse(c,sun,horizon*.48,9,9,'#ffe8b4');
 for(let l=0;l<2;l++){c.beginPath();c.moveTo(0,horizon);for(let x=0;x<=w+12;x+=12){const t=x/w*5+p.a*.8;c.lineTo(x,horizon-(Math.sin(t*2+l)*10+Math.sin(t*6+2)*7+24)*(l?1:1.6));}c.lineTo(w,horizon+5);c.fillStyle=l?'#7d8c7c':'#6a8381';c.fill();}
 // Industrial skyline scrolls with heading, behind the playable geometry.
 for(let i=-3;i<15;i++){const x=((i*119-p.a*85)%(w+180)+(w+180))%(w+180)-90;const y=horizon-25-(i%3)*9;c.fillStyle='#556e6c';c.fillRect(x,y,30,40);c.fillRect(x+5,y-15,4,18);c.fillRect(x+26,y-33,3,36);c.fillRect(x+8,y-32,44,2);c.beginPath();c.moveTo(x+8,y-32);c.lineTo(x+27,y-48);c.lineTo(x+52,y-32);c.strokeStyle='#556e6c';c.lineWidth=1;c.stroke();}}
 floor(c,w,h,horizon,p,projection){const grad=c.createLinearGradient(0,horizon,0,h);grad.addColorStop(0,'#b8aa8c');grad.addColorStop(1,'#62675d');c.fillStyle=grad;c.fillRect(0,horizon,w,h);const slope=w/(2*projection),leftX=Math.cos(p.a)+Math.sin(p.a)*slope,leftY=Math.sin(p.a)-Math.cos(p.a)*slope,rightX=Math.cos(p.a)-Math.sin(p.a)*slope,rightY=Math.sin(p.a)+Math.cos(p.a)*slope;
 // Coarse perspective floor samples keep texture anchored in the world while moving.
 const step=this.quality==='low'?8:this.quality==='high'?4:6;for(let y=Math.max(0,Math.floor(horizon+2));y<h;y+=step){const depth=projection*.46/(y-horizon);if(depth>34)continue;for(let x=0;x<w;x+=step){const t=x/w,wx=p.x+(leftX+(rightX-leftX)*t)*depth,wy=p.y+(leftY+(rightY-leftY)*t)*depth;const u=((wx%1)+1)%1,v=((wy%1)+1)%1;let col=null;if(u<.025||v<.025)col='#182e2b20';if(Math.abs(wx-14)<.055||Math.abs(wy-14)<.055)col='#e2c78555';if((Math.floor(wx*9+wy*7)%13+13)%13===0)col='#d7c7a616';if(col){c.fillStyle=col;c.fillRect(x,y,step,step);}}}}
 draw(g,dt,active){const c=this.c,w=this.buffer.width,h=this.buffer.height,p=g.player;if(this.lastGame!==g){this.lastGame=g;this.lastAmmo=g.ammo;this.casings=[];this.recoil=0;this.lastPlayer=null;this.motion=0;this.aim=0;this.pitch=0;this.effectShot=null;}const pos=this.lastGame===g?this.lastPlayer:null;const moved=pos?Math.hypot(p.x-pos.x,p.y-pos.y):0;this.lastPlayer={x:p.x,y:p.y};this.motion+=(Math.min(1,moved/Math.max(.001,dt)/2.7)-this.motion)*Math.min(1,dt*10);this.walk+=dt*(this.motion>.1?8:1.7);this.flash=Math.max(0,this.flash-dt);this.hit=Math.max(0,this.hit-dt);this.hurt=Math.max(0,this.hurt-dt);this.recoil=Math.max(0,this.recoil-dt*7);if(this.lastAmmo!==null&&g.ammo<this.lastAmmo){this.recoil=1;if(!this.reduced)this.casings.push({x:0,y:0,t:0});}this.lastAmmo=g.ammo;for(const shell of this.casings){shell.t+=dt;shell.x+=dt*170;shell.y+=dt*(-120+shell.t*650);}this.casings=this.casings.filter(s=>s.t<.65);
 this.aim=this.reduced?(g.aiming?1:0):this.aim+((g.aiming?1:0)-this.aim)*(1-Math.exp(-Math.max(0,dt)*32));const aim=this.aim,view=cameraView(g.kit,aim),FOV=view.fov,projection=w/(2*Math.tan(FOV/2)),bob=this.reduced||g.aiming?0:Math.sin(this.walk*2)*this.motion*1.2*(1-aim),horizon=h*.5+Math.tan(p.pitch||0)*projection+bob;this.sky(c,w,h,horizon,p);this.floor(c,w,h,horizon,p,projection);this.zone(c,w,h,horizon,p,projection,g);
 c.imageSmoothingEnabled=false;for(let x=0;x<w;x++){const offset=Math.atan((x-w/2)/projection),r=raycast(g.map,p.x,p.y,p.a+offset),d=Math.max(.1,r.distance*Math.cos(offset));this.z[x]=d;const height=projection/d,top=horizon-height*.54,bottom=horizon+height*.46,u=((r.side?r.x:r.y)%1+1)%1;const tex=this.materials[r.tile]||this.materials[1];c.drawImage(tex,Math.min(127,Math.floor(u*128)),0,1,128,x,top,1,height);c.fillStyle=`rgba(20,42,44,${clamp(d/45+(r.side?.14:0),.05,.68)})`;c.fillRect(x,top,1,height);c.fillStyle='#d9d7b766';c.fillRect(x,top,1,Math.max(1,height*.009));if(bottom<h){c.fillStyle='#112c2d38';c.fillRect(x,bottom,1,Math.min(15,height*.13));}}
 const items=[...g.bots.filter(b=>!b.dead).map(b=>({...b,type:'bot'})),...g.supplies.map(s=>({...s,type:'supply'})),...g.grenades.map(s=>({...s,type:'nade'})),...g.blasts.map(s=>({...s,type:'blast'})),{x:14,y:14,type:'flag'}];items.sort((a,b)=>Math.hypot(b.x-p.x,b.y-p.y)-Math.hypot(a.x-p.x,a.y-p.y));
 for(const s of items){const dist=Math.hypot(s.x-p.x,s.y-p.y),ang=angleDiff(Math.atan2(s.y-p.y,s.x-p.x),p.a);if(Math.abs(ang)>FOV*.85||dist<(s.type==='bot'?.6:.25))continue;const depth=dist*Math.cos(ang),sx=w/2+Math.tan(ang)*projection,sh=projection/depth,base=horizon+sh*.46,sw=sh*(s.type==='bot'?.56:s.type==='flag'?.8:s.type==='blast'?2:.65);c.save();c.beginPath();for(let x=Math.max(0,Math.floor(sx-sw));x<Math.min(w,sx+sw);x++)if(this.z[x]>depth-.1)c.rect(x,Math.max(0,base-sh*1.7),1,sh*2.5);c.clip();
 if(s.type==='bot'){const facing=angleDiff(s.a,Math.atan2(p.y-s.y,p.x-s.x)),phase=this.reduced?0:s.walkPhase??g.time*7;this.drawSoldier(c,s.team,facing,phase,s.moving||0,sx,base,sh);if(s.flash&&!this.reduced){const glow=c.createRadialGradient(sx+sh*.32,base-sh*.62,0,sx+sh*.32,base-sh*.62,sh*.18);glow.addColorStop(0,'#fff3a5');glow.addColorStop(1,'#ffb54800');c.fillStyle=glow;c.fillRect(sx+sh*.1,base-sh*.84,sh*.44,sh*.44);}if(s.team===0){c.fillStyle=TEAM_COLORS[0];c.font=`bold ${Math.max(7,sh*.09)}px monospace`;c.textAlign='center';c.fillText('⌄',sx,base-sh*1.18);}}
 if(s.type==='supply'){ellipse(c,sx,base,sh*.35,sh*.06,'#152d2b55');polygon(c,[[sx-sh*.28,base-sh*.35],[sx+sh*.18,base-sh*.39],[sx+sh*.29,base-sh*.29],[sx-sh*.18,base-sh*.25]],'#8d9b6e');panel(c,sx-sh*.28,base-sh*.35,sh*.46,sh*.35,'#405c46');polygon(c,[[sx+sh*.18,base-sh*.35],[sx+sh*.29,base-sh*.29],[sx+sh*.29,base-sh*.04],[sx+sh*.18,base]],'#2f4538');c.fillStyle=(s.ready??0)>g.time?'#8d977e':'#c9efab';c.fillRect(sx-sh*.09,base-sh*.29,sh*.06,sh*.19);c.fillRect(sx-sh*.15,base-sh*.22,sh*.18,sh*.06);}
 if(s.type==='flag'){const color=g.owner<0?'#e7d6a1':TEAM_COLORS[g.owner];ellipse(c,sx,base,sh*.75,sh*.16,color+'44');ellipse(c,sx,base,sh*.55,sh*.11,'#263b3a44');panel(c,sx-sh*.1,base-sh*.09,sh*.2,sh*.1,'#6f7c70');c.fillStyle='#c5ccbb';c.fillRect(sx,base-sh*1.4,Math.max(2,sh*.025),sh*1.4);const flutter=this.reduced?0:Math.sin(g.time*4)*sh*.045;polygon(c,[[sx,base-sh*1.4],[sx+sh*.52,base-sh*1.34+flutter],[sx+sh*.5,base-sh*.99+flutter],[sx,base-sh*1.06]],color);c.fillStyle='#203b3caa';c.font=`bold ${Math.max(5,sh*.12)}px monospace`;c.fillText('WD',sx+sh*.11,base-sh*1.17);}
 if(s.type==='nade'){ellipse(c,sx,base-sh*.02,sh*.1,sh*.025,'#142c2b55');ellipse(c,sx,base-sh*.15,sh*.07,sh*.09,'#68824e');panel(c,sx-sh*.035,base-sh*.27,sh*.07,sh*.06,'#b6bb8f');}
 if(s.type==='blast'){const t=this.reduced?.5:clamp(1-s.t/.4,0,1);c.globalAlpha=this.reduced?.45:1-t;for(let i=0;i<9;i++){const a=i*2.4;ellipse(c,sx+Math.cos(a)*sh*t*.9,base-sh*.4+Math.sin(a)*sh*t*.6,sh*(.17+t*.17),sh*(.17+t*.2),i%2?'#ec9b4f':'#f4d18a');}}
 c.restore();}
 if(active&&!p.dead){this.combat(c,w,h,horizon,projection,g);if(!view.scoped){if(aim>.55&&g.kit!=='marksman'){const blend=clamp((aim-.55)/.4,0,1);if(blend<1){c.save();c.globalAlpha=1-blend;this.gun(g,w,h);c.restore();}c.save();c.globalAlpha=blend;this.ads(g,w,h);c.restore();}else this.gun(g,w,h);}if(view.scoped)this.scope(c,w,h);}const vignette=c.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,Math.max(w,h)*.7);vignette.addColorStop(0,'#07191b00');vignette.addColorStop(1,'#07191b60');c.fillStyle=vignette;c.fillRect(0,0,w,h);if(active)this.incoming(c,w,h,g);if(p.dead){c.fillStyle='#14232aaa';c.fillRect(0,0,w,h);c.fillStyle='#e1e6cd';c.font=`italic bold ${w*.043}px sans-serif`;c.textAlign='center';c.fillText('TEMPORARILY OUTSOURCED',w/2,h*.48);c.font=`${w*.02}px monospace`;c.fillText(`Redeploying in ${Math.ceil(p.dead)}…`,w/2,h*.57);}
 this.ctx.imageSmoothingEnabled=true;this.ctx.drawImage(this.buffer,0,0,this.canvas.width,this.canvas.height);}
 // Articulate one coherent silhouette directly; adjacent transparent sprites never overlap.
 soldier(c,team,angle){const col=TEAM_COLORS[team],side=-Math.sin(angle),front=Math.cos(angle),width=.58+.42*Math.abs(front);
  c.save();c.translate(64,0);c.scale(width,1);c.translate(-64,0);
  polygon(c,[[41,45],[84,45],[91,89],[77,102],[45,98],[35,84]],'#63776c','#162e35');
  polygon(c,[[42,49],[83,49],[85,88],[41,88]],front<-.2?'#3e5550':'#2a4244','#122a32');
  if(front<-.2){panel(c,46,54,33,34,'#3e5550');panel(c,50,59,25,19,'#607366');}else{for(let i=0;i<3;i++)panel(c,43+i*13,65,11,17,'#64705a');panel(c,44,51,36,10,'#718575');}
  panel(c,82,51,9,14,col);panel(c,29,51,10,14,col);
  polygon(c,[[33,48],[41,53],[41,76],[54,83],[48,94],[29,80],[24,59]],'#738375','#233b3e');polygon(c,[[85,49],[95,56],[99,77],[85,87],[76,77],[85,68]],'#738375','#233b3e');
  ellipse(c,60,33,16,19,'#aa9273');panel(c,44,32,31,15,'#4b625a');
  if(front>-.2){panel(c,45+side*6,33,29,6,'#172e37');c.fillStyle='#b8d9d0';c.fillRect(48+side*6,34,9,2);}
  ellipse(c,60,20,21,12,'#667970');panel(c,39,20,42,9,'#394e4e');panel(c,42,23,11,4,col);panel(c,55,14,12,10,'#354b48');c.restore();
  if(front>-.75){const muzzle=64+side*45+(1-Math.abs(side))*32;polygon(c,[[49,75],[muzzle,68],[muzzle,75],[60,87]],'#172e38','#10232c');panel(c,muzzle-4,67,9,5,'#10262e');panel(c,66,78,8,17,'#20373e');ellipse(c,51,81,9,7,'#293f3e');ellipse(c,(muzzle+64)/2,76,8,6,'#293f3e');}
 }
 drawSoldier(c,team,facing,phase,moving,sx,base,sh){
  const stride=this.reduced?0:Math.sin(phase)*Math.min(1,moving/1.1)*7;
  c.save();c.translate(sx-sh*.53,base-sh*1.12);c.scale(sh*1.06/128,sh*1.12/144);
  ellipse(c,64,137,28,5,'#0d252c55');
  for(const [x,step]of [[47,stride],[68,-stride]]){const lift=Math.max(0,-step)*.32;polygon(c,[[x,88],[x+15,88],[x+12+step,121-lift],[x+8+step,135-lift],[x-8+step,135-lift],[x-4+step,119-lift]],'#2e4248','#152b34');panel(c,x-3+step*.5,108-lift,13,9,'#50605e');panel(c,x-9+step,132-lift,20,7,'#172c34');}
  this.soldier(c,team,facing);c.restore();
 }
 scope(c,w,h){
  const x=w/2,y=h/2,r=Math.min(w,h)*.435;
  c.save();c.fillStyle='#061018f5';c.beginPath();c.rect(0,0,w,h);c.arc(x,y,r,0,TAU,true);c.fill('evenodd');
  c.strokeStyle='#718c83';c.lineWidth=Math.max(3,r*.025);c.beginPath();c.arc(x,y,r,0,TAU);c.stroke();
  c.strokeStyle='#0c1e22';c.lineWidth=Math.max(1,w/900);c.beginPath();c.moveTo(x-r,y);c.lineTo(x-5,y);c.moveTo(x+5,y);c.lineTo(x+r,y);c.moveTo(x,y-r);c.lineTo(x,y-5);c.moveTo(x,y+5);c.lineTo(x,y+r);c.stroke();
  for(let n=-3;n<=3;n++)if(n){const d=n*r*.14;c.beginPath();c.moveTo(x+d,y-3);c.lineTo(x+d,y+3);c.moveTo(x-3,y+d);c.lineTo(x+3,y+d);c.stroke();}
  ellipse(c,x,y,1.5,1.5,'#edac77');c.fillStyle='#d8e6c5';c.font=`${Math.max(8,r*.055)}px monospace`;c.textAlign='center';c.fillText('4x / LONG DISTANCE HR',x,y+r*.76);c.restore();
 }
 ads(g,w,h){
  const c=this.c,x=w/2,y=h/2,scale=Math.min(w/800,h/430),short=g.kit==='smg',r=(short?25:33)*scale;
  c.save();c.lineJoin='round';
  // Reuse the detailed receiver, rail and gloved hands, with the sight window clear.
  c.save();c.beginPath();c.rect(0,y+r+6*scale,w,h-y-r);c.clip();
  const transitionAim=this.aim;this.aim=1;try{this.gun(g,w,h);}finally{this.aim=transitionAim;}c.restore();
  panel(c,x-r*.25,y+r*.8,r*.5,12*scale,'#314b51','#10252d');
  if(short){c.strokeStyle='#203941';c.lineWidth=7*scale;c.beginPath();c.arc(x,y,r,Math.PI*.15,Math.PI*.85,true);c.stroke();c.strokeStyle='#a8b8a0';c.lineWidth=1.5*scale;c.beginPath();c.arc(x,y,r,Math.PI*.15,Math.PI*.85,true);c.stroke();panel(c,x-2*scale,y+6*scale,4*scale,r-2*scale,'#b9c5a6');ellipse(c,x,y,1.3*scale,1.3*scale,'#f0c78e');}
  else{c.strokeStyle='#203941';c.lineWidth=8*scale;c.strokeRect(x-r,y-r*.8,r*2,r*1.6);c.strokeStyle='#a4b49b';c.lineWidth=1.3*scale;c.strokeRect(x-r,y-r*.8,r*2,r*1.6);c.fillStyle='#9fe4cf08';c.fillRect(x-r+4*scale,y-r*.8+4*scale,r*2-8*scale,r*1.6-8*scale);ellipse(c,x,y,2*scale,2*scale,'#f0b87d');}
  c.restore();
 }
 gun(g,w,h){const c=this.c,s=Math.min(w/800,h/430),aim=this.aim,reload=g.reloading?1-g.reloading/g.weapon.reload:0,lower=g.reloading?Math.sin(reload*Math.PI):0,bob=this.reduced?0:Math.sin(this.walk*2)*this.motion*3*(1-aim),recoil=this.reduced?0:this.recoil;const kit=g.kit||'carbine',long=kit==='marksman',short=kit==='smg';const sightX=long?-52:short?-33:-43,sightY=long?-164:short?-134:-157,hipX=w*.64,hipY=h+18*s,aimX=w*.5-s*sightX,aimY=h*.5-s*sightY,gunY=hipY+(aimY-hipY)*aim+bob+lower*90*s+recoil*16*s*(1-aim*.85),sleeveEnd=aim>.55?Math.max(28,(h-gunY)/s+28):null;c.save();c.translate(hipX+(aimX-hipX)*aim+(this.reduced?0:Math.cos(this.walk)*this.motion*3*(1-aim)),gunY);c.scale(s,s);c.rotate(this.reduced?0:-lower*.2+recoil*.025);const barrel=long?-210:short?-148:-180,muzzleX=long?-80:short?-45:-64;
 // Sleeved arms, wrist straps and articulated gloves surround the actual grip points.
 polygon(c,[[37,sleeveEnd??24],[122,sleeveEnd??26],[65,-91],[30,-105],[10,-73]],'#465e57','#182f36');polygon(c,[[104,sleeveEnd??17],[169,sleeveEnd??28],[89,-65],[57,-78],[45,-53]],'#64786a','#263f42');polygon(c,[[24,-77],[42,-96],[64,-82],[52,-57]],'#1d343b','#0e252c');panel(c,40,-82,15,10,'#667468');polygon(c,[[-132,sleeveEnd??24],[-67,sleeveEnd??24],[-23,-110],[-48,-129],[-74,-103]],'#5c7464','#203c3c');polygon(c,[[-76,-102],[-49,-126],[-28,-112],[-40,-85]],'#253e3e','#142d33');
 // Receiver side, top rail and beveled handguard use separate planes.
 polygon(c,[[-28,14],[67,18],[58,-72],[-1,-139],[-31,-122]],'#182d36','#0d2029');polygon(c,[[-31,-122],[-1,-139],[64,-78],[45,-58]],'#62767a','#213d46');polygon(c,[[-31,-122],[45,-58],[43,-35],[-39,-105]],'#3a5159','#162f39');polygon(c,[[-39,-105],[43,-35],[67,18],[-28,14]],'#283f48','#122a34');
 // Magazine visibly travels out and back during the reload cycle.
 const magDrop=g.reloading&&!this.reduced?Math.sin(clamp((reload-.1)/.8,0,1)*Math.PI)*58:0;c.save();c.translate(0,magDrop);polygon(c,[[-12,-65],[12,-45],[6,6],[-22,-2]],short?'#202f37':'#4c5e5e','#102833');for(let j=0;j<4;j++)polygon(c,[[-14,-51+j*11],[7,-34+j*11],[6,-30+j*11],[-15,-47+j*11]],'#6c7a703f');c.restore();
 const front=[muzzleX,barrel],rear=[-14,-118];polygon(c,[[front[0]-13,front[1]+25],[front[0]+7,front[1]+16],[rear[0]+18,rear[1]+5],[rear[0]-12,rear[1]+20]],long?'#657869':'#475e61','#172e37');polygon(c,[[front[0]+7,front[1]+16],[front[0]+12,front[1]+28],[rear[0]+22,rear[1]+18],[rear[0]+18,rear[1]+5]],'#243d48','#122b35');for(let j=0;j<5;j++){const t=j/6,x=front[0]+(rear[0]-front[0])*t,y=front[1]+26+(rear[1]-front[1])*t;polygon(c,[[x-6,y],[x+5,y-4],[x+10,y+3],[x-1,y+7]],'#172f38');}
 polygon(c,[[muzzleX-8,barrel+29],[muzzleX+6,barrel+22],[muzzleX-3,barrel-7],[muzzleX-14,barrel-2]],'#1a313d','#10232d');polygon(c,[[muzzleX-14,barrel-2],[muzzleX-3,barrel-7],[muzzleX+1,barrel],[muzzleX-10,barrel+5]],'#8c9b96');ellipse(c,muzzleX-7,barrel,4,2,'#0b202b');
 // Rail ridges, fasteners, charging handle, selector and kit-specific sight.
 for(let j=0;j<8;j++){const t=j/9;panel(c,-21+t*65,-121+t*62,9,3,'#91a29a');}panel(c,18,-70,23,8,'#122a34');panel(c,21,-68,12,2,'#a3b0a3');ellipse(c,32,-40,3,3,'#9bac9b');ellipse(c,50,-17,2,2,'#a7b5a2');polygon(c,[[17,-56],[24,-54],[30,-46],[23,-45]],'#7b8c81');panel(c,-32,-105,10,9,'#95a88f');c.save();c.translate(22,-32);c.rotate(.7);c.fillStyle='#d2d7b5';c.font='bold 8px monospace';c.fillText(long?'WD / 03':short?'WD / 02':'WD / 01',0,0);c.restore();
 if(long){polygon(c,[[-61,-163],[-41,-171],[-5,-131],[-21,-120]],'#182e39','#10232c');ellipse(c,-52,-164,12,8,'#667d7c');ellipse(c,-52,-164,8,5,'#81c2bc');ellipse(c,-51,-165,4,2,'#d3efda');panel(c,-30,-138,16,6,'#233d46');}else{const sightX=short?-34:-44,sightY=short?-135:-158;polygon(c,[[sightX-7,sightY+11],[sightX-9,sightY-4],[sightX+6,sightY-8],[sightX+12,sightY+6]],'#192e39','#97a89c');c.fillStyle='#85cbb533';c.fillRect(sightX-4,sightY-3,9,10);ellipse(c,sightX+1,sightY+1,1.7,1.7,'#e6bc79');}
 // Supporting glove wraps over the handguard; fingers are individually segmented.
 polygon(c,[[-62,-106],[-45,-119],[-28,-109],[-30,-91],[-47,-81],[-65,-88]],'#273f40','#142d34');for(let j=0;j<4;j++){polygon(c,[[-49+j*5,-117+j*2],[-44+j*5,-119+j*2],[-37+j*5,-106+j*2],[-42+j*5,-103+j*2]],'#52675d','#1e383c');}polygon(c,[[36,-62],[55,-70],[66,-58],[63,-33],[49,-24],[34,-39]],'#263e40','#142c34');for(let j=0;j<3;j++)panel(c,42+j*5,-59+j*2,6,12,'#52665c');panel(c,43,-30,17,8,'#6a7a6b');
 if(this.flash>0&&!this.reduced){const x=muzzleX-6,y=barrel-7;c.save();c.globalCompositeOperation='screen';const glow=c.createRadialGradient(x,y,0,x,y,55);glow.addColorStop(0,'#fff6c8');glow.addColorStop(.3,'#ffc56caa');glow.addColorStop(1,'#e18a2900');c.fillStyle=glow;c.fillRect(x-55,y-55,110,110);polygon(c,[[x,y-43],[x+9,y-10],[x+32,y-13],[x+12,y+3],[x+20,y+23],[x,y+9],[x-20,y+22],[x-13,y-1],[x-31,y-13],[x-9,y-13]],'#ffe9a9');polygon(c,[[x,y-23],[x+6,y-5],[x+15,y+2],[x+4,y+10],[x-7,y+4],[x-11,y-5]],'#fffde3');c.restore();}
 for(const shell of this.casings){c.save();c.translate(57+shell.x,-75+shell.y);c.rotate(shell.t*18);panel(c,-5,-2,10,4,'#d1ad68','#795e32');c.restore();}c.restore();}
 minimap(g,canvas){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,s=w/28;
  c.clearRect(0,0,w,h);c.fillStyle='#10242bf0';c.fillRect(0,0,w,h);
  c.strokeStyle='#a8c7b10c';c.lineWidth=.5;
  for(let i=0;i<=28;i+=4){c.beginPath();c.moveTo(i*s,0);c.lineTo(i*s,h);c.moveTo(0,i*s);c.lineTo(w,i*s);c.stroke();}
  for(let y=0;y<28;y++)for(let x=0;x<28;x++)if(g.map[y][x]){c.fillStyle=g.map[y][x]===2?'#ae8655':'#718b865e';c.fillRect(x*s,y*s,s-.4,s-.4);}
  const zoneColor=g.owner<0?'#ead69a':TEAM_COLORS[g.owner];
  c.fillStyle=zoneColor+'20';c.strokeStyle=zoneColor+'a0';c.lineWidth=1;
  c.beginPath();c.arc(14*s,14*s,4*s,0,TAU);c.fill();c.setLineDash([3,3]);c.stroke();c.setLineDash([]);
  c.fillStyle=zoneColor;c.font='bold 9px monospace';c.textAlign='center';c.fillText('A',14*s,14*s+3);
  if(!g.player.dead){c.save();c.translate(g.player.x*s,g.player.y*s);c.rotate(g.player.a);c.fillStyle='#ffffff12';c.beginPath();c.moveTo(0,0);c.arc(0,0,s*5,-.56,.56);c.closePath();c.fill();c.restore();}
  for(const b of g.bots)if(!b.dead){c.fillStyle=TEAM_COLORS[b.team];c.beginPath();c.arc(b.x*s,b.y*s,b.team===0?1.8:2.2,0,TAU);c.fill();}
  c.font='bold 10px monospace';for(const a of g.supplies){c.fillStyle=(a.ready??0)>g.time?'#7e9386':'#d8f3ae';c.fillText('+',a.x*s,a.y*s+3);}
  if(!g.player.dead){c.save();c.translate(g.player.x*s,g.player.y*s);c.rotate(g.player.a);c.strokeStyle='#10242b';c.lineWidth=2;c.fillStyle='#fff';c.beginPath();c.moveTo(5,0);c.lineTo(-3,-3);c.lineTo(-2,0);c.lineTo(-3,3);c.closePath();c.stroke();c.fill();c.restore();}
  c.fillStyle='#d3e5d2aa';c.font='7px monospace';c.textAlign='left';c.fillText('N',5,10);
 }
}
