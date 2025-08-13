(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const l of a)if(l.type==="childList")for(const i of l.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function s(a){const l={};return a.integrity&&(l.integrity=a.integrity),a.referrerPolicy&&(l.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?l.credentials="include":a.crossOrigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function r(a){if(a.ep)return;a.ep=!0;const l=s(a);fetch(a.href,l)}})();class it{constructor(){this.ws=null,this.isConnected=!1,this.isHost=!1,this.reconnectAttempts=0,this.maxReconnectAttempts=3,this.reconnectDelay=1e3,this.playerId=this.generatePlayerId()}generatePlayerId(){return"player_"+Math.random().toString(36).substr(2,9)}async checkServerAvailable(o=this.getDefaultServerUrl()){try{if(o==="/ws")return(await fetch("/mp/health",{method:"GET",signal:AbortSignal.timeout(2e3)})).ok;const s=o.replace("ws://","http://").replace("wss://","https://");let r;return s.includes("/ws")?r=s.replace("/ws","/mp/health"):r=`${s}/health`,(await fetch(r,{method:"GET",signal:AbortSignal.timeout(2e3)})).ok}catch{return console.log("Multiplayer server not available, running in single-player mode"),!1}}getDefaultServerUrl(){const o=window.location.protocol==="https:"?"wss:":"ws:",s=window.location.host,r=window.location.hostname;if(r==="onrender.com"||r.endsWith(".onrender.com")||!s.includes("localhost"))return"/ws";if(s.includes("localhost:5173")||s.includes("127.0.0.1:5173"))return"ws://localhost:3001";if(s.includes(":8080")||r==="localhost"&&s.includes(":80")){const a=s.split(":")[0];return`${o}//${a}:3001`}return`${o}//${s}:3001`}async initialize(o=this.getDefaultServerUrl()){try{return await this.checkServerAvailable(o)?(this.ws=new WebSocket(o),new Promise(r=>{if(!this.ws){r(!1);return}const a=setTimeout(()=>{console.log("Connection timeout, falling back to single-player mode"),this.disconnect(),r(!1)},5e3);this.ws.onopen=()=>{clearTimeout(a),this.isConnected=!0,this.reconnectAttempts=0,console.log("Connected to multiplayer server");let l="";try{l=localStorage.getItem("playerName")||""}catch{}this.send({type:"join",playerId:this.playerId,name:l,timestamp:Date.now()}),r(!0)},this.ws.onmessage=l=>{try{const i=JSON.parse(l.data);this.handleMessage(i)}catch(i){console.error("Error parsing message:",i)}},this.ws.onclose=()=>{this.isConnected=!1,console.log("Disconnected from multiplayer server"),this.attemptReconnect(o)},this.ws.onerror=l=>{clearTimeout(a),console.log("WebSocket error, falling back to single-player mode"),this.isConnected=!1,r(!1)}})):(console.log("Multiplayer server not available, continuing in single-player mode"),!1)}catch{return console.log("Failed to initialize multiplayer, continuing in single-player mode"),!1}}attemptReconnect(o){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`),setTimeout(()=>{this.initialize(o)},this.reconnectDelay*this.reconnectAttempts)):console.log("Max reconnection attempts reached, continuing in single-player mode")}handleMessage(o){switch(o.type){case"gameState":this.onStateUpdate&&this.onStateUpdate(o.gameState);break;case"playerJoined":o.playerId===this.playerId&&(this.isHost=o.isHost||!1),this.onPlayerJoin&&this.onPlayerJoin(o.playerId);break;case"playerLeft":this.onPlayerLeave&&this.onPlayerLeave(o.playerId);break;case"playerUpdate":this._onPlayerUpdate&&this._onPlayerUpdate(o.playerId,o.position,o.score,o.name);break;case"itemCollected":this._onPlayerUpdate&&this._onPlayerUpdate(o.playerId,{},o.score,o.name);break}}send(o){if(this.ws&&this.isConnected)try{this.ws.send(JSON.stringify(o))}catch(s){console.error("Error sending message:",s),this.isConnected=!1}}updatePlayerPosition(o,s,r,a,l){this.isConnected&&this.send({type:"playerUpdate",playerId:this.playerId,position:{x:o,y:s,width:r,height:a,growLevel:l},timestamp:Date.now()})}collectItem(o){this.isConnected&&this.send({type:"collectItem",playerId:this.playerId,collectibleId:o,timestamp:Date.now()})}onGameStateUpdate(o){this.onStateUpdate=o}onPlayerJoined(o){this.onPlayerJoin=o}onPlayerLeft(o){this.onPlayerLeave=o}onPlayerUpdate(o){this._onPlayerUpdate=o}get connected(){return this.isConnected}get currentPlayerId(){return this.playerId}get isHostPlayer(){return this.isHost}disconnect(){this.ws&&(this.ws.close(),this.ws=null),this.isConnected=!1}ping(){this.isConnected&&this.send({type:"ping",timestamp:Date.now()})}}const $=new it,h=document.getElementById("gameCanvas"),e=h.getContext("2d"),lt=.5,Xe=5,$e=13,C=400,at=60;let je=0,Je=0,Ne=0,j=localStorage.getItem("speedUnlocked")==="true",Le=j?2:1,Me=localStorage.getItem("showFpsCounter")!=="false";const se=3200;let T=0,st=0;function Y(t){return`${t}_${Date.now()}_${st++}`}let rt=0;function ct(){return`enemy_${Date.now()}_${rt++}`}let dt=0;function ht(){return`tube_${Date.now()}_${dt++}`}const w=[],N=[],X=[],J=[],le=[];let S={x:0,y:0,width:24,height:80};const n={x:100,y:C-50,width:40,height:50,vx:0,vy:0,onGround:!1,hasDoubleJump:!1,growLevel:0,canDoubleJump:!1,eatenEnemy:null},d={type:"none",progress:0,duration:1e3,startTime:0,targetEnemy:null,startX:0,startY:0,endX:0,endY:0};let D=new Map,L=localStorage.getItem("multiplayerEnabled")==="true",We=0,z=localStorage.getItem("playerName")||"",_=null;const u=[],V=[];let E=localStorage.getItem("levelType")||"horizontal",te=localStorage.getItem("manualLevelType")==="true",ne=localStorage.getItem("manualLevelTypeValue")||E,M=0;const P=3200;let W=null;async function ft(){let t=P;const o=Math.min($e*8,180),s=140,r=320,a=50;u.length=0,V.length=0,w.length=0,N.length=0,X.length=0,J.length=0,le.length=0;const l=[];let i=100+Math.random()*(h.width-s-200),c=!0;for(;t>0;){let p,m;if(c)p=0,m=h.width,c=!1;else{m=s+Math.random()*(r-s);let k=Math.max(0,i-m+40),g=Math.min(h.width-m,i+m-40);k>g&&(k=g=i),p=k+Math.random()*(g-k)}u.push({x:p,y:t,width:m,height:a}),l.push({x:p+m/2,y:t-30}),Math.random()<.5&&w.push({x:p+m/2-10,y:t-30,width:20,height:20,collected:!1,type:"coin",id:Y("coin")}),Math.random()<.3&&t<P-o&&N.push({x:p+m/2-20,y:t+a-15,width:40,height:15}),Math.random()<.2&&t<P-o&&X.push({x:p-60,y:t-100,width:80,height:20,dx:2,range:120,startX:p-60}),t-=o,Math.random()<.5&&t>50&&V.push({x:p+10,y:t-40,width:40,height:40}),i=p}if(l.length>0){const p=Math.floor(Math.random()*l.length),m=l[p];w.push({x:m.x-10,y:m.y,width:20,height:20,collected:!1,type:"heart",id:Y("heart")})}if(l.length>1){let p,m=0;const k=l.length*3;do p=Math.floor(Math.random()*l.length),m++;while(m<k&&w.some(g=>g.x===l[p].x-10&&g.y===l[p].y));if(m<k){const g=l[p];w.push({x:g.x-10,y:g.y-30,width:20,height:20,collected:!1,type:"doublejump",id:Y("doublejump")})}}if(l.length>2){let p,m=0;const k=l.length*3;do p=Math.floor(Math.random()*l.length),m++;while(m<k&&(w.some(g=>g.x===l[p].x-10&&g.y===l[p].y)||w.some(g=>g.x===l[p].x-10&&g.y===l[p].y-30)));if(m<k){const g=l[p];w.push({x:g.x-10,y:g.y-60,width:20,height:20,collected:!1,type:"grow",id:Y("grow")})}}const f=P;u.some(p=>p.y<=f&&p.y+p.height>=f-40)||u.unshift({x:100,y:P,width:s+Math.random()*(r-s),height:a});const x=u[u.length-1];if(S.x=x.x+x.width/2-S.width/2,S.y=x.y-S.height,L&&w.length>0){const p=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(m=>({id:m.id,type:m.type}))})})}catch{}}}te&&(E=ne);async function Ae(){if(E==="vertical"){await ft();return}u.length=0,V.length=0,w.length=0,N.length=0,X.length=0,J.length=0,le.length=0;let t=0;const o=[];let s=0;for(;t<se;){const f=s===0,y=t<=100&&t+400>=100,x=!f&&!y&&Math.random()<.2,p=x?480+Math.random()*120:Math.random()<.2?320:160+Math.random()*160;let m;if(Math.random()<.25){const g=(Math.random()<.5?1:-1)*(20+Math.random()*20);m={x:t,y:C,width:p,height:50,endY:C+g,isSlope:!0,willHaveEnemies:x}}else m={x:t,y:C,width:p,height:50,willHaveEnemies:x};if(u.push(m),o.push({x:t+p/2,y:C-30}),Math.random()<.5&&w.push({x:t+p/2-10,y:C-30,width:20,height:20,collected:!1,type:"coin",id:Y("coin")}),Math.random()<.3&&t>0&&N.push({x:t-40,y:C+35,width:40,height:15}),Math.random()<.2&&t>0&&X.push({x:t-60,y:C-100,width:80,height:20,dx:2,range:120,startX:t-60}),m.willHaveEnemies&&p>200){const R=t+40,Re=t+p-40-40,nt=R+Math.random()*Math.max(0,Re-R),ot=C-60;le.push({x:nt,y:ot,width:40,height:80,id:ht(),hasSpawnedEnemy:!1})}t+=p;const k=60+Math.random()*80;t+=k,Math.random()<.5&&t<se-50&&V.push({x:t+10,y:C-40,width:40,height:40}),s++}if(o.length>0){const f=Math.floor(Math.random()*o.length),y=o[f];w.push({x:y.x-10,y:y.y,width:20,height:20,collected:!1,type:"heart",id:Y("heart")})}if(o.length>1){let f,y=0;const x=o.length*3;do f=Math.floor(Math.random()*o.length),y++;while(y<x&&w.some(p=>p.x===o[f].x-10&&p.y===o[f].y));if(y<x){const p=o[f];w.push({x:p.x-10,y:p.y-30,width:20,height:20,collected:!1,type:"doublejump",id:Y("doublejump")})}}if(o.length>2){let f,y=0;const x=o.length*3;do f=Math.floor(Math.random()*o.length),y++;while(y<x&&(w.some(p=>p.x===o[f].x-10&&p.y===o[f].y)||w.some(p=>p.x===o[f].x-10&&p.y===o[f].y-30)));if(y<x){const p=o[f];w.push({x:p.x-10,y:p.y-60,width:20,height:20,collected:!1,type:"grow",id:Y("grow")})}}const r=100;u.some(f=>f.x<=r&&f.x+f.width>=r+40)||u.unshift({x:60,y:C,width:80,height:50});const l=u[u.length-1];let i=l.x+l.width-32,c="isSlope"in l&&l.isSlope?l.endY-S.height:l.y-S.height;if(S.x=i,S.y=c,L&&w.length>0){const f=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(f,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(y=>({id:y.id,type:y.type}))})})}catch{}}}function Ie(t,o){return t.x<o.x+o.width&&t.x+t.width>o.x&&t.y<o.y+o.height&&t.y+t.height>o.y}let v=0,B=1,pt=se-100,F=0,U=3,q=!1,Ee=Number(localStorage.getItem("topScore")||"0"),re=!1,ye=0,H=Number(localStorage.getItem("totalPoints")||"0"),G=localStorage.getItem("playerCharacter")||"SQUARE",ce=JSON.parse(localStorage.getItem("purchasedUpgrades")||"{}"),de=JSON.parse(localStorage.getItem("enabledUpgrades")||"{}");function ie(t){return!!(ce[t]&&de[t]!==!1)}function gt(t){ce[t]&&(de[t]=!de[t],localStorage.setItem("enabledUpgrades",JSON.stringify(de)))}Ae().then(()=>{ke()}).then(()=>{ie("extra_life")?U=4:ie("tough_skin")&&(U=5),ie("double_jump_start")&&(n.hasDoubleJump=!0)});const pe={characters:[{id:"yellow_square",emoji:"SQUARE",name:"Yellow Square",cost:0,unlocked:!0},{id:"yellow_circle",emoji:"🟡",name:"Yellow Circle",cost:10},{id:"red_circle",emoji:"🔴",name:"Red Circle",cost:50},{id:"blue_circle",emoji:"🔵",name:"Blue Circle",cost:50},{id:"green_circle",emoji:"🟢",name:"Green Circle",cost:50},{id:"smiley",emoji:"😊",name:"Smiley Face",cost:100},{id:"cool",emoji:"😎",name:"Cool Face",cost:150},{id:"star",emoji:"⭐",name:"Star",cost:200},{id:"crown",emoji:"👑",name:"Crown",cost:300},{id:"rocket",emoji:"🚀",name:"Rocket",cost:500},{id:"alien",emoji:"👽",name:"Alien",cost:750}],gameplay:[{id:"extra_life",name:"Start with Extra Life",cost:100,description:"Begin each game with 4 lives instead of 3"},{id:"double_jump_start",name:"Start with Double Jump",cost:200,description:"Begin each level with double jump ability"},{id:"speed_boost",name:"Permanent Speed Boost",cost:300,description:"1.5x movement speed permanently"},{id:"lucky_coins",name:"Lucky Coins",cost:400,description:"Coins are worth 2 points each"},{id:"tough_skin",name:"Tough Skin",cost:500,description:"Start each game with 5 lives instead of 3"}]};function he(t){t>Ee&&(Ee=t,localStorage.setItem("topScore",String(Ee)))}function ae(t){H+=t,localStorage.setItem("totalPoints",String(H))}function mt(t){return H>=t?(H-=t,localStorage.setItem("totalPoints",String(H)),!0):!1}function Oe(t){if(ce[t])return!1;let o=0,s=!1;for(const r of pe.characters)if(r.id===t){o=r.cost,s=!0;break}if(!s){for(const r of pe.gameplay)if(r.id===t){o=r.cost,s=!0;break}}if(!s||!mt(o))return!1;if(ce[t]=!0,de[t]=!0,localStorage.setItem("purchasedUpgrades",JSON.stringify(ce)),localStorage.setItem("enabledUpgrades",JSON.stringify(de)),pe.characters.some(r=>r.id===t)){const r=pe.characters.find(a=>a.id===t);r&&(G=r.emoji,localStorage.setItem("playerCharacter",G))}return!0}function yt(){const t=document.getElementById("shop-modal");if(t){t.style.display="flex";const o=document.getElementById("github-star-btn");o&&(o.style.display="none"),Se()}}function Se(){const t=document.getElementById("shop-points");t&&(t.textContent=String(H));const o=document.getElementById("character-upgrades");o&&(o.innerHTML="",pe.characters.forEach(r=>{const a=r.unlocked||ce[r.id],l=G===r.emoji,i=H>=r.cost,c=document.createElement("div");c.style.cssText=`
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:12px;
        border-radius:8px;
        border:2px solid ${l?"#ffd700":a?"#0cf":"#666"};
        background:${l?"rgba(255,215,0,0.1)":a?"rgba(0,204,255,0.1)":"#333"};
        cursor:pointer;
        transition:all 0.2s;
      `,c.innerHTML=`
        <div style="font-size:2em;margin-bottom:8px;">${r.emoji==="SQUARE"?"🟨":r.emoji}</div>
        <div style="font-size:0.9em;text-align:center;margin-bottom:4px;">${r.name}</div>
        <div style="font-size:0.8em;color:${a?"#0cf":i?"#ffd700":"#999"};">
          ${a?l?"Selected":"Owned":`${r.cost} pts`}
        </div>
      `,c.addEventListener("click",()=>{a?(G=r.emoji,localStorage.setItem("playerCharacter",G),Se()):i&&Oe(r.id)&&Se()}),o.appendChild(c)}));const s=document.getElementById("gameplay-upgrades");s&&(s.innerHTML="",pe.gameplay.forEach(r=>{const a=ce[r.id],l=H>=r.cost,i=de[r.id]!==!1,c=document.createElement("div");if(c.style.cssText=`
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:16px;
        border-radius:8px;
        border:2px solid ${a?"#0cf":"#666"};
        background:${a?"rgba(0,204,255,0.1)":"#333"};
        ${!a&&l?"cursor:pointer;":""}
        transition:all 0.2s;
      `,a){c.innerHTML=`
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
            <div style="font-size:0.9em;color:#ccc;">${r.description}</div>
          </div>
          <div style="text-align:right;display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.9em;color:${i?"#0cf":"#999"};">
              ${i?"Enabled":"Disabled"}
            </span>
            <label style="position:relative;display:inline-block;width:40px;height:20px;">
              <input type="checkbox" ${i?"checked":""} style="opacity:0;width:0;height:0;">
              <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${i?"#0cf":"#666"};border-radius:20px;transition:.4s;">
                <span style="position:absolute;content:'';height:16px;width:16px;left:${i?"22px":"2px"};bottom:2px;background:white;border-radius:50%;transition:.4s;"></span>
              </span>
            </label>
          </div>
        `;const f=c.querySelector('input[type="checkbox"]');f&&f.addEventListener("change",()=>{gt(r.id),Se()})}else c.innerHTML=`
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
            <div style="font-size:0.9em;color:#ccc;">${r.description}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.2em;color:${l?"#ffd700":"#999"};">
              ${r.cost} pts
            </div>
          </div>
        `,l&&c.addEventListener("click",()=>{Oe(r.id)&&Se()});s.appendChild(c)}))}function Ue(){v=0,B=1,U=3,ie("extra_life")&&(U=4),ie("tough_skin")&&(U=5),localStorage.setItem("levelType","horizontal"),q=!1,u.length=0,V.length=0,w.length=0,N.length=0,X.length=0,J.length=0,le.length=0,te?E=ne:E="horizontal",Ae(),ie("double_jump_start")&&(n.hasDoubleJump=!0),ke()}function ke(){if(E==="vertical"){const t=u[0];n.x=t.x+t.width/2-n.width/2,n.y=t.y-n.height,n.vx=0,n.vy=0;const o=Math.max(...u.map(l=>l.width)),s=Math.max(h.width,o),r=h.width/s,a=h.height/r;M=Math.min(Math.max(0,n.y+n.height-a+8),P-a)}else n.x=100,n.y=C-175,n.vx=0,n.vy=0;n.canDoubleJump=!1,ge()}function ge(){n.growLevel===0?(n.width=40,n.height=50):n.growLevel===1?(n.width=60,n.height=75):n.growLevel===2?(n.width=80,n.height=100):n.growLevel>=3&&(n.width=100,n.height=125)}function Ve(){return n.growLevel===0?100:n.growLevel===1?120:n.growLevel>=2?150:100}function ut(){const t=Ve();for(const o of J){if(!o.alive||o.type!=="circle")continue;const s=n.x+n.width/2,r=n.y+n.height/2,a=o.x+o.width/2,l=o.y+o.height/2;if(Math.sqrt(Math.pow(s-a,2)+Math.pow(r-l,2))<=t)return o}return null}function xt(t){d.type="eating",d.progress=0,d.startTime=Date.now(),d.targetEnemy=t,d.startX=t.x+t.width/2,d.startY=t.y+t.height/2}function wt(){if(!n.eatenEnemy)return;d.type="spitting",d.progress=0,d.startTime=Date.now();const o=(n.vx>=0?1:-1)>0?h.width+T:T-50;d.endX=o,d.endY=n.y+n.height/2,d.targetEnemy={x:n.x+n.width/2,y:n.y+n.height/2,width:30,height:30,dx:0,dy:0,range:0,startX:0,alive:!0,id:"temp_spit",isJumpingOut:!1,type:n.eatenEnemy.type}}function bt(){d.type="targeting",d.progress=0,d.duration=300,d.startTime=Date.now(),d.targetEnemy=null,d.startX=0,d.startY=0,d.endX=0,d.endY=0}function vt(t){if(d.type==="none")return;const o=Date.now()-d.startTime;if(d.progress=Math.min(o/d.duration,1),d.type==="eating"&&d.targetEnemy){const s=n.x+n.width/2,r=n.y+n.height/2,a=d.startX+(s-d.startX)*d.progress,l=d.startY+(r-d.startY)*d.progress;d.targetEnemy.x=a-d.targetEnemy.width/2,d.targetEnemy.y=l-d.targetEnemy.height/2,d.progress>=1&&(n.eatenEnemy={...d.targetEnemy},d.targetEnemy.alive=!1,d.type="none",d.targetEnemy=null)}else if(d.type==="spitting"&&d.targetEnemy){const s=n.x+n.width/2,r=n.y+n.height/2,a=s+(d.endX-s)*d.progress,l=r+(d.endY-r)*d.progress;d.targetEnemy.x=a-d.targetEnemy.width/2,d.targetEnemy.y=l-d.targetEnemy.height/2,d.progress>=1&&(n.eatenEnemy=null,d.type="none",d.targetEnemy=null)}else d.type==="targeting"&&d.progress>=1&&(d.type="none",d.targetEnemy=null)}function St(){if(d.type==="none")return;if(d.type==="targeting"){const a=n.x+n.width/2,l=n.y+n.height/2,i=Ve(),c=a+i,f=l;e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(a,l),e.lineTo(c,f),e.stroke(),e.setLineDash([]);return}const t=n.x+n.width/2,o=n.y+n.height/2;if(!d.targetEnemy)return;let s,r;if(d.type==="eating"){const a=n.x+n.width/2,l=n.y+n.height/2,i=d.startX+(a-d.startX)*d.progress,c=d.startY+(l-d.startY)*d.progress;s=i,r=c}else s=d.targetEnemy.x+d.targetEnemy.width/2,r=d.targetEnemy.y+d.targetEnemy.height/2;if(e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(t,o),e.lineTo(s,r),e.stroke(),e.setLineDash([]),d.targetEnemy.type==="circle"){e.fillStyle="#f06",e.beginPath(),e.arc(s,r,d.targetEnemy.width/2,0,2*Math.PI),e.fill(),e.fillStyle="#000";const a=3;e.fillRect(s-8,r-3,a,a),e.fillRect(s+5,r-3,a,a)}else{e.fillStyle="#f90",e.fillRect(s-d.targetEnemy.width/2,r-d.targetEnemy.height/2,d.targetEnemy.width,d.targetEnemy.height),e.fillStyle="#000";const a=3;e.fillRect(s-8,r-3,a,a),e.fillRect(s+5,r-3,a,a)}}function Ce(){if(U--,U<=0){he(v),q=!0,qe(),Et();return}n.hasDoubleJump=!1,n.growLevel=0,n.canDoubleJump=!1,n.eatenEnemy=null,ge(),ke(),F=30}function qe(){let t=document.getElementById("restart-btn");t?t&&(t.style.display="block",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% + 80px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 160px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="2em",t.style.padding="16px 32px")):(t=document.createElement("button"),t.id="restart-btn",t.textContent="Restart",t.style.position="fixed",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="2em",t.style.padding="16px 32px",t.style.zIndex="100",t.style.background="#222",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% + 80px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 160px)",t.style.left="50%",t.style.transform="translateX(-50%)"),t.onclick=()=>{t?.remove(),Ke(),Ue()},document.body.appendChild(t))}function Et(){let t=document.getElementById("share-btn");t?t&&(t.style.display="block",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px")):(t=document.createElement("button"),t.id="share-btn",t.textContent="📤 Share Progress",t.style.position="fixed",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px",t.style.zIndex="100",t.style.background="#0cf",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)"),t.onclick=()=>{Qe()},document.body.appendChild(t))}function Ke(){const t=document.getElementById("share-btn");t&&(t.style.display="none")}function Tt(){const t=document.getElementById("restart-btn");t&&(t.style.display="none")}function Fe(){const t=document.createElement("canvas"),o=t.getContext("2d");return t.width=h.width,t.height=h.height,o.drawImage(h,0,0),o.save(),o.globalAlpha=.8,o.fillStyle="#000",o.fillRect(0,h.height-120,h.width,120),o.globalAlpha=1,o.fillStyle="#fff",o.font="bold 24px sans-serif",o.textAlign="center",o.fillText("Side-Scrolling Platformer",h.width/2,h.height-90),o.font="18px sans-serif",o.fillText(`Level ${B} • Score ${v}`,h.width/2,h.height-65),o.fillText("Play at: github.com/commjoen/generated-game-experiment",h.width/2,h.height-40),q?(o.fillStyle="#e33",o.font="bold 20px sans-serif",o.fillText("Final Score!",h.width/2,h.height-15)):B>=25&&(o.fillStyle="#0cf",o.font="bold 20px sans-serif",o.fillText("Victory! Level 25 Reached!",h.width/2,h.height-15)),o.restore(),t.toDataURL("image/png")}function K(){return q?`Just played Side-Scrolling Platformer! 🎮 Final score: ${v} points on level ${B}! Can you beat it?`:B>=25?`Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${v} points! Amazing game!`:`Playing Side-Scrolling Platformer! 🎮 Currently on level ${B} with ${v} points!`}function Qe(){const t=document.getElementById("share-modal");t&&t.remove();const o=document.createElement("div");o.id="share-modal",o.style.cssText=`
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 1000;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  `,window.innerWidth<=768&&(o.style.padding="8px",o.style.alignItems="flex-start",o.style.paddingTop="10px");const s=document.createElement("div");s.style.cssText=`
    background: #222;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    max-width: 500px;
    width: 100%;
    max-height: min(90vh, 600px);
    color: #fff;
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    margin: 10px;
  `,window.innerWidth<=768&&(s.style.maxHeight="min(90vh, 500px)",s.style.margin="2px",s.style.borderRadius="12px"),window.innerWidth<=480&&(s.style.maxHeight="95vh",s.style.margin="0px",s.style.borderRadius="8px");const r=document.createElement("div");r.style.cssText=`
    padding: 20px 32px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `,window.innerWidth<=768&&(r.style.padding="16px 20px"),window.innerWidth<=480&&(r.style.padding="12px 16px");const a=document.createElement("h2");a.textContent="📤 Share Your Progress",a.style.cssText="margin: 0; font-size: 1.5em; color: #0cf;",window.innerWidth<=480&&(a.style.fontSize="1.3em");const l=document.createElement("button");l.textContent="✖️",l.style.cssText=`
    background: none;
    border: none;
    color: #fff;
    font-size: 1.2em;
    cursor: pointer;
    padding: 4px;
  `,l.onclick=()=>o.remove(),r.appendChild(a),r.appendChild(l);const i=document.createElement("div");i.style.cssText=`
    padding: 24px 32px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  `,window.innerWidth<=768&&(i.style.padding="16px 20px"),window.innerWidth<=480&&(i.style.padding="12px 16px");const c=document.createElement("div");c.style.cssText="margin-bottom: 24px;";const f=document.createElement("h3");f.textContent="Preview:",f.style.cssText="margin: 0 0 12px 0; color: #0cf; font-size: 1.2em;";const y=document.createElement("p");y.textContent=K(),y.style.cssText=`
    margin: 0 0 12px 0;
    padding: 12px;
    background: #333;
    border-radius: 8px;
    line-height: 1.4;
  `;const x=document.createElement("p");x.innerHTML='🔗 <a href="https://github.com/commjoen/generated-game-experiment" target="_blank" style="color: #0cf; text-decoration: underline;">github.com/commjoen/generated-game-experiment</a>',x.style.cssText="margin: 0 0 8px 0; font-size: 0.9em; color: #ccc;";const p=document.createElement("p");p.innerHTML="share"in navigator?'💡 <strong>Tip:</strong> Use "Share+📷" to include the screenshot automatically, or use any social media button below to open the share dialog <em>and</em> download the screenshot.':"💡 <strong>Tip:</strong> When you click any social media button below, the screenshot will be automatically downloaded and the share dialog will open. Just attach the downloaded image to your post!",p.style.cssText=`
    margin: 0;
    padding: 8px 12px;
    background: rgba(12, 255, 255, 0.1);
    border-left: 3px solid #0cf;
    border-radius: 4px;
    font-size: 0.85em;
    color: #ccc;
    line-height: 1.3;
  `,c.appendChild(f),c.appendChild(y),c.appendChild(x),c.appendChild(p);const m=document.createElement("div");m.style.cssText="margin-bottom: 16px;";const k=document.createElement("h3");k.textContent="Share to:",k.style.cssText="margin: 0 0 16px 0; color: #0cf; font-size: 1.2em;";const g=document.createElement("div");g.style.cssText=`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
  `,window.innerWidth<=480?(g.style.gridTemplateColumns="repeat(2, 1fr)",g.style.gap="8px"):window.innerWidth<=768&&(g.style.gridTemplateColumns="repeat(3, 1fr)",g.style.gap="8px"),[{name:"Twitter",icon:"🐦",color:"#1DA1F2",action:I=>kt()},{name:"Facebook",icon:"📘",color:"#1877F2",action:I=>It()},{name:"LinkedIn",icon:"💼",color:"#0A66C2",action:I=>Ct()},{name:"Reddit",icon:"🔶",color:"#FF4500",action:I=>Mt()},{name:"Bluesky",icon:"☁️",color:"#0085ff",action:I=>Pt()},{name:"Mastodon",icon:"🐘",color:"#563acc",action:I=>Lt()},..."share"in navigator?[{name:"Share+📷",icon:"📤",color:"#28a745",action:I=>Bt()}]:[],{name:"Copy Text",icon:"📋",color:"#666",action:I=>De(I)},{name:"Download📷",icon:"💾",color:"#0cf",action:I=>fe()}].forEach(I=>{const R=document.createElement("button");R.innerHTML=`<span style="font-size: 1.2em; margin-right: 4px;">${I.icon}</span>${I.name}`,R.style.cssText=`
      background: ${I.color};
      color: white;
      border: none;
      padding: 12px 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s;
      text-align: center;
      min-height: 44px;
      word-wrap: break-word;
      hyphens: auto;
    `,window.innerWidth<=480&&(R.style.fontSize="0.8em",R.style.padding="10px 6px",R.style.minHeight="40px"),R.onclick=Re=>I.action(Re),R.onmouseenter=()=>R.style.opacity="0.8",R.onmouseleave=()=>R.style.opacity="1",g.appendChild(R)}),m.appendChild(k),m.appendChild(g),i.appendChild(c),i.appendChild(m),s.appendChild(r),s.appendChild(i),o.appendChild(s),document.body.appendChild(o),o.onclick=I=>{I.target===o&&o.remove()}}function kt(){fe();const t=encodeURIComponent(K()),o=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),s=encodeURIComponent("indiegaming,webgames,platformer,javascript");window.open(`https://twitter.com/intent/tweet?text=${t}&url=${o}&hashtags=${s}`,"_blank","width=550,height=420")}function It(){fe();const t=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),o=encodeURIComponent(K());window.open(`https://www.facebook.com/sharer/sharer.php?u=${t}&quote=${o}`,"_blank","width=580,height=400")}function Ct(){fe();const t=encodeURIComponent(K()),o=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),s=encodeURIComponent(q?"My final score in Side-Scrolling Platformer!":"Check out my progress in Side-Scrolling Platformer!");window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${o}&title=${s}&summary=${t}`,"_blank","width=570,height=570")}function Mt(){fe();const t=encodeURIComponent(q?"My final score in Side-Scrolling Platformer!":"Reached level 25 in this amazing browser game!"),o=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://www.reddit.com/submit?title=${t}&text=${o}`,"_blank","width=600,height=500")}function Pt(){fe();const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://bsky.app/intent/compose?text=${t}`,"_blank","width=600,height=500")}function Lt(){fe();const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`),o=document.createElement("div");o.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 1001;
    display: flex;
    align-items: center;
    justify-content: center;
  `,o.innerHTML=`
    <div style="
      background: #222;
      color: #fff;
      padding: 24px;
      border-radius: 12px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    ">
      <h3 style="margin: 0 0 16px 0; color: #0cf;">Share to Mastodon</h3>
      <p style="margin: 0 0 16px 0; color: #ccc; font-size: 0.9em;">
        Enter your Mastodon instance (e.g., mastodon.social):
      </p>
      <input
        type="text"
        id="mastodon-instance"
        placeholder="mastodon.social"
        style="
          width: 100%;
          padding: 8px 12px;
          margin-bottom: 16px;
          border: 1px solid #666;
          border-radius: 4px;
          background: #333;
          color: #fff;
          font-size: 1em;
        "
      />
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button onclick="this.parentElement.parentElement.parentElement.remove()"
          style="
            padding: 8px 16px;
            background: #666;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Cancel</button>
        <button id="mastodon-share-btn"
          style="
            padding: 8px 16px;
            background: #0cf;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">Share</button>
      </div>
    </div>
  `,document.body.appendChild(o);const s=document.getElementById("mastodon-instance"),r=document.getElementById("mastodon-share-btn");r&&s&&(r.onclick=()=>{let a=s.value.trim();a||(a="mastodon.social"),a=a.replace(/^https?:\/\//,""),window.open(`https://${a}/share?text=${t}`,"_blank","width=600,height=500"),o.remove()},s.addEventListener("keypress",a=>{a.key==="Enter"&&r.click()})),o.onclick=a=>{a.target===o&&o.remove()}}async function Bt(){if(navigator.share)try{const t=Fe(),s=await(await fetch(t)).blob(),r=new File([s],`platformer-level-${B}-score-${v}.png`,{type:"image/png"});await navigator.share({title:q?"My Side-Scrolling Platformer Score!":"Victory in Side-Scrolling Platformer!",text:K(),url:"https://github.com/commjoen/generated-game-experiment",files:[r]})}catch(t){console.error("Web Share API failed:",t),await De()}else await De()}async function De(t){const o=K()+`

Play at: https://github.com/commjoen/generated-game-experiment

📎 Tip: The screenshot was automatically downloaded when you clicked any social media button above!`;try{await navigator.clipboard.writeText(o);const s=t?.target;if(s){const r=s.innerHTML;s.innerHTML='<span style="font-size: 1.2em; margin-right: 4px;">✅</span>Copied!',s.style.background="#28a745",setTimeout(()=>{s.innerHTML=r,s.style.background="#666"},2e3)}}catch(s){console.error("Failed to copy to clipboard:",s);const r=document.createElement("div");r.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #222;
      color: #fff;
      padding: 20px;
      border-radius: 8px;
      z-index: 1001;
      max-width: 90vw;
    `,r.innerHTML=`
      <h3>Copy this text:</h3>
      <textarea readonly style="width: 300px; height: 80px; background: #333; color: #fff; border: 1px solid #666; padding: 8px;">${o}</textarea>
      <br><button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 8px 16px; background: #0cf; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `,document.body.appendChild(r),r.querySelector("textarea").select()}}function fe(){const t=Fe(),o=document.createElement("a");o.download=`platformer-game-level-${B}-score-${v}.png`,o.href=t,o.click()}function At(){ae(v+500),he(v);const t=document.createElement("div");t.id="victory-modal",t.style.cssText=`
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.8);
    z-index: 999;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  `;const o=document.createElement("div");o.style.cssText=`
    background: linear-gradient(135deg, #222, #333);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    max-width: 600px;
    width: 100%;
    color: #fff;
    position: relative;
    text-align: center;
    padding: 40px 20px;
    border: 2px solid #ffd700;
  `,o.innerHTML=`
    <h1 style="margin: 0 0 16px 0; font-size: 3em; color: #ffd700; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">🏆 VICTORY! 🏆</h1>
    <h2 style="margin: 0 0 20px 0; font-size: 1.8em; color: #0cf;">Congratulations!</h2>
    <p style="margin: 0 0 16px 0; font-size: 1.3em; line-height: 1.4;">
      You've reached <strong>Level 25</strong> and conquered the platformer!
    </p>
    <p style="margin: 0 0 24px 0; font-size: 1.2em; color: #ccc;">
      Final Score: <span style="color: #ffd700; font-weight: bold;">${v} points</span>
    </p>
    <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 32px;">
      <button id="victory-share-btn" style="
        background: #0cf;
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: background 0.2s;
      ">
        📤 Share Victory
      </button>
      <button id="victory-continue-btn" style="
        background: #28a745;
        color: #fff;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        transition: background 0.2s;
      ">
        Continue Playing
      </button>
      <button id="victory-restart-btn" style="
        background: #222;
        color: #fff;
        border: 2px solid #0cf;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 1.1em;
        font-weight: bold;
        transition: all 0.2s;
      ">
        New Game
      </button>
    </div>
  `,t.appendChild(o),document.body.appendChild(t);const s=document.getElementById("victory-share-btn"),r=document.getElementById("victory-continue-btn"),a=document.getElementById("victory-restart-btn");s&&(s.onclick=()=>{Qe()},s.onmouseenter=()=>s.style.background="#0a9fd9",s.onmouseleave=()=>s.style.background="#0cf"),r&&(r.onclick=()=>{t.remove(),B=25,(async()=>(await Ae(),ke(),be(),re=!1,ye=0))()},r.onmouseenter=()=>r.style.background="#218838",r.onmouseleave=()=>r.style.background="#28a745"),a&&(a.onclick=()=>{t.remove(),Ue()},a.onmouseenter=()=>{a.style.background="#0cf",a.style.color="#222"},a.onmouseleave=()=>{a.style.background="#222",a.style.color="#fff"}),be()}function Rt(){if(u.length=0,V.length=0,w.length=0,N.length=0,X.length=0,J.length=0,le.length=0,B++,B>=25){At();return}let t=!1;if(te?E=ne:B===1?E="horizontal":B%5===0?(Ht(),t=!0):B%3===0?E="vertical":E="horizontal",t){be(),re=!1,ye=0;return}localStorage.setItem("levelType",E),W&&W instanceof HTMLInputElement&&(W.checked=te&&ne==="vertical"),Ae(),ke(),Q?(ue=we(),localStorage.setItem("fixedGradientColors",JSON.stringify(ue))):Z?(xe=we(),localStorage.setItem("scrollGradientColors",JSON.stringify(xe))):O&&Ze(),be(),re=!1,ye=0}function Ye(){be(),re=!0,ye=120}function zt(t){if(q)return;if(re){ye--,ye<=0&&Rt();return}if(F>0){F--;return}vt(),n.vx=0;const o=Le*(ie("speed_boost")?1.5:1);(b.ArrowLeft||b.KeyA)&&(n.vx=-Xe*o*t*60),(b.ArrowRight||b.KeyD)&&(n.vx=Xe*o*t*60);const s=b.ArrowUp||b.Space||b.KeyW;ve>0&&ve--,s&&ve===0&&(n.onGround?(n.vy=-$e,n.onGround=!1,n.hasDoubleJump&&(n.canDoubleJump=!0),ve=8):n.hasDoubleJump&&n.canDoubleJump&&(n.vy=-$e,n.canDoubleJump=!1,ve=8));const r=b.KeyT;r&&!Ge&&(j=!j,localStorage.setItem("speedUnlocked",String(j)),Le=j?2:1),Ge=r;const a=b.KeyE;if(a&&!He){if(n.eatenEnemy&&d.type==="none")wt();else if(d.type==="none"){const l=ut();l?(xt(l),L?ae(1):(v++,ae(1),he(v))):bt()}}He=a,n.vy+=lt*t*60,n.x+=n.vx,n.y+=n.vy,n.onGround=!1;for(const l of u)if("isSlope"in l&&l.isSlope){if(n.x+n.width>l.x&&n.x<l.x+l.width){const i=(n.x+n.width/2-l.x)/l.width,c=l.y+(l.endY-l.y)*i;n.y+n.height>c&&n.y+n.height<c+l.height&&n.vy>=0&&(n.y=c-n.height,n.vy=0,n.onGround=!0,n.canDoubleJump=n.hasDoubleJump)}}else n.y+n.height>l.y&&n.y+n.height<l.y+l.height&&n.x+n.width>l.x&&n.x<l.x+l.width&&n.vy>=0&&(n.y=l.y-n.height,n.vy=0,n.onGround=!0,n.canDoubleJump=n.hasDoubleJump);for(const l of V)Ie(n,l)&&(n.y+n.height-n.vy<=l.y?(n.y=l.y-n.height,n.vy=0,n.onGround=!0):n.x+n.width-n.vx<=l.x?n.x=l.x-n.width:n.x-n.vx>=l.x+l.width?n.x=l.x+l.width:n.y-n.vy>=l.y+l.height&&(n.y=l.y+l.height,n.vy=0));for(const l of X)l.x+=l.dx,(l.x>l.startX+l.range||l.x<l.startX)&&(l.dx*=-1);for(const l of le)if(!l.hasSpawnedEnemy){let i=!1;if(E==="horizontal"?i=l.x+l.width>T&&l.x<T+h.width:i=l.y+l.height>M&&l.y<M+h.height,i){const c=u.find(f=>f.x<=l.x+l.width/2&&f.x+f.width>=l.x+l.width/2&&Math.abs(f.y-C)<10);if(c){const f=Math.random()<.5?"square":"circle";J.push({x:l.x+l.width/2-15,y:l.y+10,width:30,height:30,dx:1+Math.random()*2,dy:-8,range:Math.min(c.width-80,120),startX:l.x+l.width/2-15,alive:!0,id:ct(),isJumpingOut:!0,type:f}),l.hasSpawnedEnemy=!0}}}for(const l of J)if(l.alive)if(l.isJumpingOut){l.y+=l.dy,l.dy+=.5;for(const i of u)if(l.y+l.height>=i.y&&l.y+l.height<=i.y+i.height&&l.x+l.width>i.x&&l.x<i.x+i.width&&Math.abs(i.y-C)<10){l.y=i.y-l.height,l.dy=0,l.isJumpingOut=!1;break}}else l.x+=l.dx,(l.x>l.startX+l.range||l.x<l.startX)&&(l.dx*=-1);for(const l of X)n.y+n.height>l.y&&n.y+n.height<l.y+l.height&&n.x+n.width>l.x&&n.x<l.x+l.width&&n.vy>=0&&(n.y=l.y-n.height,n.vy=0,n.onGround=!0,n.x+=l.dx);for(const l of w)if(!l.collected&&Ie(n,l)){if(l.type==="doublejump"&&n.hasDoubleJump||l.type==="grow"&&n.growLevel>=3)continue;if(l.collected=!0,L&&$.collectItem(l.id),l.type==="coin"){const i=ie("lucky_coins")?2:1;L?ae(i):(v+=i,ae(i),he(v))}else l.type==="heart"?U<5&&U++:l.type==="doublejump"?(n.hasDoubleJump=!0,n.canDoubleJump=!1):l.type==="grow"&&(n.growLevel<3&&n.growLevel++,ge())}for(const l of N)if(Ie(n,l)){Ce();break}for(const l of J)if(l.alive&&!(F>0||d.targetEnemy===l)&&Ie(n,l)){if(l.type==="square")if(n.vy>0&&n.y<l.y)l.alive=!1,n.vy=-8,L?ae(1):(v++,ae(1),he(v));else{n.growLevel>0?(n.growLevel=0,ge(),F=30):Ce();break}else if(l.type==="circle"){n.growLevel>0?(n.growLevel=0,ge(),F=30):Ce();break}}if(E==="horizontal"&&n.y>h.height+100&&Ce(),E==="horizontal"?n.x+n.width>=pt&&!re&&Ye():E==="vertical"&&!re&&n.x+n.width>S.x&&n.x<S.x+S.width&&n.y+n.height>S.y&&n.y<S.y+S.height&&Ye(),E==="vertical"?(M=n.y-h.height/2+n.height/2,M=Math.max(0,Math.min(M,P-h.height)),T=0):(T=n.x-h.width/2+n.width/2,T=Math.max(0,Math.min(T,se-h.width)),M=0),E==="vertical"){const l=Math.max(...u.map(c=>c.width)),i=Math.max(h.width,l);h.width/i,n.x=Math.max(0,Math.min(n.x,i-n.width))}else n.x<0&&(n.x=0),n.x+n.width>se&&(n.x=se-n.width);L&&Date.now()-We>50&&($.updatePlayerPosition(n.x,n.y,n.width,n.height,n.growLevel),We=Date.now())}function $t(){return/Tesla|QtCarBrowser/i.test(navigator.userAgent)}let Pe=localStorage.getItem("teslaMode")==="true";function Dt(){return $t()||Pe||/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)}let Q=localStorage.getItem("fixedGradient")==="true",Z=localStorage.getItem("scrollGradient")==="true",ue=JSON.parse(localStorage.getItem("fixedGradientColors")||"null")||we(),xe=JSON.parse(localStorage.getItem("scrollGradientColors")||"null")||we(),O=localStorage.getItem("imageBg")==="true",oe=localStorage.getItem("imageBgUrl")||null,ee=null,Te=!1;function Ze(){fetch("https://pixabay.com/api/?key=51252753-0f1aa9c83b326091b3ad96f88&q=landscape&image_type=photo&orientation=horizontal&safesearch=true&per_page=50").then(s=>s.json()).then(s=>{if(s.hits&&s.hits.length>0){const r=Math.floor(Math.random()*s.hits.length);oe=s.hits[r].largeImageURL,oe&&(localStorage.setItem("imageBgUrl",oe),et())}}).catch(()=>{oe=null,Te=!1})}function et(){oe&&(ee=new window.Image,ee.crossOrigin="anonymous",ee.onload=()=>{Te=!0},ee.onerror=()=>{Te=!1},ee.src=oe)}oe&&et();function we(){function t(){return`hsl(${Math.floor(Math.random()*360)}, 70%, 75%)`}return[t(),t()]}function ze(){localStorage.setItem("fixedGradient",String(Q)),localStorage.setItem("scrollGradient",String(Z)),localStorage.setItem("imageBg",String(O)),localStorage.setItem("fixedGradientColors",JSON.stringify(ue)),localStorage.setItem("scrollGradientColors",JSON.stringify(xe)),O||(localStorage.removeItem("imageBgUrl"),oe=null,ee=null,Te=!1)}const _t="v0.4.2-5-gcba6d81",Ut="cba6d81",Xt="main",jt="v0.4.2",Jt="2025-08-13T09:41:26.033Z";window.addEventListener("DOMContentLoaded",()=>{const t=document.getElementById("settings-btn"),o=document.getElementById("settings-modal"),s=document.getElementById("close-settings"),r=document.getElementById("fixed-gradient-toggle"),a=document.getElementById("scroll-gradient-toggle"),l=document.getElementById("image-bg-toggle"),i=document.getElementById("speed-unlock-toggle"),c=document.getElementById("fps-counter-toggle"),f=document.getElementById("tesla-mode-toggle"),y=document.getElementById("multiplayer-toggle");_=document.getElementById("player-name-input"),W=document.getElementById("level-type-toggle"),t&&o&&s&&r&&a&&l&&i&&c&&f&&y&&_&&W&&(t.addEventListener("click",()=>{o.style.display="flex";const g=document.getElementById("github-star-btn");g&&(g.style.display="none"),r.checked=Q,a.checked=Z,l.checked=O,i.checked=j,c.checked=Me,f.checked=Pe,y.checked=L,_&&(_.value=z),W&&(W.checked=te&&ne==="vertical")}),s.addEventListener("click",()=>{o.style.display="none";const g=document.getElementById("github-star-btn");g&&(g.style.display="flex")}),r.addEventListener("change",()=>{r.checked?(Q=!0,Z=!1,O=!1,a.checked=!1,l.checked=!1,ue=we()):Q=!1,ze()}),a.addEventListener("change",()=>{a.checked?(Z=!0,Q=!1,O=!1,r.checked=!1,l.checked=!1,xe=we()):Z=!1,ze()}),l.addEventListener("change",()=>{l.checked?(O=!0,Q=!1,Z=!1,r.checked=!1,a.checked=!1,Ze()):O=!1,ze()}),i.addEventListener("change",()=>{j=i.checked,localStorage.setItem("speedUnlocked",String(j)),Le=j?2:1}),c.addEventListener("change",()=>{Me=c.checked,localStorage.setItem("showFpsCounter",String(Me))}),f.addEventListener("change",()=>{Pe=f.checked,localStorage.setItem("teslaMode",String(Pe)),_e()}),y.addEventListener("change",()=>{L=y.checked,localStorage.setItem("multiplayerEnabled",String(L)),window.location.reload()}),W.addEventListener("change",()=>{te=W.checked,te?(ne="vertical",E="vertical"):(ne="horizontal",E="horizontal"),localStorage.setItem("manualLevelType",String(te)),localStorage.setItem("manualLevelTypeValue",ne),localStorage.setItem("levelType",E),Ue()}),_&&_.addEventListener("input",()=>{z=_.value.slice(0,12),localStorage.setItem("playerName",z)}));const x=document.getElementById("shop-btn"),p=document.getElementById("shop-modal"),m=document.getElementById("close-shop");x&&p&&m&&(x.addEventListener("click",()=>{yt()}),m.addEventListener("click",()=>{p.style.display="none";const g=document.getElementById("github-star-btn");g&&(g.style.display="flex")}));const k=document.querySelector(".version-string, #version, .version, #version-string");k&&(k.textContent=`Version: ${_t} (tag: ${jt}, ${Xt}, ${Ut}, built: ${Jt})`),_e()});function _e(){const t=document.getElementById("onscreen-controls"),o=document.getElementById("desktop-copyright"),s=Dt();t&&(t.style.display=s?"flex":"none"),o&&(o.style.display=s?"none":"block")}function Wt(){const t=document.getElementById("btn-left"),o=document.getElementById("btn-right"),s=document.getElementById("btn-jump"),r=document.getElementById("btn-action");t&&o&&s&&r&&(t.addEventListener("touchstart",a=>{a.preventDefault(),b.ArrowLeft=!0},{passive:!1}),t.addEventListener("touchend",a=>{a.preventDefault(),b.ArrowLeft=!1},{passive:!1}),o.addEventListener("touchstart",a=>{a.preventDefault(),b.ArrowRight=!0},{passive:!1}),o.addEventListener("touchend",a=>{a.preventDefault(),b.ArrowRight=!1},{passive:!1}),s.addEventListener("touchstart",a=>{a.preventDefault(),b.Space=!0},{passive:!1}),s.addEventListener("touchend",a=>{a.preventDefault(),b.Space=!1},{passive:!1}),t.addEventListener("mousedown",a=>{a.preventDefault(),b.ArrowLeft=!0}),t.addEventListener("mouseup",a=>{a.preventDefault(),b.ArrowLeft=!1}),o.addEventListener("mousedown",a=>{a.preventDefault(),b.ArrowRight=!0}),o.addEventListener("mouseup",a=>{a.preventDefault(),b.ArrowRight=!1}),s.addEventListener("mousedown",a=>{a.preventDefault(),b.Space=!0}),s.addEventListener("mouseup",a=>{a.preventDefault(),b.Space=!1}),r.addEventListener("touchstart",a=>{a.preventDefault(),b.KeyE=!0},{passive:!1}),r.addEventListener("touchend",a=>{a.preventDefault(),b.KeyE=!1},{passive:!1}),r.addEventListener("mousedown",a=>{a.preventDefault(),b.KeyE=!0}),r.addEventListener("mouseup",a=>{a.preventDefault(),b.KeyE=!1}))}Wt();_e();let me=[],Be=0;function be(){me=[];for(let t=0;t<60;t++){const o=Math.random()*Math.PI*2,s=4+Math.random()*3;me.push({x:h.width/2+(Math.random()-.5)*100,y:h.height/2-80+(Math.random()-.5)*40,vx:Math.cos(o)*s,vy:Math.sin(o)*s-2,color:`hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`,size:8+Math.random()*8,life:60+Math.random()*40,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.2})}Be=60}function Ot(){for(const t of me)t.x+=t.vx,t.y+=t.vy,t.vy+=.15,t.angle+=t.spin,t.life--;me=me.filter(t=>t.life>0&&t.y<h.height+40),Be>0&&Be--}function Yt(){for(const t of me)e.save(),e.translate(t.x,t.y),e.rotate(t.angle),e.fillStyle=t.color,e.fillRect(-t.size/2,-t.size/6,t.size,t.size/3),e.restore()}function Gt(){if(O&&Te&&ee){const i=ee,c=Math.max(h.width/i.width,h.height/i.height),f=i.width*c,y=i.height*c;let x=-T%f;x>0&&(x-=f);for(let p=x;p<h.width;p+=f)e.drawImage(i,p,0,f,y)}else if(Q){const i=e.createLinearGradient(0,0,0,h.height);i.addColorStop(0,ue[0]),i.addColorStop(1,ue[1]),e.fillStyle=i,e.fillRect(0,0,h.width,h.height)}else if(Z){const i=e.createLinearGradient(-T,0,se-T,h.height);i.addColorStop(0,xe[0]),i.addColorStop(1,xe[1]),e.fillStyle=i,e.fillRect(0,0,h.width,h.height)}else e.fillStyle="#87ceeb",e.fillRect(0,0,h.width,h.height);e.save();let t=1;if(E==="vertical"){const i=Math.max(...u.map(f=>f.width)),c=Math.max(h.width,i);t=h.width/c,T=Math.max(0,Math.min(n.x+n.width/2-h.width/(2*t),c-h.width/t)),M=Math.max(0,Math.min(n.y+n.height/2-h.height/(2*t),P-h.height/t)),e.scale(t,t)}e.translate(-T,-M),e.fillStyle="#654321";let o=-1;if(E==="vertical"&&u.length>0){let i=-1/0;for(let c=0;c<u.length;c++)u[c].y>i&&(i=u[c].y,o=c)}for(let i=0;i<u.length;i++){const c=u[i];"isSlope"in c&&c.isSlope?(e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(c.x+c.width,c.endY),e.lineTo(c.x+c.width,c.endY+c.height),e.lineTo(c.x,c.y+c.height),e.closePath(),e.fill()):e.fillRect(c.x,c.y,c.width,c.height),E==="vertical"&&i===o&&(e.save(),e.font="bold 48px sans-serif",e.fillStyle="#fff",e.textAlign="center",e.textBaseline="middle",e.globalAlpha=.85,e.fillText("↑",c.x+c.width/2,c.y+c.height/2),e.globalAlpha=1,e.restore())}e.fillStyle="#888";for(const i of X)e.fillRect(i.x,i.y,i.width,i.height);e.fillStyle="#b5651d";for(const i of V)e.fillRect(i.x,i.y,i.width,i.height);for(const i of w)i.collected||(i.type==="coin"?(e.fillStyle="#0cf",e.beginPath(),e.arc(i.x+i.width/2,i.y+i.height/2,10,0,2*Math.PI),e.fill()):i.type==="heart"?(e.save(),e.translate(i.x+i.width/2,i.y+i.height/2),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()):i.type==="doublejump"?(e.save(),e.translate(i.x+i.width/2,i.y+i.height/2),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore()):i.type==="grow"&&(e.save(),e.translate(i.x+i.width/2,i.y+i.height/2),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()));e.fillStyle="#e33";for(const i of N)e.beginPath(),e.moveTo(i.x,i.y+i.height),e.lineTo(i.x+i.width/2,i.y),e.lineTo(i.x+i.width,i.y+i.height),e.closePath(),e.fill();e.fillStyle="#0a8000";for(const i of le){e.fillRect(i.x,i.y,i.width,i.height),e.fillStyle="#064000";const c=Math.max(i.y,C-15);e.fillRect(i.x+4,c,i.width-8,15),e.fillStyle="#0c8000",e.fillRect(i.x+8,i.y+8,3,i.height-16),e.fillRect(i.x+i.width-11,i.y+8,3,i.height-16),e.fillRect(i.x+4,i.y+i.height/4,i.width-8,2),e.fillRect(i.x+4,i.y+i.height/2,i.width-8,2),e.fillRect(i.x+4,i.y+3*i.height/4,i.width-8,2),e.fillStyle="#0a8000"}for(const i of J)if(i.alive&&d.targetEnemy!==i)if(i.type==="circle"){e.fillStyle="#f06",e.beginPath(),e.arc(i.x+i.width/2,i.y+i.height/2,i.width/2,0,2*Math.PI),e.fill(),e.fillStyle="#000";const c=3;e.fillRect(i.x+8,i.y+8,c,c),e.fillRect(i.x+i.width-11,i.y+8,c,c)}else{e.fillStyle="#f90",e.fillRect(i.x,i.y,i.width,i.height),e.fillStyle="#000";const c=4;e.fillRect(i.x+6,i.y+8,c,c),e.fillRect(i.x+i.width-10,i.y+8,c,c)}if(St(),e.restore(),F>0&&Math.floor(F/5)%2===0?e.globalAlpha=.3:e.globalAlpha=1,e.save(),G==="SQUARE")e.fillStyle="#ff0",e.fillRect(n.x-T,n.y-M,n.width,n.height);else if(e.font=`${Math.min(n.width,n.height)}px serif`,e.textAlign="center",["🟡","🔴","🔵","🟢"].includes(G)){const c=Math.round(n.height*.4);e.textBaseline="middle",e.fillText(G,n.x-T+n.width/2,n.y-M+n.height-c)}else e.textBaseline="middle",e.fillText(G,n.x-T+n.width/2,n.y-M+n.height/2);e.restore(),e.globalAlpha=1,e.save(),e.fillStyle="#0cf";let s=v,r=[];for(const i of D.values())typeof i.score=="number"&&i.score>s?(s=i.score,r=[i.id]):typeof i.score=="number"&&i.score===s&&r.push(i.id);v===s&&r.push("self");for(const i of D.values())e.fillRect(i.x-T,i.y-M,i.width,i.height),L&&D.size>0&&i.name&&(e.save(),e.font="16px sans-serif",r.includes(i.id)?(e.fillStyle="gold",e.fillText("👑",i.x-T+i.width/2,i.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(i.name,i.x-T+i.width/2,i.y-8),e.restore());e.restore(),L&&D.size>0&&(e.save(),e.font="16px sans-serif",r.includes("self")?(e.fillStyle="gold",e.fillText("👑",n.x-T+n.width/2,n.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(z||"Player",n.x-T+n.width/2,n.y-8),e.restore()),e.save(),e.fillStyle="#fff",e.font="20px sans-serif",e.textAlign="left",e.fillText(`Score: ${v}`,20,30),e.fillText(`Top Score: ${Ee}`,20,60),e.fillText(`Level: ${B}`,20,90),e.fillStyle="#ffd700",e.fillText(`Total Points: ${H}`,20,120),e.fillStyle="#fff";let a=150;if(Me&&(e.fillText(`FPS: ${Ne}`,20,a),a+=30),j&&(e.fillStyle="#0cf",e.fillText(`Speed: ${Le}x`,20,a),e.fillStyle="#fff"),L&&D.size>0){const i=new Map;i.set($.currentPlayerId,{id:$.currentPlayerId,name:z||"Player",score:v,isSelf:!0});for(const f of D.values())f.id!==$.currentPlayerId&&i.set(f.id,{id:f.id,name:f.name||"Player",score:typeof f.score=="number"?f.score:0,isSelf:!1});const c=Array.from(i.values());c.sort((f,y)=>y.score-f.score),e.save(),e.globalAlpha=.85,e.fillStyle="#222",e.fillRect(h.width-240,20,220,36+32*Math.min(5,c.length)),e.globalAlpha=1,e.font="18px sans-serif",e.fillStyle="#fff",e.textAlign="left",e.fillText("Leaderboard",h.width-225,44);for(let f=0;f<Math.min(5,c.length);f++){const y=c[f];e.font=y.isSelf?"bold 18px sans-serif":"18px sans-serif",e.fillStyle=y.isSelf?"#0cf":f===0?"gold":"#fff";const x=f===0?"👑 ":"";e.fillText(`${x}${y.name.slice(0,12)}`,h.width-225,76+f*32),e.textAlign="right",e.fillText(String(y.score),h.width-30,76+f*32),e.textAlign="left"}e.restore()}for(let i=0;i<U;i++)e.save(),e.translate(20+i*28,120),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore();let l=20+U*28+20;n.hasDoubleJump&&(e.save(),e.translate(l,120),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore(),l+=36);for(let i=0;i<n.growLevel;i++)e.save(),e.translate(l,120),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),l+=36;n.eatenEnemy&&(e.save(),e.translate(l,120),n.eatenEnemy.type==="circle"&&(e.fillStyle="#f06",e.beginPath(),e.arc(0,0,10,0,2*Math.PI),e.fill(),e.strokeStyle="#fff",e.lineWidth=2,e.stroke()),e.restore(),l+=36),e.restore(),q?(e.save(),e.fillStyle="rgba(0, 0, 0, 0.7)",e.fillRect(h.width/2-200,h.height/2-100,400,200),e.strokeStyle="#444",e.lineWidth=2,e.strokeRect(h.width/2-200,h.height/2-100,400,200),e.font="bold 48px sans-serif",e.fillStyle="#e33",e.textAlign="center",e.fillText("Game Over",h.width/2,h.height/2-60),e.font="32px sans-serif",e.fillStyle="#fff",e.fillText(`Score: ${v}`,h.width/2,h.height/2-10),e.fillText(`Top Score: ${Ee}`,h.width/2,h.height/2+40),v>Number(localStorage.getItem("topScore")||"0")&&(e.font="bold 28px sans-serif",e.fillStyle="#0cf",e.fillText("You beat your own top score!",h.width/2,h.height/2+90),Be===0&&be()),e.restore(),qe()):(Tt(),Ke()),e.save(),e.translate(-T,-M),e.fillStyle="#fff",e.fillRect(S.x,S.y,8,S.height),e.beginPath(),e.moveTo(S.x+8,S.y),e.lineTo(S.x+8+32,S.y+16),e.lineTo(S.x+8,S.y+32),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),Yt()}function tt(){const t=performance.now(),o=t-je;Gt(),o>=1e3/at&&(Je++,Je%60===0&&(Ne=Math.round(1e3/(o/60))),zt(o/1e3),Ot(),je=t),requestAnimationFrame(tt)}const b={};let Ge=!1,He=!1,ve=0;window.addEventListener("keydown",t=>{b[t.code]=!0});window.addEventListener("keyup",t=>{b[t.code]=!1});L?(async()=>{try{await $.initialize()?(console.log("Multiplayer enabled!"),$.onGameStateUpdate(o=>{D.clear(),o.players.forEach(s=>{s.id!==$.currentPlayerId?D.set(s.id,s):(s.name&&s.name!==z&&(z=s.name,localStorage.setItem("playerName",z),_&&(_.value=z)),typeof s.score=="number"&&(v=s.score,he(v)))})}),$.onPlayerJoined(o=>{console.log(`Player ${o} joined the game!`)}),$.onPlayerLeft(o=>{console.log(`Player ${o} left the game`),D.delete(o)}),$.onPlayerUpdate((o,s,r,a)=>{if(D.has(o)){const l=D.get(o);Object.assign(l,s),typeof r=="number"&&(l.score=r),typeof a=="string"&&(l.name=a)}else D.set(o,{id:o,...s,score:r,name:a});o===$.currentPlayerId&&(typeof r=="number"&&(v=r,he(v)),typeof a=="string"&&a!==z&&(z=a,localStorage.setItem("playerName",z),_&&(_.value=z)))})):console.log("Running in single-player mode")}catch{console.log("Multiplayer initialization failed, continuing in single-player mode")}})():console.log("Running in single-player mode");tt();function Ht(){u.length=0,V.length=0,w.length=0,N.length=0,X.length=0,J.length=0,le.length=0,u.push({x:0,y:P,width:h.width,height:50});const t=60,o=60;for(let g=P-100;g>0;g-=o)for(let A=20;A<h.width-20;A+=t)w.push({x:A,y:g,width:20,height:20,collected:!1,type:"coin",id:Y("coin")});const s=80,r=20,a=60,l=P-60,i=80,c=[40,h.width/2-s/2,h.width-s-40];let f=0;for(let g=l;g>i;g-=a){let A;g>P-300||g>P/2?A=c:A=[40+f%2*(h.width-s-80)];for(const I of A)X.push({x:I,y:g,width:s,height:r,dx:f%2===0?2:-2,range:120,startX:I}),f++}const x=13*8,p=50,m=40+x,k={x:0,y:m,width:h.width,height:p};if(u.push(k),S.x=h.width/2-S.width/2,S.y=m-80+p,n.x=50,n.y=P-n.height-10,n.vx=0,n.vy=0,ge(),M=Math.max(0,P-h.height),E="vertical",L&&w.length>0){const g=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(A=>({id:A.id,type:A.type}))})})}catch{}}}window.addEventListener("resize",()=>{const t=document.getElementById("share-btn"),o=document.getElementById("restart-btn");t&&t.style.display!=="none"&&(window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px")),o&&o.style.display!=="none"&&(window.innerWidth<=768?(o.style.top="calc(50% + 140px)",o.style.left="calc(50% + 80px)",o.style.transform="translateX(0)",o.style.fontSize="1.2em",o.style.padding="10px 16px"):(o.style.top="calc(50% + 160px)",o.style.left="50%",o.style.transform="translateX(-50%)",o.style.fontSize="2em",o.style.padding="16px 32px"))});
