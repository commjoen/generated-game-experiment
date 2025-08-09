(function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function s(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(a){if(a.ep)return;a.ep=!0;const i=s(a);fetch(a.href,i)}})();class tt{constructor(){this.ws=null,this.isConnected=!1,this.isHost=!1,this.reconnectAttempts=0,this.maxReconnectAttempts=3,this.reconnectDelay=1e3,this.playerId=this.generatePlayerId()}generatePlayerId(){return"player_"+Math.random().toString(36).substr(2,9)}async checkServerAvailable(l=this.getDefaultServerUrl()){try{if(l==="/ws")return(await fetch("/mp/health",{method:"GET",signal:AbortSignal.timeout(2e3)})).ok;const s=l.replace("ws://","http://").replace("wss://","https://");let r;return s.includes("/ws")?r=s.replace("/ws","/mp/health"):r=`${s}/health`,(await fetch(r,{method:"GET",signal:AbortSignal.timeout(2e3)})).ok}catch{return console.log("Multiplayer server not available, running in single-player mode"),!1}}getDefaultServerUrl(){const l=window.location.protocol==="https:"?"wss:":"ws:",s=window.location.host,r=window.location.hostname;if(r==="onrender.com"||r.endsWith(".onrender.com")||!s.includes("localhost"))return"/ws";if(s.includes("localhost:5173")||s.includes("127.0.0.1:5173"))return"ws://localhost:3001";if(s.includes(":8080")||r==="localhost"&&s.includes(":80")){const a=s.split(":")[0];return`${l}//${a}:3001`}return`${l}//${s}:3001`}async initialize(l=this.getDefaultServerUrl()){try{return await this.checkServerAvailable(l)?(this.ws=new WebSocket(l),new Promise(r=>{if(!this.ws){r(!1);return}const a=setTimeout(()=>{console.log("Connection timeout, falling back to single-player mode"),this.disconnect(),r(!1)},5e3);this.ws.onopen=()=>{clearTimeout(a),this.isConnected=!0,this.reconnectAttempts=0,console.log("Connected to multiplayer server");let i="";try{i=localStorage.getItem("playerName")||""}catch{}this.send({type:"join",playerId:this.playerId,name:i,timestamp:Date.now()}),r(!0)},this.ws.onmessage=i=>{try{const o=JSON.parse(i.data);this.handleMessage(o)}catch(o){console.error("Error parsing message:",o)}},this.ws.onclose=()=>{this.isConnected=!1,console.log("Disconnected from multiplayer server"),this.attemptReconnect(l)},this.ws.onerror=i=>{clearTimeout(a),console.log("WebSocket error, falling back to single-player mode"),this.isConnected=!1,r(!1)}})):(console.log("Multiplayer server not available, continuing in single-player mode"),!1)}catch{return console.log("Failed to initialize multiplayer, continuing in single-player mode"),!1}}attemptReconnect(l){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`),setTimeout(()=>{this.initialize(l)},this.reconnectDelay*this.reconnectAttempts)):console.log("Max reconnection attempts reached, continuing in single-player mode")}handleMessage(l){switch(l.type){case"gameState":this.onStateUpdate&&this.onStateUpdate(l.gameState);break;case"playerJoined":l.playerId===this.playerId&&(this.isHost=l.isHost||!1),this.onPlayerJoin&&this.onPlayerJoin(l.playerId);break;case"playerLeft":this.onPlayerLeave&&this.onPlayerLeave(l.playerId);break;case"playerUpdate":this._onPlayerUpdate&&this._onPlayerUpdate(l.playerId,l.position,l.score,l.name);break;case"itemCollected":this._onPlayerUpdate&&this._onPlayerUpdate(l.playerId,{},l.score,l.name);break}}send(l){if(this.ws&&this.isConnected)try{this.ws.send(JSON.stringify(l))}catch(s){console.error("Error sending message:",s),this.isConnected=!1}}updatePlayerPosition(l,s,r,a,i){this.isConnected&&this.send({type:"playerUpdate",playerId:this.playerId,position:{x:l,y:s,width:r,height:a,growLevel:i},timestamp:Date.now()})}collectItem(l){this.isConnected&&this.send({type:"collectItem",playerId:this.playerId,collectibleId:l,timestamp:Date.now()})}onGameStateUpdate(l){this.onStateUpdate=l}onPlayerJoined(l){this.onPlayerJoin=l}onPlayerLeft(l){this.onPlayerLeave=l}onPlayerUpdate(l){this._onPlayerUpdate=l}get connected(){return this.isConnected}get currentPlayerId(){return this.playerId}get isHostPlayer(){return this.isHost}disconnect(){this.ws&&(this.ws.close(),this.ws=null),this.isConnected=!1}ping(){this.isConnected&&this.send({type:"ping",timestamp:Date.now()})}}const z=new tt,h=document.getElementById("gameCanvas"),e=h.getContext("2d"),nt=.5,ze=5,Ae=13,k=400,ot=60;let _e=0,Ue=0,Ge=0,J=localStorage.getItem("speedUnlocked")==="true",ke=J?2:1,Te=localStorage.getItem("showFpsCounter")!=="false";const se=3200;let T=0,it=0;function W(t){return`${t}_${Date.now()}_${it++}`}let lt=0;function at(){return`enemy_${Date.now()}_${lt++}`}let st=0;function rt(){return`tube_${Date.now()}_${st++}`}const w=[],V=[],X=[],Y=[],ie=[];let S={x:0,y:0,width:24,height:80};const n={x:100,y:k-50,width:40,height:50,vx:0,vy:0,onGround:!1,hasDoubleJump:!1,growLevel:0,canDoubleJump:!1,eatenEnemy:null},d={type:"none",progress:0,duration:1e3,startTime:0,targetEnemy:null,startX:0,startY:0,endX:0,endY:0};let _=new Map,L=localStorage.getItem("multiplayerEnabled")==="true",je=0,D=localStorage.getItem("playerName")||"",U=null;const u=[],q=[];let E=localStorage.getItem("levelType")||"horizontal",te=localStorage.getItem("manualLevelType")==="true",ne=localStorage.getItem("manualLevelTypeValue")||E,M=0;const P=3200;let O=null;async function ct(){let t=P;const l=Math.min(Ae*8,180),s=140,r=320,a=50;u.length=0,q.length=0,w.length=0,V.length=0,X.length=0,Y.length=0,ie.length=0;const i=[];let o=100+Math.random()*(h.width-s-200),c=!0;for(;t>0;){let g,m;if(c)g=0,m=h.width,c=!1;else{m=s+Math.random()*(r-s);let I=Math.max(0,o-m+40),p=Math.min(h.width-m,o+m-40);I>p&&(I=p=o),g=I+Math.random()*(p-I)}u.push({x:g,y:t,width:m,height:a}),i.push({x:g+m/2,y:t-30}),Math.random()<.5&&w.push({x:g+m/2-10,y:t-30,width:20,height:20,collected:!1,type:"coin",id:W("coin")}),Math.random()<.3&&t<P-l&&V.push({x:g+m/2-20,y:t+a-15,width:40,height:15}),Math.random()<.2&&t<P-l&&X.push({x:g-60,y:t-100,width:80,height:20,dx:2,range:120,startX:g-60}),t-=l,Math.random()<.5&&t>50&&q.push({x:g+10,y:t-40,width:40,height:40}),o=g}if(i.length>0){const g=Math.floor(Math.random()*i.length),m=i[g];w.push({x:m.x-10,y:m.y,width:20,height:20,collected:!1,type:"heart",id:W("heart")})}if(i.length>1){let g,m=0;const I=i.length*3;do g=Math.floor(Math.random()*i.length),m++;while(m<I&&w.some(p=>p.x===i[g].x-10&&p.y===i[g].y));if(m<I){const p=i[g];w.push({x:p.x-10,y:p.y-30,width:20,height:20,collected:!1,type:"doublejump",id:W("doublejump")})}}if(i.length>2){let g,m=0;const I=i.length*3;do g=Math.floor(Math.random()*i.length),m++;while(m<I&&(w.some(p=>p.x===i[g].x-10&&p.y===i[g].y)||w.some(p=>p.x===i[g].x-10&&p.y===i[g].y-30)));if(m<I){const p=i[g];w.push({x:p.x-10,y:p.y-60,width:20,height:20,collected:!1,type:"grow",id:W("grow")})}}const f=P;u.some(g=>g.y<=f&&g.y+g.height>=f-40)||u.unshift({x:100,y:P,width:s+Math.random()*(r-s),height:a});const x=u[u.length-1];if(S.x=x.x+x.width/2-S.width/2,S.y=x.y-S.height,L&&w.length>0){const g=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(m=>({id:m.id,type:m.type}))})})}catch{}}}te&&(E=ne);async function Pe(){if(E==="vertical"){await ct();return}u.length=0,q.length=0,w.length=0,V.length=0,X.length=0,Y.length=0,ie.length=0;let t=0;const l=[];let s=0;for(;t<se;){const f=s===0,y=t<=100&&t+400>=100,x=!f&&!y&&Math.random()<.2,g=x?480+Math.random()*120:Math.random()<.2?320:160+Math.random()*160;let m;if(Math.random()<.25){const p=(Math.random()<.5?1:-1)*(20+Math.random()*20);m={x:t,y:k,width:g,height:50,endY:k+p,isSlope:!0,willHaveEnemies:x}}else m={x:t,y:k,width:g,height:50,willHaveEnemies:x};if(u.push(m),l.push({x:t+g/2,y:k-30}),Math.random()<.5&&w.push({x:t+g/2-10,y:k-30,width:20,height:20,collected:!1,type:"coin",id:W("coin")}),Math.random()<.3&&t>0&&V.push({x:t-40,y:k+35,width:40,height:15}),Math.random()<.2&&t>0&&X.push({x:t-60,y:k-100,width:80,height:20,dx:2,range:120,startX:t-60}),m.willHaveEnemies&&g>200){const R=t+40,Le=t+g-40-40,Ze=R+Math.random()*Math.max(0,Le-R),et=k-60;ie.push({x:Ze,y:et,width:40,height:80,id:rt(),hasSpawnedEnemy:!1})}t+=g;const I=60+Math.random()*80;t+=I,Math.random()<.5&&t<se-50&&q.push({x:t+10,y:k-40,width:40,height:40}),s++}if(l.length>0){const f=Math.floor(Math.random()*l.length),y=l[f];w.push({x:y.x-10,y:y.y,width:20,height:20,collected:!1,type:"heart",id:W("heart")})}if(l.length>1){let f,y=0;const x=l.length*3;do f=Math.floor(Math.random()*l.length),y++;while(y<x&&w.some(g=>g.x===l[f].x-10&&g.y===l[f].y));if(y<x){const g=l[f];w.push({x:g.x-10,y:g.y-30,width:20,height:20,collected:!1,type:"doublejump",id:W("doublejump")})}}if(l.length>2){let f,y=0;const x=l.length*3;do f=Math.floor(Math.random()*l.length),y++;while(y<x&&(w.some(g=>g.x===l[f].x-10&&g.y===l[f].y)||w.some(g=>g.x===l[f].x-10&&g.y===l[f].y-30)));if(y<x){const g=l[f];w.push({x:g.x-10,y:g.y-60,width:20,height:20,collected:!1,type:"grow",id:W("grow")})}}const r=100;u.some(f=>f.x<=r&&f.x+f.width>=r+40)||u.unshift({x:60,y:k,width:80,height:50});const i=u[u.length-1];let o=i.x+i.width-32,c="isSlope"in i&&i.isSlope?i.endY-S.height:i.y-S.height;if(S.x=o,S.y=c,L&&w.length>0){const f=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(f,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(y=>({id:y.id,type:y.type}))})})}catch{}}}function Se(t,l){return t.x<l.x+l.width&&t.x+t.width>l.x&&t.y<l.y+l.height&&t.y+t.height>l.y}let v=0,B=1,dt=se-100,F=0,j=3,le=!1,we=Number(localStorage.getItem("topScore")||"0"),re=!1,ge=0,N=Number(localStorage.getItem("totalPoints")||"0"),H=localStorage.getItem("playerCharacter")||"SQUARE",$=JSON.parse(localStorage.getItem("purchasedUpgrades")||"{}");Pe().then(()=>{ve()}).then(()=>{$.extra_life?j=4:$.tough_skin&&(j=5),$.double_jump_start&&(n.hasDoubleJump=!0)});const de={characters:[{id:"yellow_square",emoji:"SQUARE",name:"Yellow Square",cost:0,unlocked:!0},{id:"yellow_circle",emoji:"🟡",name:"Yellow Circle",cost:10},{id:"red_circle",emoji:"🔴",name:"Red Circle",cost:50},{id:"blue_circle",emoji:"🔵",name:"Blue Circle",cost:50},{id:"green_circle",emoji:"🟢",name:"Green Circle",cost:50},{id:"smiley",emoji:"😊",name:"Smiley Face",cost:100},{id:"cool",emoji:"😎",name:"Cool Face",cost:150},{id:"star",emoji:"⭐",name:"Star",cost:200},{id:"crown",emoji:"👑",name:"Crown",cost:300},{id:"rocket",emoji:"🚀",name:"Rocket",cost:500},{id:"alien",emoji:"👽",name:"Alien",cost:750}],gameplay:[{id:"extra_life",name:"Start with Extra Life",cost:100,description:"Begin each game with 4 lives instead of 3"},{id:"double_jump_start",name:"Start with Double Jump",cost:200,description:"Begin each level with double jump ability"},{id:"speed_boost",name:"Permanent Speed Boost",cost:300,description:"1.5x movement speed permanently"},{id:"lucky_coins",name:"Lucky Coins",cost:400,description:"Coins are worth 2 points each"},{id:"tough_skin",name:"Tough Skin",cost:500,description:"Start each game with 5 lives instead of 3"}]};function ce(t){t>we&&(we=t,localStorage.setItem("topScore",String(we)))}function ae(t){N+=t,localStorage.setItem("totalPoints",String(N))}function ht(t){return N>=t?(N-=t,localStorage.setItem("totalPoints",String(N)),!0):!1}function Xe(t){if($[t])return!1;let l=0,s=!1;for(const r of de.characters)if(r.id===t){l=r.cost,s=!0;break}if(!s){for(const r of de.gameplay)if(r.id===t){l=r.cost,s=!0;break}}if(!s||!ht(l))return!1;if($[t]=!0,localStorage.setItem("purchasedUpgrades",JSON.stringify($)),de.characters.some(r=>r.id===t)){const r=de.characters.find(a=>a.id===t);r&&(H=r.emoji,localStorage.setItem("playerCharacter",H))}return!0}function ft(){const t=document.getElementById("shop-modal");if(t){t.style.display="flex";const l=document.getElementById("github-star-btn");l&&(l.style.display="none"),Ie()}}function Ie(){const t=document.getElementById("shop-points");t&&(t.textContent=String(N));const l=document.getElementById("character-upgrades");l&&(l.innerHTML="",de.characters.forEach(r=>{const a=r.unlocked||$[r.id],i=H===r.emoji,o=N>=r.cost,c=document.createElement("div");c.style.cssText=`
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:12px;
        border-radius:8px;
        border:2px solid ${i?"#ffd700":a?"#0cf":"#666"};
        background:${i?"rgba(255,215,0,0.1)":a?"rgba(0,204,255,0.1)":"#333"};
        cursor:pointer;
        transition:all 0.2s;
      `,c.innerHTML=`
        <div style="font-size:2em;margin-bottom:8px;">${r.emoji==="SQUARE"?"🟨":r.emoji}</div>
        <div style="font-size:0.9em;text-align:center;margin-bottom:4px;">${r.name}</div>
        <div style="font-size:0.8em;color:${a?"#0cf":o?"#ffd700":"#999"};">
          ${a?i?"Selected":"Owned":`${r.cost} pts`}
        </div>
      `,c.addEventListener("click",()=>{a?(H=r.emoji,localStorage.setItem("playerCharacter",H),Ie()):o&&Xe(r.id)&&Ie()}),l.appendChild(c)}));const s=document.getElementById("gameplay-upgrades");s&&(s.innerHTML="",de.gameplay.forEach(r=>{const a=$[r.id],i=N>=r.cost,o=document.createElement("div");o.style.cssText=`
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:16px;
        border-radius:8px;
        border:2px solid ${a?"#0cf":"#666"};
        background:${a?"rgba(0,204,255,0.1)":"#333"};
        ${!a&&i?"cursor:pointer;":""}
        transition:all 0.2s;
      `,o.innerHTML=`
        <div>
          <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
          <div style="font-size:0.9em;color:#ccc;">${r.description}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.2em;color:${a?"#0cf":i?"#ffd700":"#999"};">
            ${a?"✓ Owned":`${r.cost} pts`}
          </div>
        </div>
      `,!a&&i&&o.addEventListener("click",()=>{Xe(r.id)&&Ie()}),s.appendChild(o)}))}function $e(){v=0,B=1,j=3,$.extra_life&&(j=4),$.tough_skin&&(j=5),localStorage.setItem("levelType","horizontal"),le=!1,u.length=0,q.length=0,w.length=0,V.length=0,X.length=0,Y.length=0,ie.length=0,te?E=ne:E="horizontal",Pe(),$.double_jump_start&&(n.hasDoubleJump=!0),ve()}function ve(){if(E==="vertical"){const t=u[0];n.x=t.x+t.width/2-n.width/2,n.y=t.y-n.height,n.vx=0,n.vy=0;const l=Math.max(...u.map(i=>i.width)),s=Math.max(h.width,l),r=h.width/s,a=h.height/r;M=Math.min(Math.max(0,n.y+n.height-a+8),P-a)}else n.x=100,n.y=k-175,n.vx=0,n.vy=0;n.canDoubleJump=!1,he()}function he(){n.growLevel===0?(n.width=40,n.height=50):n.growLevel===1?(n.width=60,n.height=75):n.growLevel===2?(n.width=80,n.height=100):n.growLevel>=3&&(n.width=100,n.height=125)}function We(){return n.growLevel===0?100:n.growLevel===1?120:n.growLevel>=2?150:100}function gt(){const t=We();for(const l of Y){if(!l.alive||l.type!=="circle")continue;const s=n.x+n.width/2,r=n.y+n.height/2,a=l.x+l.width/2,i=l.y+l.height/2;if(Math.sqrt(Math.pow(s-a,2)+Math.pow(r-i,2))<=t)return l}return null}function pt(t){d.type="eating",d.progress=0,d.startTime=Date.now(),d.targetEnemy=t,d.startX=t.x+t.width/2,d.startY=t.y+t.height/2}function mt(){if(!n.eatenEnemy)return;d.type="spitting",d.progress=0,d.startTime=Date.now();const l=(n.vx>=0?1:-1)>0?h.width+T:T-50;d.endX=l,d.endY=n.y+n.height/2,d.targetEnemy={x:n.x+n.width/2,y:n.y+n.height/2,width:30,height:30,dx:0,dy:0,range:0,startX:0,alive:!0,id:"temp_spit",isJumpingOut:!1,type:n.eatenEnemy.type}}function yt(){d.type="targeting",d.progress=0,d.duration=300,d.startTime=Date.now(),d.targetEnemy=null,d.startX=0,d.startY=0,d.endX=0,d.endY=0}function ut(t){if(d.type==="none")return;const l=Date.now()-d.startTime;if(d.progress=Math.min(l/d.duration,1),d.type==="eating"&&d.targetEnemy){const s=n.x+n.width/2,r=n.y+n.height/2,a=d.startX+(s-d.startX)*d.progress,i=d.startY+(r-d.startY)*d.progress;d.targetEnemy.x=a-d.targetEnemy.width/2,d.targetEnemy.y=i-d.targetEnemy.height/2,d.progress>=1&&(n.eatenEnemy={...d.targetEnemy},d.targetEnemy.alive=!1,d.type="none",d.targetEnemy=null)}else if(d.type==="spitting"&&d.targetEnemy){const s=n.x+n.width/2,r=n.y+n.height/2,a=s+(d.endX-s)*d.progress,i=r+(d.endY-r)*d.progress;d.targetEnemy.x=a-d.targetEnemy.width/2,d.targetEnemy.y=i-d.targetEnemy.height/2,d.progress>=1&&(n.eatenEnemy=null,d.type="none",d.targetEnemy=null)}else d.type==="targeting"&&d.progress>=1&&(d.type="none",d.targetEnemy=null)}function xt(){if(d.type==="none")return;if(d.type==="targeting"){const a=n.x+n.width/2,i=n.y+n.height/2,o=We(),c=a+o,f=i;e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(a,i),e.lineTo(c,f),e.stroke(),e.setLineDash([]);return}const t=n.x+n.width/2,l=n.y+n.height/2;if(!d.targetEnemy)return;let s,r;if(d.type==="eating"){const a=n.x+n.width/2,i=n.y+n.height/2,o=d.startX+(a-d.startX)*d.progress,c=d.startY+(i-d.startY)*d.progress;s=o,r=c}else s=d.targetEnemy.x+d.targetEnemy.width/2,r=d.targetEnemy.y+d.targetEnemy.height/2;if(e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(t,l),e.lineTo(s,r),e.stroke(),e.setLineDash([]),d.targetEnemy.type==="circle"){e.fillStyle="#f06",e.beginPath(),e.arc(s,r,d.targetEnemy.width/2,0,2*Math.PI),e.fill(),e.fillStyle="#000";const a=3;e.fillRect(s-8,r-3,a,a),e.fillRect(s+5,r-3,a,a)}else{e.fillStyle="#f90",e.fillRect(s-d.targetEnemy.width/2,r-d.targetEnemy.height/2,d.targetEnemy.width,d.targetEnemy.height),e.fillStyle="#000";const a=3;e.fillRect(s-8,r-3,a,a),e.fillRect(s+5,r-3,a,a)}}function Ee(){if(j--,j<=0){ce(v),le=!0,He(),wt();return}n.hasDoubleJump=!1,n.growLevel=0,n.canDoubleJump=!1,n.eatenEnemy=null,he(),ve(),F=30}function He(){let t=document.getElementById("restart-btn");t?t&&(t.style.display="block",t.style.top="calc(50% + 160px)",t.style.transform="translateX(-50%)"):(t=document.createElement("button"),t.id="restart-btn",t.textContent="Restart",t.style.position="fixed",t.style.left="50%",t.style.top="calc(50% + 160px)",t.style.transform="translateX(-50%)",t.style.fontSize="2em",t.style.padding="16px 32px",t.style.zIndex="100",t.style.background="#222",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",t.onclick=()=>{t?.remove(),Ne(),$e()},document.body.appendChild(t))}function wt(){let t=document.getElementById("share-btn");t?t&&(t.style.display="block",t.style.top="calc(50% + 120px)",t.style.transform="translateX(-50%)"):(t=document.createElement("button"),t.id="share-btn",t.textContent="📤 Share Progress",t.style.position="fixed",t.style.left="50%",t.style.top="calc(50% + 120px)",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px",t.style.zIndex="100",t.style.background="#0cf",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",t.onclick=()=>{qe()},document.body.appendChild(t))}function Ne(){const t=document.getElementById("share-btn");t&&(t.style.display="none")}function bt(){const t=document.getElementById("restart-btn");t&&(t.style.display="none")}function Ve(){const t=document.createElement("canvas"),l=t.getContext("2d");return t.width=h.width,t.height=h.height,l.drawImage(h,0,0),l.save(),l.globalAlpha=.8,l.fillStyle="#000",l.fillRect(0,h.height-120,h.width,120),l.globalAlpha=1,l.fillStyle="#fff",l.font="bold 24px sans-serif",l.textAlign="center",l.fillText("Side-Scrolling Platformer",h.width/2,h.height-90),l.font="18px sans-serif",l.fillText(`Level ${B} • Score ${v}`,h.width/2,h.height-65),l.fillText("Play at: github.com/commjoen/generated-game-experiment",h.width/2,h.height-40),le?(l.fillStyle="#e33",l.font="bold 20px sans-serif",l.fillText("Final Score!",h.width/2,h.height-15)):B>=25&&(l.fillStyle="#0cf",l.font="bold 20px sans-serif",l.fillText("Victory! Level 25 Reached!",h.width/2,h.height-15)),l.restore(),t.toDataURL("image/png")}function K(){return le?`Just played Side-Scrolling Platformer! 🎮 Final score: ${v} points on level ${B}! Can you beat it?`:B>=25?`Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${v} points! Amazing game!`:`Playing Side-Scrolling Platformer! 🎮 Currently on level ${B} with ${v} points!`}function qe(){const t=document.getElementById("share-modal");t&&t.remove();const l=document.createElement("div");l.id="share-modal",l.style.cssText=`
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
  `,window.innerWidth<=768&&(l.style.padding="10px",l.style.alignItems="flex-start",l.style.paddingTop="20px");const s=document.createElement("div");s.style.cssText=`
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
  `,window.innerWidth<=768&&(s.style.maxHeight="min(85vh, 500px)",s.style.margin="5px",s.style.borderRadius="12px");const r=document.createElement("div");r.style.cssText=`
    padding: 20px 32px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `,window.innerWidth<=768&&(r.style.padding="16px 20px");const a=document.createElement("h2");a.textContent="📤 Share Your Progress",a.style.cssText="margin: 0; font-size: 1.5em; color: #0cf;";const i=document.createElement("button");i.textContent="✖️",i.style.cssText=`
    background: none;
    border: none;
    color: #fff;
    font-size: 1.2em;
    cursor: pointer;
    padding: 4px;
  `,i.onclick=()=>l.remove(),r.appendChild(a),r.appendChild(i);const o=document.createElement("div");o.style.cssText=`
    padding: 24px 32px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    scroll-behavior: smooth;
  `,window.innerWidth<=768&&(o.style.padding="16px 20px");const c=document.createElement("div");c.style.cssText="margin-bottom: 24px;";const f=document.createElement("h3");f.textContent="Preview:",f.style.cssText="margin: 0 0 12px 0; color: #0cf; font-size: 1.2em;";const y=document.createElement("p");y.textContent=K(),y.style.cssText=`
    margin: 0 0 12px 0;
    padding: 12px;
    background: #333;
    border-radius: 8px;
    line-height: 1.4;
  `;const x=document.createElement("p");x.innerHTML='🔗 <a href="https://github.com/commjoen/generated-game-experiment" target="_blank" style="color: #0cf; text-decoration: underline;">github.com/commjoen/generated-game-experiment</a>',x.style.cssText="margin: 0 0 8px 0; font-size: 0.9em; color: #ccc;";const g=document.createElement("p");g.innerHTML="share"in navigator?'💡 <strong>Tip:</strong> Use "Share+📷" to include the screenshot automatically, or "Download📷" to save it first.':'💡 <strong>Tip:</strong> Use "Download📷" to save the screenshot, then attach it manually when posting to social media for better engagement!',g.style.cssText=`
    margin: 0;
    padding: 8px 12px;
    background: rgba(12, 255, 255, 0.1);
    border-left: 3px solid #0cf;
    border-radius: 4px;
    font-size: 0.85em;
    color: #ccc;
    line-height: 1.3;
  `,c.appendChild(f),c.appendChild(y),c.appendChild(x),c.appendChild(g);const m=document.createElement("div");m.style.cssText="margin-bottom: 16px;";const I=document.createElement("h3");I.textContent="Share to:",I.style.cssText="margin: 0 0 16px 0; color: #0cf; font-size: 1.2em;";const p=document.createElement("div");p.style.cssText=`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
  `,window.innerWidth<=480?(p.style.gridTemplateColumns="repeat(2, 1fr)",p.style.gap="8px"):window.innerWidth<=768&&(p.style.gridTemplateColumns="repeat(3, 1fr)",p.style.gap="8px"),[{name:"Twitter",icon:"🐦",color:"#1DA1F2",action:C=>vt()},{name:"Facebook",icon:"📘",color:"#1877F2",action:C=>St()},{name:"LinkedIn",icon:"💼",color:"#0A66C2",action:C=>Et()},{name:"Reddit",icon:"🔶",color:"#FF4500",action:C=>Tt()},{name:"Bluesky",icon:"☁️",color:"#0085ff",action:C=>It()},{name:"Mastodon",icon:"🐘",color:"#563acc",action:C=>Ct()},..."share"in navigator?[{name:"Share+📷",icon:"📤",color:"#28a745",action:C=>kt()}]:[],{name:"Copy Text",icon:"📋",color:"#666",action:C=>Re(C)},{name:"Download📷",icon:"💾",color:"#0cf",action:C=>Mt()}].forEach(C=>{const R=document.createElement("button");R.innerHTML=`<span style="font-size: 1.2em; margin-right: 4px;">${C.icon}</span>${C.name}`,R.style.cssText=`
      background: ${C.color};
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
    `,window.innerWidth<=480&&(R.style.fontSize="0.8em",R.style.padding="10px 6px",R.style.minHeight="40px"),R.onclick=Le=>C.action(Le),R.onmouseenter=()=>R.style.opacity="0.8",R.onmouseleave=()=>R.style.opacity="1",p.appendChild(R)}),m.appendChild(I),m.appendChild(p),o.appendChild(c),o.appendChild(m),s.appendChild(r),s.appendChild(o),l.appendChild(s),document.body.appendChild(l),l.onclick=C=>{C.target===l&&l.remove()}}function vt(){const t=encodeURIComponent(K()),l=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),s=encodeURIComponent("indiegaming,webgames,platformer,javascript");window.open(`https://twitter.com/intent/tweet?text=${t}&url=${l}&hashtags=${s}`,"_blank","width=550,height=420")}function St(){const t=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),l=encodeURIComponent(K());window.open(`https://www.facebook.com/sharer/sharer.php?u=${t}&quote=${l}`,"_blank","width=580,height=400")}function Et(){const t=encodeURIComponent(K()),l=encodeURIComponent("https://github.com/commjoen/generated-game-experiment");window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${l}&summary=${t}`,"_blank","width=570,height=570")}function Tt(){const t=encodeURIComponent(le?"My final score in Side-Scrolling Platformer!":"Reached level 25 in this amazing browser game!"),l=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://www.reddit.com/submit?title=${t}&text=${l}`,"_blank","width=600,height=500")}function It(){const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://bsky.app/intent/compose?text=${t}`,"_blank","width=600,height=500")}function Ct(){const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`),l=document.createElement("div");l.style.cssText=`
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
  `,l.innerHTML=`
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
  `,document.body.appendChild(l);const s=document.getElementById("mastodon-instance"),r=document.getElementById("mastodon-share-btn");r&&s&&(r.onclick=()=>{let a=s.value.trim();a||(a="mastodon.social"),a=a.replace(/^https?:\/\//,""),window.open(`https://${a}/share?text=${t}`,"_blank","width=600,height=500"),l.remove()},s.addEventListener("keypress",a=>{a.key==="Enter"&&r.click()})),l.onclick=a=>{a.target===l&&l.remove()}}async function kt(){if(navigator.share)try{const t=Ve(),s=await(await fetch(t)).blob(),r=new File([s],`platformer-level-${B}-score-${v}.png`,{type:"image/png"});await navigator.share({title:le?"My Side-Scrolling Platformer Score!":"Victory in Side-Scrolling Platformer!",text:K(),url:"https://github.com/commjoen/generated-game-experiment",files:[r]})}catch(t){console.error("Web Share API failed:",t),await Re()}else await Re()}async function Re(t){const l=K()+`

Play at: https://github.com/commjoen/generated-game-experiment

📎 Tip: Download the screenshot and attach it to your post for better engagement!`;try{await navigator.clipboard.writeText(l);const s=t?.target;if(s){const r=s.innerHTML;s.innerHTML='<span style="font-size: 1.2em; margin-right: 4px;">✅</span>Copied!',s.style.background="#28a745",setTimeout(()=>{s.innerHTML=r,s.style.background="#666"},2e3)}}catch(s){console.error("Failed to copy to clipboard:",s);const r=document.createElement("div");r.style.cssText=`
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
      <textarea readonly style="width: 300px; height: 80px; background: #333; color: #fff; border: 1px solid #666; padding: 8px;">${l}</textarea>
      <br><button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 8px 16px; background: #0cf; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `,document.body.appendChild(r),r.querySelector("textarea").select()}}function Mt(){const t=Ve(),l=document.createElement("a");l.download=`platformer-game-level-${B}-score-${v}.png`,l.href=t,l.click()}function Pt(){ae(v+500),ce(v);const t=document.createElement("div");t.id="victory-modal",t.style.cssText=`
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
  `;const l=document.createElement("div");l.style.cssText=`
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
  `,l.innerHTML=`
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
  `,t.appendChild(l),document.body.appendChild(t);const s=document.getElementById("victory-share-btn"),r=document.getElementById("victory-continue-btn"),a=document.getElementById("victory-restart-btn");s&&(s.onclick=()=>{qe()},s.onmouseenter=()=>s.style.background="#0a9fd9",s.onmouseleave=()=>s.style.background="#0cf"),r&&(r.onclick=()=>{t.remove(),B=25,(async()=>(await Pe(),ve(),ue(),re=!1,ge=0))()},r.onmouseenter=()=>r.style.background="#218838",r.onmouseleave=()=>r.style.background="#28a745"),a&&(a.onclick=()=>{t.remove(),$e()},a.onmouseenter=()=>{a.style.background="#0cf",a.style.color="#222"},a.onmouseleave=()=>{a.style.background="#222",a.style.color="#fff"}),ue()}function Lt(){if(u.length=0,q.length=0,w.length=0,V.length=0,X.length=0,Y.length=0,ie.length=0,B++,B>=25){Pt();return}let t=!1;if(te?E=ne:B===1?E="horizontal":B%5===0?(Ot(),t=!0):B%3===0?E="vertical":E="horizontal",t){ue(),re=!1,ge=0;return}localStorage.setItem("levelType",E),O&&O instanceof HTMLInputElement&&(O.checked=te&&ne==="vertical"),Pe(),ve(),Q?(pe=ye(),localStorage.setItem("fixedGradientColors",JSON.stringify(pe))):Z?(me=ye(),localStorage.setItem("scrollGradientColors",JSON.stringify(me))):G&&Ke(),ue(),re=!1,ge=0}function Je(){ue(),re=!0,ge=120}function Bt(t){if(le)return;if(re){ge--,ge<=0&&Lt();return}if(F>0){F--;return}ut(),n.vx=0;const l=ke*($.speed_boost?1.5:1);(b.ArrowLeft||b.KeyA)&&(n.vx=-ze*l*t*60),(b.ArrowRight||b.KeyD)&&(n.vx=ze*l*t*60);const s=b.ArrowUp||b.Space||b.KeyW;xe>0&&xe--,s&&xe===0&&(n.onGround?(n.vy=-Ae,n.onGround=!1,n.hasDoubleJump&&(n.canDoubleJump=!0),xe=8):n.hasDoubleJump&&n.canDoubleJump&&(n.vy=-Ae,n.canDoubleJump=!1,xe=8));const r=b.KeyT;r&&!Ye&&(J=!J,localStorage.setItem("speedUnlocked",String(J)),ke=J?2:1),Ye=r;const a=b.KeyE;if(a&&!Oe){if(n.eatenEnemy&&d.type==="none")mt();else if(d.type==="none"){const i=gt();i?(pt(i),L?ae(1):(v++,ae(1),ce(v))):yt()}}Oe=a,n.vy+=nt*t*60,n.x+=n.vx,n.y+=n.vy,n.onGround=!1;for(const i of u)if("isSlope"in i&&i.isSlope){if(n.x+n.width>i.x&&n.x<i.x+i.width){const o=(n.x+n.width/2-i.x)/i.width,c=i.y+(i.endY-i.y)*o;n.y+n.height>c&&n.y+n.height<c+i.height&&n.vy>=0&&(n.y=c-n.height,n.vy=0,n.onGround=!0,n.canDoubleJump=n.hasDoubleJump)}}else n.y+n.height>i.y&&n.y+n.height<i.y+i.height&&n.x+n.width>i.x&&n.x<i.x+i.width&&n.vy>=0&&(n.y=i.y-n.height,n.vy=0,n.onGround=!0,n.canDoubleJump=n.hasDoubleJump);for(const i of q)Se(n,i)&&(n.y+n.height-n.vy<=i.y?(n.y=i.y-n.height,n.vy=0,n.onGround=!0):n.x+n.width-n.vx<=i.x?n.x=i.x-n.width:n.x-n.vx>=i.x+i.width?n.x=i.x+i.width:n.y-n.vy>=i.y+i.height&&(n.y=i.y+i.height,n.vy=0));for(const i of X)i.x+=i.dx,(i.x>i.startX+i.range||i.x<i.startX)&&(i.dx*=-1);for(const i of ie)if(!i.hasSpawnedEnemy){let o=!1;if(E==="horizontal"?o=i.x+i.width>T&&i.x<T+h.width:o=i.y+i.height>M&&i.y<M+h.height,o){const c=u.find(f=>f.x<=i.x+i.width/2&&f.x+f.width>=i.x+i.width/2&&Math.abs(f.y-k)<10);if(c){const f=Math.random()<.5?"square":"circle";Y.push({x:i.x+i.width/2-15,y:i.y+10,width:30,height:30,dx:1+Math.random()*2,dy:-8,range:Math.min(c.width-80,120),startX:i.x+i.width/2-15,alive:!0,id:at(),isJumpingOut:!0,type:f}),i.hasSpawnedEnemy=!0}}}for(const i of Y)if(i.alive)if(i.isJumpingOut){i.y+=i.dy,i.dy+=.5;for(const o of u)if(i.y+i.height>=o.y&&i.y+i.height<=o.y+o.height&&i.x+i.width>o.x&&i.x<o.x+o.width&&Math.abs(o.y-k)<10){i.y=o.y-i.height,i.dy=0,i.isJumpingOut=!1;break}}else i.x+=i.dx,(i.x>i.startX+i.range||i.x<i.startX)&&(i.dx*=-1);for(const i of X)n.y+n.height>i.y&&n.y+n.height<i.y+i.height&&n.x+n.width>i.x&&n.x<i.x+i.width&&n.vy>=0&&(n.y=i.y-n.height,n.vy=0,n.onGround=!0,n.x+=i.dx);for(const i of w)if(!i.collected&&Se(n,i)){if(i.type==="doublejump"&&n.hasDoubleJump||i.type==="grow"&&n.growLevel>=3)continue;if(i.collected=!0,L&&z.collectItem(i.id),i.type==="coin"){const o=$.lucky_coins?2:1;L?ae(o):(v+=o,ae(o),ce(v))}else i.type==="heart"?j<5&&j++:i.type==="doublejump"?(n.hasDoubleJump=!0,n.canDoubleJump=!1):i.type==="grow"&&(n.growLevel<3&&n.growLevel++,he())}for(const i of V)if(Se(n,i)){Ee();break}for(const i of Y)if(i.alive&&!(F>0||d.targetEnemy===i)&&Se(n,i)){if(i.type==="square")if(n.vy>0&&n.y<i.y)i.alive=!1,n.vy=-8,L?ae(1):(v++,ae(1),ce(v));else{n.growLevel>0?(n.growLevel=0,he(),F=30):Ee();break}else if(i.type==="circle"){n.growLevel>0?(n.growLevel=0,he(),F=30):Ee();break}}if(E==="horizontal"&&n.y>h.height+100&&Ee(),E==="horizontal"?n.x+n.width>=dt&&!re&&Je():E==="vertical"&&!re&&n.x+n.width>S.x&&n.x<S.x+S.width&&n.y+n.height>S.y&&n.y<S.y+S.height&&Je(),E==="vertical"?(M=n.y-h.height/2+n.height/2,M=Math.max(0,Math.min(M,P-h.height)),T=0):(T=n.x-h.width/2+n.width/2,T=Math.max(0,Math.min(T,se-h.width)),M=0),E==="vertical"){const i=Math.max(...u.map(c=>c.width)),o=Math.max(h.width,i);h.width/o,n.x=Math.max(0,Math.min(n.x,o-n.width))}else n.x<0&&(n.x=0),n.x+n.width>se&&(n.x=se-n.width);L&&Date.now()-je>50&&(z.updatePlayerPosition(n.x,n.y,n.width,n.height,n.growLevel),je=Date.now())}function At(){return/Tesla|QtCarBrowser/i.test(navigator.userAgent)}let Ce=localStorage.getItem("teslaMode")==="true";function Rt(){return At()||Ce||/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)}let Q=localStorage.getItem("fixedGradient")==="true",Z=localStorage.getItem("scrollGradient")==="true",pe=JSON.parse(localStorage.getItem("fixedGradientColors")||"null")||ye(),me=JSON.parse(localStorage.getItem("scrollGradientColors")||"null")||ye(),G=localStorage.getItem("imageBg")==="true",oe=localStorage.getItem("imageBgUrl")||null,ee=null,be=!1;function Ke(){fetch("https://pixabay.com/api/?key=51252753-0f1aa9c83b326091b3ad96f88&q=landscape&image_type=photo&orientation=horizontal&safesearch=true&per_page=50").then(s=>s.json()).then(s=>{if(s.hits&&s.hits.length>0){const r=Math.floor(Math.random()*s.hits.length);oe=s.hits[r].largeImageURL,oe&&(localStorage.setItem("imageBgUrl",oe),Fe())}}).catch(()=>{oe=null,be=!1})}function Fe(){oe&&(ee=new window.Image,ee.crossOrigin="anonymous",ee.onload=()=>{be=!0},ee.onerror=()=>{be=!1},ee.src=oe)}oe&&Fe();function ye(){function t(){return`hsl(${Math.floor(Math.random()*360)}, 70%, 75%)`}return[t(),t()]}function Be(){localStorage.setItem("fixedGradient",String(Q)),localStorage.setItem("scrollGradient",String(Z)),localStorage.setItem("imageBg",String(G)),localStorage.setItem("fixedGradientColors",JSON.stringify(pe)),localStorage.setItem("scrollGradientColors",JSON.stringify(me)),G||(localStorage.removeItem("imageBgUrl"),oe=null,ee=null,be=!1)}const Dt="v0.4.1-37-gf09f86b",$t="f09f86b",zt="HEAD",_t="v0.4.1",Ut="2025-08-09T20:58:29.055Z";window.addEventListener("DOMContentLoaded",()=>{const t=document.getElementById("settings-btn"),l=document.getElementById("settings-modal"),s=document.getElementById("close-settings"),r=document.getElementById("fixed-gradient-toggle"),a=document.getElementById("scroll-gradient-toggle"),i=document.getElementById("image-bg-toggle"),o=document.getElementById("speed-unlock-toggle"),c=document.getElementById("fps-counter-toggle"),f=document.getElementById("tesla-mode-toggle"),y=document.getElementById("multiplayer-toggle");U=document.getElementById("player-name-input"),O=document.getElementById("level-type-toggle"),t&&l&&s&&r&&a&&i&&o&&c&&f&&y&&U&&O&&(t.addEventListener("click",()=>{l.style.display="flex";const p=document.getElementById("github-star-btn");p&&(p.style.display="none"),r.checked=Q,a.checked=Z,i.checked=G,o.checked=J,c.checked=Te,f.checked=Ce,y.checked=L,U&&(U.value=D),O&&(O.checked=te&&ne==="vertical")}),s.addEventListener("click",()=>{l.style.display="none";const p=document.getElementById("github-star-btn");p&&(p.style.display="flex")}),r.addEventListener("change",()=>{r.checked?(Q=!0,Z=!1,G=!1,a.checked=!1,i.checked=!1,pe=ye()):Q=!1,Be()}),a.addEventListener("change",()=>{a.checked?(Z=!0,Q=!1,G=!1,r.checked=!1,i.checked=!1,me=ye()):Z=!1,Be()}),i.addEventListener("change",()=>{i.checked?(G=!0,Q=!1,Z=!1,r.checked=!1,a.checked=!1,Ke()):G=!1,Be()}),o.addEventListener("change",()=>{J=o.checked,localStorage.setItem("speedUnlocked",String(J)),ke=J?2:1}),c.addEventListener("change",()=>{Te=c.checked,localStorage.setItem("showFpsCounter",String(Te))}),f.addEventListener("change",()=>{Ce=f.checked,localStorage.setItem("teslaMode",String(Ce)),De()}),y.addEventListener("change",()=>{L=y.checked,localStorage.setItem("multiplayerEnabled",String(L)),window.location.reload()}),O.addEventListener("change",()=>{te=O.checked,te?(ne="vertical",E="vertical"):(ne="horizontal",E="horizontal"),localStorage.setItem("manualLevelType",String(te)),localStorage.setItem("manualLevelTypeValue",ne),localStorage.setItem("levelType",E),$e()}),U&&U.addEventListener("input",()=>{D=U.value.slice(0,12),localStorage.setItem("playerName",D)}));const x=document.getElementById("shop-btn"),g=document.getElementById("shop-modal"),m=document.getElementById("close-shop");x&&g&&m&&(x.addEventListener("click",()=>{ft()}),m.addEventListener("click",()=>{g.style.display="none";const p=document.getElementById("github-star-btn");p&&(p.style.display="flex")}));const I=document.querySelector(".version-string, #version, .version, #version-string");I&&(I.textContent=`Version: ${Dt} (tag: ${_t}, ${zt}, ${$t}, built: ${Ut})`),De()});function De(){const t=document.getElementById("onscreen-controls"),l=document.getElementById("desktop-copyright"),s=Rt();t&&(t.style.display=s?"flex":"none"),l&&(l.style.display=s?"none":"block")}function jt(){const t=document.getElementById("btn-left"),l=document.getElementById("btn-right"),s=document.getElementById("btn-jump"),r=document.getElementById("btn-action");t&&l&&s&&r&&(t.addEventListener("touchstart",a=>{a.preventDefault(),b.ArrowLeft=!0},{passive:!1}),t.addEventListener("touchend",a=>{a.preventDefault(),b.ArrowLeft=!1},{passive:!1}),l.addEventListener("touchstart",a=>{a.preventDefault(),b.ArrowRight=!0},{passive:!1}),l.addEventListener("touchend",a=>{a.preventDefault(),b.ArrowRight=!1},{passive:!1}),s.addEventListener("touchstart",a=>{a.preventDefault(),b.Space=!0},{passive:!1}),s.addEventListener("touchend",a=>{a.preventDefault(),b.Space=!1},{passive:!1}),t.addEventListener("mousedown",a=>{a.preventDefault(),b.ArrowLeft=!0}),t.addEventListener("mouseup",a=>{a.preventDefault(),b.ArrowLeft=!1}),l.addEventListener("mousedown",a=>{a.preventDefault(),b.ArrowRight=!0}),l.addEventListener("mouseup",a=>{a.preventDefault(),b.ArrowRight=!1}),s.addEventListener("mousedown",a=>{a.preventDefault(),b.Space=!0}),s.addEventListener("mouseup",a=>{a.preventDefault(),b.Space=!1}),r.addEventListener("touchstart",a=>{a.preventDefault(),b.KeyE=!0},{passive:!1}),r.addEventListener("touchend",a=>{a.preventDefault(),b.KeyE=!1},{passive:!1}),r.addEventListener("mousedown",a=>{a.preventDefault(),b.KeyE=!0}),r.addEventListener("mouseup",a=>{a.preventDefault(),b.KeyE=!1}))}jt();De();let fe=[],Me=0;function ue(){fe=[];for(let t=0;t<60;t++){const l=Math.random()*Math.PI*2,s=4+Math.random()*3;fe.push({x:h.width/2+(Math.random()-.5)*100,y:h.height/2-80+(Math.random()-.5)*40,vx:Math.cos(l)*s,vy:Math.sin(l)*s-2,color:`hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`,size:8+Math.random()*8,life:60+Math.random()*40,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.2})}Me=60}function Xt(){for(const t of fe)t.x+=t.vx,t.y+=t.vy,t.vy+=.15,t.angle+=t.spin,t.life--;fe=fe.filter(t=>t.life>0&&t.y<h.height+40),Me>0&&Me--}function Jt(){for(const t of fe)e.save(),e.translate(t.x,t.y),e.rotate(t.angle),e.fillStyle=t.color,e.fillRect(-t.size/2,-t.size/6,t.size,t.size/3),e.restore()}function Yt(){if(G&&be&&ee){const o=ee,c=Math.max(h.width/o.width,h.height/o.height),f=o.width*c,y=o.height*c;let x=-T%f;x>0&&(x-=f);for(let g=x;g<h.width;g+=f)e.drawImage(o,g,0,f,y)}else if(Q){const o=e.createLinearGradient(0,0,0,h.height);o.addColorStop(0,pe[0]),o.addColorStop(1,pe[1]),e.fillStyle=o,e.fillRect(0,0,h.width,h.height)}else if(Z){const o=e.createLinearGradient(-T,0,se-T,h.height);o.addColorStop(0,me[0]),o.addColorStop(1,me[1]),e.fillStyle=o,e.fillRect(0,0,h.width,h.height)}else e.fillStyle="#87ceeb",e.fillRect(0,0,h.width,h.height);e.save();let t=1;if(E==="vertical"){const o=Math.max(...u.map(f=>f.width)),c=Math.max(h.width,o);t=h.width/c,T=Math.max(0,Math.min(n.x+n.width/2-h.width/(2*t),c-h.width/t)),M=Math.max(0,Math.min(n.y+n.height/2-h.height/(2*t),P-h.height/t)),e.scale(t,t)}e.translate(-T,-M),e.fillStyle="#654321";let l=-1;if(E==="vertical"&&u.length>0){let o=-1/0;for(let c=0;c<u.length;c++)u[c].y>o&&(o=u[c].y,l=c)}for(let o=0;o<u.length;o++){const c=u[o];"isSlope"in c&&c.isSlope?(e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(c.x+c.width,c.endY),e.lineTo(c.x+c.width,c.endY+c.height),e.lineTo(c.x,c.y+c.height),e.closePath(),e.fill()):e.fillRect(c.x,c.y,c.width,c.height),E==="vertical"&&o===l&&(e.save(),e.font="bold 48px sans-serif",e.fillStyle="#fff",e.textAlign="center",e.textBaseline="middle",e.globalAlpha=.85,e.fillText("↑",c.x+c.width/2,c.y+c.height/2),e.globalAlpha=1,e.restore())}e.fillStyle="#888";for(const o of X)e.fillRect(o.x,o.y,o.width,o.height);e.fillStyle="#b5651d";for(const o of q)e.fillRect(o.x,o.y,o.width,o.height);for(const o of w)o.collected||(o.type==="coin"?(e.fillStyle="#0cf",e.beginPath(),e.arc(o.x+o.width/2,o.y+o.height/2,10,0,2*Math.PI),e.fill()):o.type==="heart"?(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()):o.type==="doublejump"?(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore()):o.type==="grow"&&(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()));e.fillStyle="#e33";for(const o of V)e.beginPath(),e.moveTo(o.x,o.y+o.height),e.lineTo(o.x+o.width/2,o.y),e.lineTo(o.x+o.width,o.y+o.height),e.closePath(),e.fill();e.fillStyle="#0a8000";for(const o of ie){e.fillRect(o.x,o.y,o.width,o.height),e.fillStyle="#064000";const c=Math.max(o.y,k-15);e.fillRect(o.x+4,c,o.width-8,15),e.fillStyle="#0c8000",e.fillRect(o.x+8,o.y+8,3,o.height-16),e.fillRect(o.x+o.width-11,o.y+8,3,o.height-16),e.fillRect(o.x+4,o.y+o.height/4,o.width-8,2),e.fillRect(o.x+4,o.y+o.height/2,o.width-8,2),e.fillRect(o.x+4,o.y+3*o.height/4,o.width-8,2),e.fillStyle="#0a8000"}for(const o of Y)if(o.alive&&d.targetEnemy!==o)if(o.type==="circle"){e.fillStyle="#f06",e.beginPath(),e.arc(o.x+o.width/2,o.y+o.height/2,o.width/2,0,2*Math.PI),e.fill(),e.fillStyle="#000";const c=3;e.fillRect(o.x+8,o.y+8,c,c),e.fillRect(o.x+o.width-11,o.y+8,c,c)}else{e.fillStyle="#f90",e.fillRect(o.x,o.y,o.width,o.height),e.fillStyle="#000";const c=4;e.fillRect(o.x+6,o.y+8,c,c),e.fillRect(o.x+o.width-10,o.y+8,c,c)}if(xt(),e.restore(),F>0&&Math.floor(F/5)%2===0?e.globalAlpha=.3:e.globalAlpha=1,e.save(),H==="SQUARE")e.fillStyle="#ff0",e.fillRect(n.x-T,n.y-M,n.width,n.height);else if(e.font=`${Math.min(n.width,n.height)}px serif`,e.textAlign="center",["🟡","🔴","🔵","🟢"].includes(H)){const c=Math.round(n.height*.4);e.textBaseline="middle",e.fillText(H,n.x-T+n.width/2,n.y-M+n.height-c)}else e.textBaseline="middle",e.fillText(H,n.x-T+n.width/2,n.y-M+n.height/2);e.restore(),e.globalAlpha=1,e.save(),e.fillStyle="#0cf";let s=v,r=[];for(const o of _.values())typeof o.score=="number"&&o.score>s?(s=o.score,r=[o.id]):typeof o.score=="number"&&o.score===s&&r.push(o.id);v===s&&r.push("self");for(const o of _.values())e.fillRect(o.x-T,o.y-M,o.width,o.height),L&&_.size>0&&o.name&&(e.save(),e.font="16px sans-serif",r.includes(o.id)?(e.fillStyle="gold",e.fillText("👑",o.x-T+o.width/2,o.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(o.name,o.x-T+o.width/2,o.y-8),e.restore());e.restore(),L&&_.size>0&&(e.save(),e.font="16px sans-serif",r.includes("self")?(e.fillStyle="gold",e.fillText("👑",n.x-T+n.width/2,n.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(D||"Player",n.x-T+n.width/2,n.y-8),e.restore()),e.save(),e.fillStyle="#fff",e.font="20px sans-serif",e.textAlign="left",e.fillText(`Score: ${v}`,20,30),e.fillText(`Top Score: ${we}`,20,60),e.fillText(`Level: ${B}`,20,90),e.fillStyle="#ffd700",e.fillText(`Total Points: ${N}`,20,120),e.fillStyle="#fff";let a=150;if(Te&&(e.fillText(`FPS: ${Ge}`,20,a),a+=30),J&&(e.fillStyle="#0cf",e.fillText(`Speed: ${ke}x`,20,a),e.fillStyle="#fff"),L&&_.size>0){const o=new Map;o.set(z.currentPlayerId,{id:z.currentPlayerId,name:D||"Player",score:v,isSelf:!0});for(const f of _.values())f.id!==z.currentPlayerId&&o.set(f.id,{id:f.id,name:f.name||"Player",score:typeof f.score=="number"?f.score:0,isSelf:!1});const c=Array.from(o.values());c.sort((f,y)=>y.score-f.score),e.save(),e.globalAlpha=.85,e.fillStyle="#222",e.fillRect(h.width-240,20,220,36+32*Math.min(5,c.length)),e.globalAlpha=1,e.font="18px sans-serif",e.fillStyle="#fff",e.textAlign="left",e.fillText("Leaderboard",h.width-225,44);for(let f=0;f<Math.min(5,c.length);f++){const y=c[f];e.font=y.isSelf?"bold 18px sans-serif":"18px sans-serif",e.fillStyle=y.isSelf?"#0cf":f===0?"gold":"#fff";const x=f===0?"👑 ":"";e.fillText(`${x}${y.name.slice(0,12)}`,h.width-225,76+f*32),e.textAlign="right",e.fillText(String(y.score),h.width-30,76+f*32),e.textAlign="left"}e.restore()}for(let o=0;o<j;o++)e.save(),e.translate(20+o*28,120),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore();let i=20+j*28+20;n.hasDoubleJump&&(e.save(),e.translate(i,120),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore(),i+=36);for(let o=0;o<n.growLevel;o++)e.save(),e.translate(i,120),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),i+=36;n.eatenEnemy&&(e.save(),e.translate(i,120),n.eatenEnemy.type==="circle"&&(e.fillStyle="#f06",e.beginPath(),e.arc(0,0,10,0,2*Math.PI),e.fill(),e.strokeStyle="#fff",e.lineWidth=2,e.stroke()),e.restore(),i+=36),e.restore(),le?(e.save(),e.fillStyle="rgba(0, 0, 0, 0.7)",e.fillRect(h.width/2-200,h.height/2-100,400,200),e.strokeStyle="#444",e.lineWidth=2,e.strokeRect(h.width/2-200,h.height/2-100,400,200),e.font="bold 48px sans-serif",e.fillStyle="#e33",e.textAlign="center",e.fillText("Game Over",h.width/2,h.height/2-60),e.font="32px sans-serif",e.fillStyle="#fff",e.fillText(`Score: ${v}`,h.width/2,h.height/2-10),e.fillText(`Top Score: ${we}`,h.width/2,h.height/2+40),v>Number(localStorage.getItem("topScore")||"0")&&(e.font="bold 28px sans-serif",e.fillStyle="#0cf",e.fillText("You beat your own top score!",h.width/2,h.height/2+90),Me===0&&ue()),e.restore(),He()):(bt(),Ne()),e.save(),e.translate(-T,-M),e.fillStyle="#fff",e.fillRect(S.x,S.y,8,S.height),e.beginPath(),e.moveTo(S.x+8,S.y),e.lineTo(S.x+8+32,S.y+16),e.lineTo(S.x+8,S.y+32),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),Jt()}function Qe(){const t=performance.now(),l=t-_e;Yt(),l>=1e3/ot&&(Ue++,Ue%60===0&&(Ge=Math.round(1e3/(l/60))),Bt(l/1e3),Xt(),_e=t),requestAnimationFrame(Qe)}const b={};let Ye=!1,Oe=!1,xe=0;window.addEventListener("keydown",t=>{b[t.code]=!0});window.addEventListener("keyup",t=>{b[t.code]=!1});L?(async()=>{try{await z.initialize()?(console.log("Multiplayer enabled!"),z.onGameStateUpdate(l=>{_.clear(),l.players.forEach(s=>{s.id!==z.currentPlayerId?_.set(s.id,s):(s.name&&s.name!==D&&(D=s.name,localStorage.setItem("playerName",D),U&&(U.value=D)),typeof s.score=="number"&&(v=s.score,ce(v)))})}),z.onPlayerJoined(l=>{console.log(`Player ${l} joined the game!`)}),z.onPlayerLeft(l=>{console.log(`Player ${l} left the game`),_.delete(l)}),z.onPlayerUpdate((l,s,r,a)=>{if(_.has(l)){const i=_.get(l);Object.assign(i,s),typeof r=="number"&&(i.score=r),typeof a=="string"&&(i.name=a)}else _.set(l,{id:l,...s,score:r,name:a});l===z.currentPlayerId&&(typeof r=="number"&&(v=r,ce(v)),typeof a=="string"&&a!==D&&(D=a,localStorage.setItem("playerName",D),U&&(U.value=D)))})):console.log("Running in single-player mode")}catch{console.log("Multiplayer initialization failed, continuing in single-player mode")}})():console.log("Running in single-player mode");Qe();function Ot(){u.length=0,q.length=0,w.length=0,V.length=0,X.length=0,Y.length=0,ie.length=0,u.push({x:0,y:P,width:h.width,height:50});const t=60,l=60;for(let p=P-100;p>0;p-=l)for(let A=20;A<h.width-20;A+=t)w.push({x:A,y:p,width:20,height:20,collected:!1,type:"coin",id:W("coin")});const s=80,r=20,a=60,i=P-60,o=80,c=[40,h.width/2-s/2,h.width-s-40];let f=0;for(let p=i;p>o;p-=a){let A;p>P-300||p>P/2?A=c:A=[40+f%2*(h.width-s-80)];for(const C of A)X.push({x:C,y:p,width:s,height:r,dx:f%2===0?2:-2,range:120,startX:C}),f++}const x=13*8,g=50,m=40+x,I={x:0,y:m,width:h.width,height:g};if(u.push(I),S.x=h.width/2-S.width/2,S.y=m-80+g,n.x=50,n.y=P-n.height-10,n.vx=0,n.vy=0,he(),M=Math.max(0,P-h.height),E="vertical",L&&w.length>0){const p=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{fetch(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:w.map(A=>({id:A.id,type:A.type}))})})}catch{}}}
