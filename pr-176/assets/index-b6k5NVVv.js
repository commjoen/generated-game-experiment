(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function a(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=a(s);fetch(s.href,i)}})();class xt{constructor(){this.ws=null,this.isConnected=!1,this.isHost=!1,this.reconnectAttempts=0,this.maxReconnectAttempts=3,this.reconnectDelay=1e3,this.playerId=this.generatePlayerId()}generatePlayerId(){return"player_"+Math.random().toString(36).substr(2,9)}async checkServerAvailable(n=this.getDefaultServerUrl()){try{if(n==="/ws")return(await fetch("/mp/health",{method:"GET",signal:AbortSignal.timeout(2e3)})).ok;const a=n.replace("ws://","http://").replace("wss://","https://");let r;return a.includes("/ws")?r=a.replace("/ws","/mp/health"):r=`${a}/health`,(await fetch(r,{method:"GET",signal:AbortSignal.timeout(2e3)})).ok}catch{return console.log("Multiplayer server not available, running in single-player mode"),!1}}getDefaultServerUrl(){const n=window.location.protocol==="https:"?"wss:":"ws:",a=window.location.host,r=window.location.hostname;if(r==="onrender.com"||r.endsWith(".onrender.com")||!a.includes("localhost"))return"/ws";if(a.includes("localhost:5173")||a.includes("127.0.0.1:5173"))return"ws://localhost:3001";if(a.includes(":8080")||r==="localhost"&&a.includes(":80")){const s=a.split(":")[0];return`${n}//${s}:3001`}return`${n}//${a}:3001`}async initialize(n=this.getDefaultServerUrl()){try{return await this.checkServerAvailable(n)?(this.ws=new WebSocket(n),new Promise(r=>{if(!this.ws){r(!1);return}const s=setTimeout(()=>{console.log("Connection timeout, falling back to single-player mode"),this.disconnect(),r(!1)},5e3);this.ws.onopen=()=>{clearTimeout(s),this.isConnected=!0,this.reconnectAttempts=0,console.log("Connected to multiplayer server");let i="";try{i=localStorage.getItem("playerName")||""}catch{}this.send({type:"join",playerId:this.playerId,name:i,timestamp:Date.now()}),r(!0)},this.ws.onmessage=i=>{try{const o=JSON.parse(i.data);this.handleMessage(o)}catch(o){console.error("Error parsing message:",o)}},this.ws.onclose=()=>{this.isConnected=!1,console.log("Disconnected from multiplayer server"),this.attemptReconnect(n)},this.ws.onerror=i=>{clearTimeout(s),console.log("WebSocket error, falling back to single-player mode"),this.isConnected=!1,r(!1)}})):(console.log("Multiplayer server not available, continuing in single-player mode"),!1)}catch{return console.log("Failed to initialize multiplayer, continuing in single-player mode"),!1}}attemptReconnect(n){this.reconnectAttempts<this.maxReconnectAttempts?(this.reconnectAttempts++,console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`),setTimeout(()=>{this.initialize(n)},this.reconnectDelay*this.reconnectAttempts)):console.log("Max reconnection attempts reached, continuing in single-player mode")}handleMessage(n){switch(n.type){case"gameState":this.onStateUpdate&&this.onStateUpdate(n.gameState);break;case"playerJoined":n.playerId===this.playerId&&(this.isHost=n.isHost||!1),this.onPlayerJoin&&this.onPlayerJoin(n.playerId);break;case"playerLeft":this.onPlayerLeave&&this.onPlayerLeave(n.playerId);break;case"playerUpdate":this._onPlayerUpdate&&this._onPlayerUpdate(n.playerId,n.position,n.score,n.name);break;case"itemCollected":this._onPlayerUpdate&&this._onPlayerUpdate(n.playerId,{},n.score,n.name);break}}send(n){if(this.ws&&this.isConnected)try{this.ws.send(JSON.stringify(n))}catch(a){console.error("Error sending message:",a),this.isConnected=!1}}updatePlayerPosition(n,a,r,s,i){this.isConnected&&this.send({type:"playerUpdate",playerId:this.playerId,position:{x:n,y:a,width:r,height:s,growLevel:i},timestamp:Date.now()})}collectItem(n){this.isConnected&&this.send({type:"collectItem",playerId:this.playerId,collectibleId:n,timestamp:Date.now()})}onGameStateUpdate(n){this.onStateUpdate=n}onPlayerJoined(n){this.onPlayerJoin=n}onPlayerLeft(n){this.onPlayerLeave=n}onPlayerUpdate(n){this._onPlayerUpdate=n}get connected(){return this.isConnected}get currentPlayerId(){return this.playerId}get isHostPlayer(){return this.isHost}disconnect(){this.ws&&(this.ws.close(),this.ws=null),this.isConnected=!1}ping(){this.isConnected&&this.send({type:"ping",timestamp:Date.now()})}}const D=new xt,$e=[{id:"p001",name:"Apple - Red Delicious",barcode:"123456789012",price:1.5,quantity:100,category:"Fruits"},{id:"p002",name:"Bananas - Organic",barcode:"234567890123",price:2.25,quantity:80,category:"Fruits"},{id:"p003",name:"Milk - Whole 1L",barcode:"345678901234",price:3.99,quantity:50,category:"Dairy"},{id:"p004",name:"Bread - Whole Wheat",barcode:"456789012345",price:2.99,quantity:30,category:"Bakery"},{id:"p005",name:"Orange Juice - 1L",barcode:"567890123456",price:4.49,quantity:25,category:"Beverages"},{id:"p006",name:"Chicken Breast - 1kg",barcode:"678901234567",price:12.99,quantity:15,category:"Meat"},{id:"p007",name:"Pasta - Spaghetti 500g",barcode:"789012345678",price:1.99,quantity:60,category:"Pantry"},{id:"p008",name:"Tomatoes - Cherry 250g",barcode:"890123456789",price:3.49,quantity:40,category:"Vegetables"},{id:"p009",name:"Cereal - Cornflakes",barcode:"901234567890",price:5.99,quantity:20,category:"Breakfast"},{id:"p010",name:"Coffee - Ground 250g",barcode:"012345678901",price:8.99,quantity:35,category:"Beverages"}];function bt(t){return $e.find(n=>n.barcode===t)||null}function wt(t){return $e.filter(n=>n.category===t)}function vt(){return[...new Set($e.map(t=>t.category))].sort()}class St{constructor(){this.items=new Map,this.storageKey="scannerCart",this.loadFromStorage()}addProduct(n,a=1){if(a<=0||a>n.quantity)return!1;const r=this.items.get(n.id);if(r){const s=r.quantity+a;if(s>n.quantity)return!1;r.quantity=s}else this.items.set(n.id,{product:n,quantity:a});return this.saveToStorage(),!0}removeProduct(n,a){const r=this.items.get(n);return r?(a===void 0||a>=r.quantity?this.items.delete(n):r.quantity-=a,this.saveToStorage(),!0):!1}clear(){this.items.clear(),this.saveToStorage()}getItems(){return Array.from(this.items.values())}getTotalItems(){return Array.from(this.items.values()).reduce((n,a)=>n+a.quantity,0)}getTotalPrice(){return Array.from(this.items.values()).reduce((n,a)=>n+a.product.price*a.quantity,0)}isEmpty(){return this.items.size===0}saveToStorage(){try{const n=Array.from(this.items.values());localStorage.setItem(this.storageKey,JSON.stringify(n))}catch(n){console.warn("Failed to save cart to storage:",n)}}loadFromStorage(){try{const n=localStorage.getItem(this.storageKey);if(n){const a=JSON.parse(n);this.items.clear(),a.forEach(r=>{this.items.set(r.product.id,r)})}}catch(n){console.warn("Failed to load cart from storage:",n),this.items.clear()}}}function Et(t){return/^\d{12}$/.test(t)}const f=document.getElementById("gameCanvas"),e=f.getContext("2d"),Tt=.5,Ke=5,Ge=13,L=400,Ct=60;let Qe=0,Ze=0,lt=0,X=localStorage.getItem("speedUnlocked")==="true",Oe=X?2:1,_e=localStorage.getItem("showFpsCounter")!=="false";const de=3200;let E=0,It=0;function Y(t){return`${t}_${Date.now()}_${It++}`}let kt=0;function Mt(){return`enemy_${Date.now()}_${kt++}`}let Pt=0;function Lt(){return`tube_${Date.now()}_${Pt++}`}const b=[],q=[],O=[],J=[],re=[];let S={x:0,y:0,width:24,height:80};const l={x:100,y:L-50,width:40,height:50,vx:0,vy:0,onGround:!1,hasDoubleJump:!1,growLevel:0,canDoubleJump:!1,eatenEnemy:null},h={type:"none",progress:0,duration:1e3,startTime:0,targetEnemy:null,startX:0,startY:0,endX:0,endY:0};let j=new Map,z=localStorage.getItem("multiplayerEnabled")==="true",et=0,R=localStorage.getItem("playerName")||"",_=null;const u=[],F=[];let T=localStorage.getItem("levelType")||"horizontal",oe=localStorage.getItem("manualLevelType")==="true",ie=localStorage.getItem("manualLevelTypeValue")||T,B=0;const $=3200;let G=null;async function Bt(){let t=$;const n=Math.min(Ge*8,180),a=140,r=320,s=50;u.length=0,F.length=0,b.length=0,q.length=0,O.length=0,J.length=0,re.length=0;const i=[];let o=100+Math.random()*(f.width-a-200),c=!0;for(;t>0;){let g,y;if(c)g=0,y=f.width,c=!1;else{y=a+Math.random()*(r-a);let k=Math.max(0,o-y+40),p=Math.min(f.width-y,o+y-40);k>p&&(k=p=o),g=k+Math.random()*(p-k)}u.push({x:g,y:t,width:y,height:s}),i.push({x:g+y/2,y:t-30}),Math.random()<.5&&b.push({x:g+y/2-10,y:t-30,width:20,height:20,collected:!1,type:"coin",id:Y("coin")}),Math.random()<.3&&t<$-n&&q.push({x:g+y/2-20,y:t+s-15,width:40,height:15}),Math.random()<.2&&t<$-n&&O.push({x:g-60,y:t-100,width:80,height:20,dx:2,range:120,startX:g-60}),t-=n,Math.random()<.5&&t>50&&F.push({x:g+10,y:t-40,width:40,height:40}),o=g}if(i.length>0){const g=Math.floor(Math.random()*i.length),y=i[g];b.push({x:y.x-10,y:y.y,width:20,height:20,collected:!1,type:"heart",id:Y("heart")})}if(i.length>1){let g,y=0;const k=i.length*3;do g=Math.floor(Math.random()*i.length),y++;while(y<k&&b.some(p=>p.x===i[g].x-10&&p.y===i[g].y));if(y<k){const p=i[g];b.push({x:p.x-10,y:p.y-30,width:20,height:20,collected:!1,type:"doublejump",id:Y("doublejump")})}}if(i.length>2){let g,y=0;const k=i.length*3;do g=Math.floor(Math.random()*i.length),y++;while(y<k&&(b.some(p=>p.x===i[g].x-10&&p.y===i[g].y)||b.some(p=>p.x===i[g].x-10&&p.y===i[g].y-30)));if(y<k){const p=i[g];b.push({x:p.x-10,y:p.y-60,width:20,height:20,collected:!1,type:"grow",id:Y("grow")})}}const d=$;u.some(g=>g.y<=d&&g.y+g.height>=d-40)||u.unshift({x:100,y:$,width:a+Math.random()*(r-a),height:s});const x=u[u.length-1];if(S.x=x.x+x.width/2-S.width/2,S.y=x.y-S.height,z&&b.length>0){const g=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:b.map(y=>({id:y.id,type:y.type}))})})}catch{}}}oe&&(T=ie);async function We(){if(T==="vertical"){await Bt();return}u.length=0,F.length=0,b.length=0,q.length=0,O.length=0,J.length=0,re.length=0;let t=0;const n=[];let a=0;for(;t<de;){const d=a===0,m=t<=100&&t+400>=100,x=!d&&!m&&Math.random()<.2,g=x?480+Math.random()*120:Math.random()<.2?320:160+Math.random()*160;let y;if(Math.random()<.25){const p=(Math.random()<.5?1:-1)*(20+Math.random()*20);y={x:t,y:L,width:g,height:50,endY:L+p,isSlope:!0,willHaveEnemies:x}}else y={x:t,y:L,width:g,height:50,willHaveEnemies:x};if(u.push(y),n.push({x:t+g/2,y:L-30}),Math.random()<.5&&b.push({x:t+g/2-10,y:L-30,width:20,height:20,collected:!1,type:"coin",id:Y("coin")}),Math.random()<.3&&t>0&&q.push({x:t-40,y:L+35,width:40,height:15}),Math.random()<.2&&t>0&&O.push({x:t-60,y:L-100,width:80,height:20,dx:2,range:120,startX:t-60}),y.willHaveEnemies&&g>200){const M=t+40,ye=t+g-40-40,Ae=M+Math.random()*Math.max(0,ye-M),I=L-60;re.push({x:Ae,y:I,width:40,height:80,id:Lt(),hasSpawnedEnemy:!1})}t+=g;const k=60+Math.random()*80;t+=k,Math.random()<.5&&t<de-50&&F.push({x:t+10,y:L-40,width:40,height:40}),a++}if(n.length>0){const d=Math.floor(Math.random()*n.length),m=n[d];b.push({x:m.x-10,y:m.y,width:20,height:20,collected:!1,type:"heart",id:Y("heart")})}if(n.length>1){let d,m=0;const x=n.length*3;do d=Math.floor(Math.random()*n.length),m++;while(m<x&&b.some(g=>g.x===n[d].x-10&&g.y===n[d].y));if(m<x){const g=n[d];b.push({x:g.x-10,y:g.y-30,width:20,height:20,collected:!1,type:"doublejump",id:Y("doublejump")})}}if(n.length>2){let d,m=0;const x=n.length*3;do d=Math.floor(Math.random()*n.length),m++;while(m<x&&(b.some(g=>g.x===n[d].x-10&&g.y===n[d].y)||b.some(g=>g.x===n[d].x-10&&g.y===n[d].y-30)));if(m<x){const g=n[d];b.push({x:g.x-10,y:g.y-60,width:20,height:20,collected:!1,type:"grow",id:Y("grow")})}}const r=100;u.some(d=>d.x<=r&&d.x+d.width>=r+40)||u.unshift({x:60,y:L,width:80,height:50});const i=u[u.length-1];let o=i.x+i.width-32,c="isSlope"in i&&i.isSlope?i.endY-S.height:i.y-S.height;if(S.x=o,S.y=c,z&&b.length>0){const d=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{await fetch(d,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:b.map(m=>({id:m.id,type:m.type}))})})}catch{}}}function Re(t,n){return t.x<n.x+n.width&&t.x+t.width>n.x&&t.y<n.y+n.height&&t.y+t.height>n.y}let v=0,A=1,$t=de-100,Z=0,U=3,V=!1,Pe=Number(localStorage.getItem("topScore")||"0"),he=!1,ve=0,N=Number(localStorage.getItem("totalPoints")||"0"),W=localStorage.getItem("playerCharacter")||"SQUARE",fe=JSON.parse(localStorage.getItem("purchasedUpgrades")||"{}"),ge=JSON.parse(localStorage.getItem("enabledUpgrades")||"{}");function ae(t){return!!(fe[t]&&ge[t]!==!1)}function zt(t){fe[t]&&(ge[t]=!ge[t],localStorage.setItem("enabledUpgrades",JSON.stringify(ge)))}We().then(()=>{ze()}).then(()=>{ae("extra_life")?U=4:ae("tough_skin")&&(U=5),ae("double_jump_start")&&(l.hasDoubleJump=!0)});const xe={characters:[{id:"yellow_square",emoji:"SQUARE",name:"Yellow Square",cost:0,unlocked:!0},{id:"yellow_circle",emoji:"🟡",name:"Yellow Circle",cost:10},{id:"red_circle",emoji:"🔴",name:"Red Circle",cost:50},{id:"blue_circle",emoji:"🔵",name:"Blue Circle",cost:50},{id:"green_circle",emoji:"🟢",name:"Green Circle",cost:50},{id:"smiley",emoji:"😊",name:"Smiley Face",cost:100},{id:"grinning",emoji:"😃",name:"Grinning Face",cost:125},{id:"cool",emoji:"😎",name:"Cool Face",cost:150},{id:"beaming",emoji:"😁",name:"Beaming Face",cost:175},{id:"star",emoji:"⭐",name:"Star",cost:200},{id:"rofl",emoji:"🤣",name:"ROFL Face",cost:225},{id:"crown",emoji:"👑",name:"Crown",cost:300},{id:"hugging",emoji:"🤗",name:"Hugging Face",cost:350},{id:"party",emoji:"🥳",name:"Party Face",cost:400},{id:"rocket",emoji:"🚀",name:"Rocket",cost:500},{id:"cherry_blossom",emoji:"🌸",name:"Cherry Blossom",cost:600},{id:"hearts",emoji:"💞",name:"Revolving Hearts",cost:650},{id:"alien",emoji:"👽",name:"Alien",cost:750},{id:"koala",emoji:"🐨",name:"Koala",cost:800}],gameplay:[{id:"extra_life",name:"Start with Extra Life",cost:100,description:"Begin each game with 4 lives instead of 3"},{id:"double_jump_start",name:"Start with Double Jump",cost:200,description:"Begin each level with double jump ability"},{id:"speed_boost",name:"Permanent Speed Boost",cost:300,description:"1.5x movement speed permanently"},{id:"lucky_coins",name:"Lucky Coins",cost:400,description:"Coins are worth 2 points each"},{id:"tough_skin",name:"Tough Skin",cost:500,description:"Start each game with 5 lives instead of 3"}]};function pe(t){t>Pe&&(Pe=t,localStorage.setItem("topScore",String(Pe)))}function ce(t){N+=t,localStorage.setItem("totalPoints",String(N))}function At(t){return N>=t?(N-=t,localStorage.setItem("totalPoints",String(N)),!0):!1}function tt(t){if(fe[t])return!1;let n=0,a=!1;for(const r of xe.characters)if(r.id===t){n=r.cost,a=!0;break}if(!a){for(const r of xe.gameplay)if(r.id===t){n=r.cost,a=!0;break}}if(!a||!At(n))return!1;if(fe[t]=!0,ge[t]=!0,localStorage.setItem("purchasedUpgrades",JSON.stringify(fe)),localStorage.setItem("enabledUpgrades",JSON.stringify(ge)),xe.characters.some(r=>r.id===t)){const r=xe.characters.find(s=>s.id===t);r&&(W=r.emoji,localStorage.setItem("playerCharacter",W))}return!0}function Rt(){const t=document.getElementById("shop-modal");if(t){t.style.display="flex";const n=document.getElementById("github-star-btn");n&&(n.style.display="none"),Me()}}function Me(){const t=document.getElementById("shop-points");t&&(t.textContent=String(N));const n=document.getElementById("character-upgrades");n&&(n.innerHTML="",xe.characters.forEach(r=>{const s=r.unlocked||fe[r.id],i=W===r.emoji,o=N>=r.cost,c=document.createElement("div");c.style.cssText=`
        display:flex;
        flex-direction:column;
        align-items:center;
        padding:12px;
        border-radius:8px;
        border:2px solid ${i?"#ffd700":s?"#0cf":"#666"};
        background:${i?"rgba(255,215,0,0.1)":s?"rgba(0,204,255,0.1)":"#333"};
        cursor:pointer;
        transition:all 0.2s;
      `,c.innerHTML=`
        <div style="font-size:2em;margin-bottom:8px;">${r.emoji==="SQUARE"?"🟨":r.emoji}</div>
        <div style="font-size:0.9em;text-align:center;margin-bottom:4px;">${r.name}</div>
        <div style="font-size:0.8em;color:${s?"#0cf":o?"#ffd700":"#999"};">
          ${s?i?"Selected":"Owned":`${r.cost} pts`}
        </div>
      `,c.addEventListener("click",()=>{s?(W=r.emoji,localStorage.setItem("playerCharacter",W),Me()):o&&tt(r.id)&&Me()}),n.appendChild(c)}));const a=document.getElementById("gameplay-upgrades");a&&(a.innerHTML="",xe.gameplay.forEach(r=>{const s=fe[r.id],i=N>=r.cost,o=ge[r.id]!==!1,c=document.createElement("div");if(c.style.cssText=`
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:16px;
        border-radius:8px;
        border:2px solid ${s?"#0cf":"#666"};
        background:${s?"rgba(0,204,255,0.1)":"#333"};
        ${!s&&i?"cursor:pointer;":""}
        transition:all 0.2s;
      `,s){c.innerHTML=`
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
            <div style="font-size:0.9em;color:#ccc;">${r.description}</div>
          </div>
          <div style="text-align:right;display:flex;align-items:center;gap:8px;">
            <span style="font-size:0.9em;color:${o?"#0cf":"#999"};">
              ${o?"Enabled":"Disabled"}
            </span>
            <label style="position:relative;display:inline-block;width:40px;height:20px;">
              <input type="checkbox" ${o?"checked":""} style="opacity:0;width:0;height:0;">
              <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${o?"#0cf":"#666"};border-radius:20px;transition:.4s;">
                <span style="position:absolute;content:'';height:16px;width:16px;left:${o?"22px":"2px"};bottom:2px;background:white;border-radius:50%;transition:.4s;"></span>
              </span>
            </label>
          </div>
        `;const d=c.querySelector('input[type="checkbox"]');d&&d.addEventListener("change",()=>{zt(r.id),Me()})}else c.innerHTML=`
          <div>
            <div style="font-weight:bold;margin-bottom:4px;">${r.name}</div>
            <div style="font-size:0.9em;color:#ccc;">${r.description}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:1.2em;color:${i?"#ffd700":"#999"};">
              ${r.cost} pts
            </div>
          </div>
        `,i&&c.addEventListener("click",()=>{tt(r.id)&&Me()});a.appendChild(c)}))}let se,He="All";function Dt(){se=new St,Ie(),at(),rt("All")}function jt(){const t=document.getElementById("scanner-modal");if(t){t.style.display="flex";const n=document.getElementById("github-star-btn");n&&(n.style.display="none"),Ie()}}function Ie(){const t=document.getElementById("cart-total"),n=document.getElementById("cart-items");t&&(t.textContent=se.getTotalPrice().toFixed(2)),n&&(n.textContent=se.getTotalItems().toString()),_t()}function _t(){const t=document.getElementById("cart-items-list");if(!t)return;const n=se.getItems();if(n.length===0){t.innerHTML=`
      <div style="color: #888; text-align: center; padding: 20px;">
        Cart is empty
      </div>
    `;return}t.innerHTML=n.map(a=>`
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: #444;
      border-radius: 8px;
      border: 1px solid #555;
    ">
      <div style="flex: 1;">
        <div style="font-weight: bold; color: #fff;">${a.product.name}</div>
        <div style="font-size: 0.9em; color: #ccc;">
          ${a.product.category} • $${a.product.price.toFixed(2)} each
        </div>
        <div style="font-size: 0.8em; color: #888; font-family: monospace;">
          ${a.product.barcode}
        </div>
      </div>
      <div style="
        display: flex;
        align-items: center;
        gap: 8px;
        color: #0cf;
      ">
        <button 
          onclick="removeFromCart('${a.product.id}', 1)"
          style="
            background: #555;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.8em;
          "
        >−</button>
        <span style="
          min-width: 20px;
          text-align: center;
          font-weight: bold;
        ">×${a.quantity}</span>
        <button 
          onclick="addToCartById('${a.product.id}', 1)"
          style="
            background: #555;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.8em;
          "
        >+</button>
        <span style="
          min-width: 60px;
          text-align: right;
          font-weight: bold;
          color: #0cf;
        ">$${(a.product.price*a.quantity).toFixed(2)}</span>
        <button 
          onclick="removeFromCart('${a.product.id}')"
          style="
            background: #d63031;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 0.8em;
            margin-left: 8px;
          "
        >🗑️</button>
      </div>
    </div>
  `).join("")}function Ye(t){const n=document.getElementById("scan-result");if(!n)return;if(n.style.background="#444",n.style.border="1px solid #555",!Et(t)){n.innerHTML=`
      <div style="color: #ff6b6b; text-align: center;">
        <div style="font-size: 1.2em;">❌ Invalid Barcode</div>
        <div style="font-size: 0.9em; margin-top: 4px;">
          Please enter a 12-digit barcode
        </div>
      </div>
    `;return}const a=bt(t);if(!a){n.innerHTML=`
      <div style="color: #ff6b6b; text-align: center;">
        <div style="font-size: 1.2em;">❌ Product Not Found</div>
        <div style="font-size: 0.9em; margin-top: 4px;">
          Barcode: ${t}
        </div>
      </div>
    `;return}if(se.addProduct(a,1)){n.style.background="#2d5a2d",n.style.border="1px solid #4a934a",n.innerHTML=`
      <div style="color: #4a934a; text-align: center;">
        <div style="font-size: 1.2em;">✅ ${a.name}</div>
        <div style="color: #0cf; font-weight: bold; margin: 4px 0;">
          $${a.price.toFixed(2)}
        </div>
        <div style="font-size: 0.9em;">
          Added to cart
        </div>
      </div>
    `,Ie();const s=document.getElementById("barcode-input");s&&(s.value="")}else n.style.background="#5a2d2d",n.style.border="1px solid #944a4a",n.innerHTML=`
      <div style="color: #ff6b6b; text-align: center;">
        <div style="font-size: 1.2em;">⚠️ Cannot Add</div>
        <div style="font-size: 0.9em; margin-top: 4px;">
          Not enough stock or invalid quantity
        </div>
      </div>
    `}function at(){const t=document.getElementById("product-categories");if(!t)return;const n=["All",...vt()];t.innerHTML=n.map(a=>`
    <button 
      onclick="selectCategory('${a}')"
      id="category-${a}"
      style="
        padding: 8px 16px;
        background: ${a===He?"#0cf":"#555"};
        color: ${a===He?"#000":"#fff"};
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9em;
        white-space: nowrap;
      "
    >
      ${a}
    </button>
  `).join("")}function Ut(t){He=t,at(),rt(t)}function rt(t){const n=document.getElementById("product-list");if(!n)return;const a=t==="All"?$e:wt(t);if(a.length===0){n.innerHTML=`
      <div style="color: #888; text-align: center; padding: 20px;">
        No products in this category
      </div>
    `;return}n.innerHTML=a.map(r=>`
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      margin-bottom: 8px;
      background: #444;
      border-radius: 8px;
      border: 1px solid #555;
    ">
      <div style="flex: 1;">
        <div style="font-weight: bold; color: #fff;">${r.name}</div>
        <div style="font-size: 0.9em; color: #0cf;">$${r.price.toFixed(2)}</div>
        <div style="font-size: 0.8em; color: #888; font-family: monospace;">
          ${r.barcode} • Stock: ${r.quantity}
        </div>
      </div>
      <button 
        onclick="quickScanProduct('${r.barcode}')"
        style="
          padding: 8px 16px;
          background: #ff6b6b;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          white-space: nowrap;
        "
      >
        🔍 Scan
      </button>
    </div>
  `).join("")}function Ot(t,n=1){const a=$e.find(r=>r.id===t);a&&(se.addProduct(a,n),Ie())}function Xt(t,n){se.removeProduct(t,n),Ie()}function st(){se.clear(),Ie()}function ct(t){const n=document.getElementById("barcode-input");n&&(n.value=t),Ye(t)}window.addToCartById=Ot;window.removeFromCart=Xt;window.clearCart=st;window.quickScanProduct=ct;window.selectCategory=Ut;function Fe(){v=0,A=1,U=3,ae("extra_life")&&(U=4),ae("tough_skin")&&(U=5),localStorage.setItem("levelType","horizontal"),V=!1,u.length=0,F.length=0,b.length=0,q.length=0,O.length=0,J.length=0,re.length=0,oe?T=ie:T="horizontal",We(),ae("double_jump_start")&&(l.hasDoubleJump=!0),ze()}function ze(){if(T==="vertical"){const t=u[0];l.x=t.x+t.width/2-l.width/2,l.y=t.y-l.height,l.vx=0,l.vy=0;const n=Math.max(...u.map(i=>i.width)),a=Math.max(f.width,n),r=f.width/a,s=f.height/r;B=Math.min(Math.max(0,l.y+l.height-s+8),$-s)}else l.x=100,l.y=L-175,l.vx=0,l.vy=0;l.canDoubleJump=!1,be()}function be(){l.growLevel===0?(l.width=40,l.height=50):l.growLevel===1?(l.width=60,l.height=75):l.growLevel===2?(l.width=80,l.height=100):l.growLevel>=3&&(l.width=100,l.height=125)}function dt(){return l.growLevel===0?100:l.growLevel===1?120:l.growLevel>=2?150:100}function Wt(){const t=dt();for(const n of J){if(!n.alive||n.type!=="circle")continue;const a=l.x+l.width/2,r=l.y+l.height/2,s=n.x+n.width/2,i=n.y+n.height/2;if(Math.sqrt(Math.pow(a-s,2)+Math.pow(r-i,2))<=t)return n}return null}function Jt(t){h.type="eating",h.progress=0,h.startTime=Date.now(),h.targetEnemy=t,h.startX=t.x+t.width/2,h.startY=t.y+t.height/2}function Gt(){if(!l.eatenEnemy)return;h.type="spitting",h.progress=0,h.startTime=Date.now();const n=(l.vx>=0?1:-1)>0?f.width+E:E-50;h.endX=n,h.endY=l.y+l.height/2,h.targetEnemy={x:l.x+l.width/2,y:l.y+l.height/2,width:30,height:30,dx:0,dy:0,range:0,startX:0,alive:!0,id:"temp_spit",isJumpingOut:!1,type:l.eatenEnemy.type}}function Ht(){h.type="targeting",h.progress=0,h.duration=300,h.startTime=Date.now(),h.targetEnemy=null,h.startX=0,h.startY=0,h.endX=0,h.endY=0}function Yt(t){if(h.type==="none")return;const n=Date.now()-h.startTime;if(h.progress=Math.min(n/h.duration,1),h.type==="eating"&&h.targetEnemy){const a=l.x+l.width/2,r=l.y+l.height/2,s=h.startX+(a-h.startX)*h.progress,i=h.startY+(r-h.startY)*h.progress;h.targetEnemy.x=s-h.targetEnemy.width/2,h.targetEnemy.y=i-h.targetEnemy.height/2,h.progress>=1&&(l.eatenEnemy={...h.targetEnemy},h.targetEnemy.alive=!1,h.type="none",h.targetEnemy=null)}else if(h.type==="spitting"&&h.targetEnemy){const a=l.x+l.width/2,r=l.y+l.height/2,s=a+(h.endX-a)*h.progress,i=r+(h.endY-r)*h.progress;h.targetEnemy.x=s-h.targetEnemy.width/2,h.targetEnemy.y=i-h.targetEnemy.height/2,h.progress>=1&&(l.eatenEnemy=null,h.type="none",h.targetEnemy=null)}else h.type==="targeting"&&h.progress>=1&&(h.type="none",h.targetEnemy=null)}function Nt(){if(h.type==="none")return;if(h.type==="targeting"){const s=l.x+l.width/2,i=l.y+l.height/2,o=dt(),c=s+o,d=i;e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(s,i),e.lineTo(c,d),e.stroke(),e.setLineDash([]);return}const t=l.x+l.width/2,n=l.y+l.height/2;if(!h.targetEnemy)return;let a,r;if(h.type==="eating"){const s=l.x+l.width/2,i=l.y+l.height/2,o=h.startX+(s-h.startX)*h.progress,c=h.startY+(i-h.startY)*h.progress;a=o,r=c}else a=h.targetEnemy.x+h.targetEnemy.width/2,r=h.targetEnemy.y+h.targetEnemy.height/2;if(e.strokeStyle="#8B4513",e.lineWidth=3,e.setLineDash([5,3]),e.beginPath(),e.moveTo(t,n),e.lineTo(a,r),e.stroke(),e.setLineDash([]),h.targetEnemy.type==="circle"){e.fillStyle="#f06",e.beginPath(),e.arc(a,r,h.targetEnemy.width/2,0,2*Math.PI),e.fill(),e.fillStyle="#000";const s=3;e.fillRect(a-8,r-3,s,s),e.fillRect(a+5,r-3,s,s)}else{e.fillStyle="#f90",e.fillRect(a-h.targetEnemy.width/2,r-h.targetEnemy.height/2,h.targetEnemy.width,h.targetEnemy.height),e.fillStyle="#000";const s=3;e.fillRect(a-8,r-3,s,s),e.fillRect(a+5,r-3,s,s)}}function De(){if(U--,U<=0){pe(v),V=!0,ht(),qt();return}l.hasDoubleJump=!1,l.growLevel=0,l.canDoubleJump=!1,l.eatenEnemy=null,be(),ze(),Z=30}function ht(){let t=document.getElementById("restart-btn");t?t&&(t.style.display="block",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% + 80px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 160px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="2em",t.style.padding="16px 32px")):(t=document.createElement("button"),t.id="restart-btn",t.textContent="Restart",t.style.position="fixed",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="2em",t.style.padding="16px 32px",t.style.zIndex="100",t.style.background="#222",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% + 80px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 160px)",t.style.left="50%",t.style.transform="translateX(-50%)"),t.onclick=()=>{t?.remove(),ft(),Fe()},document.body.appendChild(t))}function qt(){let t=document.getElementById("share-btn");t?t&&(t.style.display="block",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px")):(t=document.createElement("button"),t.id="share-btn",t.textContent="📤 Share Progress",t.style.position="fixed",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px",t.style.zIndex="100",t.style.background="#0cf",t.style.color="#fff",t.style.border="2px solid #0cf",t.style.borderRadius="12px",t.style.cursor="pointer",window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)"),t.onclick=()=>{pt()},document.body.appendChild(t))}function ft(){const t=document.getElementById("share-btn");t&&(t.style.display="none")}function Ft(){const t=document.getElementById("restart-btn");t&&(t.style.display="none")}function gt(){const t=document.createElement("canvas"),n=t.getContext("2d");return t.width=f.width,t.height=f.height,n.drawImage(f,0,0),n.save(),n.globalAlpha=.8,n.fillStyle="#000",n.fillRect(0,f.height-120,f.width,120),n.globalAlpha=1,n.fillStyle="#fff",n.font="bold 24px sans-serif",n.textAlign="center",n.fillText("Side-Scrolling Platformer",f.width/2,f.height-90),n.font="18px sans-serif",n.fillText(`Level ${A} • Score ${v}`,f.width/2,f.height-65),n.fillText("Play at: github.com/commjoen/generated-game-experiment",f.width/2,f.height-40),V?(n.fillStyle="#e33",n.font="bold 20px sans-serif",n.fillText("Final Score!",f.width/2,f.height-15)):A>=25&&(n.fillStyle="#0cf",n.font="bold 20px sans-serif",n.fillText("Victory! Level 25 Reached!",f.width/2,f.height-15)),n.restore(),t.toDataURL("image/png")}function K(){return V?`Just played Side-Scrolling Platformer! 🎮 Final score: ${v} points on level ${A}! Can you beat it?`:A>=25?`Victory! 🏆 Just reached level 25 in Side-Scrolling Platformer with ${v} points! Amazing game!`:`Playing Side-Scrolling Platformer! 🎮 Currently on level ${A} with ${v} points!`}function pt(){const t=document.getElementById("share-modal");t&&t.remove();const n=document.createElement("div");n.id="share-modal",n.style.cssText=`
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
  `,window.innerWidth<=768&&(n.style.padding="8px",n.style.alignItems="flex-start",n.style.paddingTop="10px");const a=document.createElement("div");a.style.cssText=`
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
  `,window.innerWidth<=768&&(a.style.maxHeight="min(90vh, 500px)",a.style.margin="2px",a.style.borderRadius="12px"),window.innerWidth<=480&&(a.style.maxHeight="95vh",a.style.margin="0px",a.style.borderRadius="8px");const r=document.createElement("div");r.style.cssText=`
    padding: 20px 32px;
    border-bottom: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  `,window.innerWidth<=768&&(r.style.padding="16px 20px"),window.innerWidth<=480&&(r.style.padding="12px 16px");const s=document.createElement("h2");s.textContent="📤 Share Your Progress",s.style.cssText="margin: 0; font-size: 1.5em; color: #0cf;",window.innerWidth<=480&&(s.style.fontSize="1.3em");const i=document.createElement("button");i.textContent="✖️",i.style.cssText=`
    background: none;
    border: none;
    color: #fff;
    font-size: 1.2em;
    cursor: pointer;
    padding: 4px;
  `,i.onclick=()=>n.remove(),r.appendChild(s),r.appendChild(i);const o=document.createElement("div");o.style.cssText=`
    padding: 24px 32px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    flex: 1;
    min-height: 0;
    scroll-behavior: smooth;
    overscroll-behavior: contain;
  `,window.innerWidth<=768&&(o.style.padding="16px 20px"),window.innerWidth<=480&&(o.style.padding="12px 16px");const c=document.createElement("div");c.style.cssText="margin-bottom: 24px;";const d=document.createElement("h3");d.textContent="Preview:",d.style.cssText="margin: 0 0 12px 0; color: #0cf; font-size: 1.2em;";const m=document.createElement("p");m.textContent=K(),m.style.cssText=`
    margin: 0 0 12px 0;
    padding: 12px;
    background: #333;
    border-radius: 8px;
    line-height: 1.4;
  `;const x=document.createElement("p");x.innerHTML='🔗 <a href="https://github.com/commjoen/generated-game-experiment" target="_blank" style="color: #0cf; text-decoration: underline;">github.com/commjoen/generated-game-experiment</a>',x.style.cssText="margin: 0 0 8px 0; font-size: 0.9em; color: #ccc;";const g=document.createElement("p");g.innerHTML="share"in navigator?'💡 <strong>Tip:</strong> Use "Share+📷" to include the screenshot automatically, or use any social media button below to open the share dialog <em>and</em> download the screenshot.':"💡 <strong>Tip:</strong> When you click any social media button below, the screenshot will be automatically downloaded and the share dialog will open. Just attach the downloaded image to your post!",g.style.cssText=`
    margin: 0;
    padding: 8px 12px;
    background: rgba(12, 255, 255, 0.1);
    border-left: 3px solid #0cf;
    border-radius: 4px;
    font-size: 0.85em;
    color: #ccc;
    line-height: 1.3;
  `,c.appendChild(d),c.appendChild(m),c.appendChild(x),c.appendChild(g);const y=document.createElement("div");y.style.cssText="margin-bottom: 16px;";const k=document.createElement("h3");k.textContent="Share to:",k.style.cssText="margin: 0 0 16px 0; color: #0cf; font-size: 1.2em;";const p=document.createElement("div");p.style.cssText=`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
  `,window.innerWidth<=480?(p.style.gridTemplateColumns="repeat(2, 1fr)",p.style.gap="8px"):window.innerWidth<=768&&(p.style.gridTemplateColumns="repeat(3, 1fr)",p.style.gap="8px"),[{name:"Twitter",icon:"🐦",color:"#1DA1F2",action:C=>Vt()},{name:"Facebook",icon:"📘",color:"#1877F2",action:C=>Kt()},{name:"LinkedIn",icon:"💼",color:"#0A66C2",action:C=>Qt()},{name:"Reddit",icon:"🔶",color:"#FF4500",action:C=>Zt()},{name:"Bluesky",icon:"☁️",color:"#0085ff",action:C=>en()},{name:"Mastodon",icon:"🐘",color:"#563acc",action:C=>tn()},..."share"in navigator?[{name:"Share+📷",icon:"📤",color:"#28a745",action:C=>nn()}]:[],{name:"Copy Text",icon:"📋",color:"#666",action:C=>Ne(C)},{name:"Download📷",icon:"💾",color:"#0cf",action:C=>me()}].forEach(C=>{const M=document.createElement("button");M.innerHTML=`<span style="font-size: 1.2em; margin-right: 4px;">${C.icon}</span>${C.name}`,M.style.cssText=`
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
    `,window.innerWidth<=480&&(M.style.fontSize="0.8em",M.style.padding="10px 6px",M.style.minHeight="40px"),M.onclick=ye=>C.action(ye),M.onmouseenter=()=>M.style.opacity="0.8",M.onmouseleave=()=>M.style.opacity="1",p.appendChild(M)}),y.appendChild(k),y.appendChild(p),o.appendChild(c),o.appendChild(y),a.appendChild(r),a.appendChild(o),n.appendChild(a),document.body.appendChild(n),n.onclick=C=>{C.target===n&&n.remove()}}function Vt(){me();const t=encodeURIComponent(K()),n=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),a=encodeURIComponent("indiegaming,webgames,platformer,javascript");window.open(`https://twitter.com/intent/tweet?text=${t}&url=${n}&hashtags=${a}`,"_blank","width=550,height=420")}function Kt(){me();const t=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),n=encodeURIComponent(K());window.open(`https://www.facebook.com/sharer/sharer.php?u=${t}&quote=${n}`,"_blank","width=580,height=400")}function Qt(){me();const t=encodeURIComponent(K()),n=encodeURIComponent("https://github.com/commjoen/generated-game-experiment"),a=encodeURIComponent(V?"My final score in Side-Scrolling Platformer!":"Check out my progress in Side-Scrolling Platformer!");window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${n}&title=${a}&summary=${t}`,"_blank","width=570,height=570")}function Zt(){me();const t=encodeURIComponent(V?"My final score in Side-Scrolling Platformer!":"Reached level 25 in this amazing browser game!"),n=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://www.reddit.com/submit?title=${t}&text=${n}`,"_blank","width=600,height=500")}function en(){me();const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`);window.open(`https://bsky.app/intent/compose?text=${t}`,"_blank","width=600,height=500")}function tn(){me();const t=encodeURIComponent(K()+`

Play at: https://github.com/commjoen/generated-game-experiment`),n=document.createElement("div");n.style.cssText=`
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
  `,n.innerHTML=`
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
  `,document.body.appendChild(n);const a=document.getElementById("mastodon-instance"),r=document.getElementById("mastodon-share-btn");r&&a&&(r.onclick=()=>{let s=a.value.trim();s||(s="mastodon.social"),s=s.replace(/^https?:\/\//,""),window.open(`https://${s}/share?text=${t}`,"_blank","width=600,height=500"),n.remove()},a.addEventListener("keypress",s=>{s.key==="Enter"&&r.click()})),n.onclick=s=>{s.target===n&&n.remove()}}async function nn(){if(navigator.share)try{const t=gt(),a=await(await fetch(t)).blob(),r=new File([a],`platformer-level-${A}-score-${v}.png`,{type:"image/png"});await navigator.share({title:V?"My Side-Scrolling Platformer Score!":"Victory in Side-Scrolling Platformer!",text:K(),url:"https://github.com/commjoen/generated-game-experiment",files:[r]})}catch(t){console.error("Web Share API failed:",t),await Ne()}else await Ne()}async function Ne(t){const n=K()+`

Play at: https://github.com/commjoen/generated-game-experiment

📎 Tip: The screenshot was automatically downloaded when you clicked any social media button above!`;try{await navigator.clipboard.writeText(n);const a=t?.target;if(a){const r=a.innerHTML;a.innerHTML='<span style="font-size: 1.2em; margin-right: 4px;">✅</span>Copied!',a.style.background="#28a745",setTimeout(()=>{a.innerHTML=r,a.style.background="#666"},2e3)}}catch(a){console.error("Failed to copy to clipboard:",a);const r=document.createElement("div");r.style.cssText=`
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
      <textarea readonly style="width: 300px; height: 80px; background: #333; color: #fff; border: 1px solid #666; padding: 8px;">${n}</textarea>
      <br><button onclick="this.parentElement.remove()" style="margin-top: 8px; padding: 8px 16px; background: #0cf; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Close</button>
    `,document.body.appendChild(r),r.querySelector("textarea").select()}}function me(){const t=gt(),n=document.createElement("a");n.download=`platformer-game-level-${A}-score-${v}.png`,n.href=t,n.click()}function on(){ce(v+500),pe(v);const t=document.createElement("div");t.id="victory-modal",t.style.cssText=`
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
  `;const n=document.createElement("div");n.style.cssText=`
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
  `,n.innerHTML=`
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
  `,t.appendChild(n),document.body.appendChild(t);const a=document.getElementById("victory-share-btn"),r=document.getElementById("victory-continue-btn"),s=document.getElementById("victory-restart-btn");a&&(a.onclick=()=>{pt()},a.onmouseenter=()=>a.style.background="#0a9fd9",a.onmouseleave=()=>a.style.background="#0cf"),r&&(r.onclick=()=>{t.remove(),A=25,(async()=>(await We(),ze(),Ce(),he=!1,ve=0))()},r.onmouseenter=()=>r.style.background="#218838",r.onmouseleave=()=>r.style.background="#28a745"),s&&(s.onclick=()=>{t.remove(),Fe()},s.onmouseenter=()=>{s.style.background="#0cf",s.style.color="#222"},s.onmouseleave=()=>{s.style.background="#222",s.style.color="#fff"}),Ce()}function ln(){if(u.length=0,F.length=0,b.length=0,q.length=0,O.length=0,J.length=0,re.length=0,A++,A>=25){on();return}let t=!1;if(oe?T=ie:A===1?T="horizontal":A%5===0?(Cn(),t=!0):A%3===0?T="vertical":T="horizontal",t){Ce(),he=!1,ve=0;return}localStorage.setItem("levelType",T),G&&G instanceof HTMLInputElement&&(G.checked=oe&&ie==="vertical"),We(),ze(),ee?(Se=Te(),localStorage.setItem("fixedGradientColors",JSON.stringify(Se))):te?(Ee=Te(),localStorage.setItem("scrollGradientColors",JSON.stringify(Ee))):H&&mt(),Ce(),he=!1,ve=0}function nt(){Ce(),he=!0,ve=120}function an(t){if(V)return;if(he){ve--,ve<=0&&ln();return}if(Z>0){Z--;return}Yt(),l.vx=0;const n=Oe*(ae("speed_boost")?1.5:1);(w.ArrowLeft||w.KeyA)&&(l.vx=-Ke*n*t*60),(w.ArrowRight||w.KeyD)&&(l.vx=Ke*n*t*60);const a=w.ArrowUp||w.Space||w.KeyW;ke>0&&ke--,a&&ke===0&&(l.onGround?(l.vy=-Ge,l.onGround=!1,l.hasDoubleJump&&(l.canDoubleJump=!0),ke=8):l.hasDoubleJump&&l.canDoubleJump&&(l.vy=-Ge,l.canDoubleJump=!1,ke=8));const r=w.KeyT;r&&!ot&&(X=!X,localStorage.setItem("speedUnlocked",String(X)),Oe=X?2:1),ot=r;const s=w.KeyE;if(s&&!it){if(l.eatenEnemy&&h.type==="none")Gt();else if(h.type==="none"){const i=Wt();i?(Jt(i),z?ce(1):(v++,ce(1),pe(v))):Ht()}}it=s,l.vy+=Tt*t*60,l.x+=l.vx,l.y+=l.vy,l.onGround=!1;for(const i of u)if("isSlope"in i&&i.isSlope){if(l.x+l.width>i.x&&l.x<i.x+i.width){const o=(l.x+l.width/2-i.x)/i.width,c=i.y+(i.endY-i.y)*o;l.y+l.height>c&&l.y+l.height<c+i.height&&l.vy>=0&&(l.y=c-l.height,l.vy=0,l.onGround=!0,l.canDoubleJump=l.hasDoubleJump)}}else l.y+l.height>i.y&&l.y+l.height<i.y+i.height&&l.x+l.width>i.x&&l.x<i.x+i.width&&l.vy>=0&&(l.y=i.y-l.height,l.vy=0,l.onGround=!0,l.canDoubleJump=l.hasDoubleJump);for(const i of F)Re(l,i)&&(l.y+l.height-l.vy<=i.y?(l.y=i.y-l.height,l.vy=0,l.onGround=!0):l.x+l.width-l.vx<=i.x?l.x=i.x-l.width:l.x-l.vx>=i.x+i.width?l.x=i.x+i.width:l.y-l.vy>=i.y+i.height&&(l.y=i.y+i.height,l.vy=0));for(const i of O)i.x+=i.dx,(i.x>i.startX+i.range||i.x<i.startX)&&(i.dx*=-1);for(const i of re)if(!i.hasSpawnedEnemy){let o=!1;if(T==="horizontal"?o=i.x+i.width>E&&i.x<E+f.width:o=i.y+i.height>B&&i.y<B+f.height,o){const c=u.find(d=>d.x<=i.x+i.width/2&&d.x+d.width>=i.x+i.width/2&&Math.abs(d.y-L)<10);if(c){const d=Math.random()<.5?"square":"circle";J.push({x:i.x+i.width/2-15,y:i.y+10,width:30,height:30,dx:1+Math.random()*2,dy:-8,range:Math.min(c.width-80,120),startX:i.x+i.width/2-15,alive:!0,id:Mt(),isJumpingOut:!0,type:d}),i.hasSpawnedEnemy=!0}}}for(const i of J)if(i.alive)if(i.isJumpingOut){i.y+=i.dy,i.dy+=.5;for(const o of u)if(i.y+i.height>=o.y&&i.y+i.height<=o.y+o.height&&i.x+i.width>o.x&&i.x<o.x+o.width&&Math.abs(o.y-L)<10){i.y=o.y-i.height,i.dy=0,i.isJumpingOut=!1;break}}else i.x+=i.dx,(i.x>i.startX+i.range||i.x<i.startX)&&(i.dx*=-1);for(const i of O)l.y+l.height>i.y&&l.y+l.height<i.y+i.height&&l.x+l.width>i.x&&l.x<i.x+i.width&&l.vy>=0&&(l.y=i.y-l.height,l.vy=0,l.onGround=!0,l.x+=i.dx);for(const i of b)if(!i.collected&&Re(l,i)){if(i.type==="doublejump"&&l.hasDoubleJump||i.type==="grow"&&l.growLevel>=3)continue;if(i.collected=!0,z&&D.collectItem(i.id),i.type==="coin"){const o=ae("lucky_coins")?2:1;z?ce(o):(v+=o,ce(o),pe(v))}else i.type==="heart"?U<5&&U++:i.type==="doublejump"?(l.hasDoubleJump=!0,l.canDoubleJump=!1):i.type==="grow"&&(l.growLevel<3&&l.growLevel++,be())}for(const i of q)if(Re(l,i)){De();break}for(const i of J)if(i.alive&&!(Z>0||h.targetEnemy===i)&&Re(l,i)){if(i.type==="square")if(l.vy>0&&l.y<i.y)i.alive=!1,l.vy=-8,z?ce(1):(v++,ce(1),pe(v));else{l.growLevel>0?(l.growLevel=0,be(),Z=30):De();break}else if(i.type==="circle"){W==="🔴"?un(i.x+i.width/2,i.y+i.height/2):l.growLevel>0?(l.growLevel=0,be(),Z=30):De();break}}if(T==="horizontal"&&l.y>f.height+100&&De(),T==="horizontal"?l.x+l.width>=$t&&!he&&nt():T==="vertical"&&!he&&l.x+l.width>S.x&&l.x<S.x+S.width&&l.y+l.height>S.y&&l.y<S.y+S.height&&nt(),T==="vertical"?(B=l.y-f.height/2+l.height/2,B=Math.max(0,Math.min(B,$-f.height)),E=0):(E=l.x-f.width/2+l.width/2,E=Math.max(0,Math.min(E,de-f.width)),B=0),T==="vertical"){const i=Math.max(...u.map(c=>c.width)),o=Math.max(f.width,i);f.width/o,l.x=Math.max(0,Math.min(l.x,o-l.width))}else l.x<0&&(l.x=0),l.x+l.width>de&&(l.x=de-l.width);z&&Date.now()-et>50&&(D.updatePlayerPosition(l.x,l.y,l.width,l.height,l.growLevel),et=Date.now())}function rn(){return/Tesla|QtCarBrowser/i.test(navigator.userAgent)}let Ue=localStorage.getItem("teslaMode")==="true";function sn(){return rn()||Ue||/Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)}let ee=localStorage.getItem("fixedGradient")==="true",te=localStorage.getItem("scrollGradient")==="true",Se=JSON.parse(localStorage.getItem("fixedGradientColors")||"null")||Te(),Ee=JSON.parse(localStorage.getItem("scrollGradientColors")||"null")||Te(),H=localStorage.getItem("imageBg")==="true",le=localStorage.getItem("imageBgUrl")||null,ne=null,Be=!1;function mt(){fetch("https://pixabay.com/api/?key=51252753-0f1aa9c83b326091b3ad96f88&q=landscape&image_type=photo&orientation=horizontal&safesearch=true&per_page=50").then(a=>a.json()).then(a=>{if(a.hits&&a.hits.length>0){const r=Math.floor(Math.random()*a.hits.length);le=a.hits[r].largeImageURL,le&&(localStorage.setItem("imageBgUrl",le),yt())}}).catch(()=>{le=null,Be=!1})}function yt(){le&&(ne=new window.Image,ne.crossOrigin="anonymous",ne.onload=()=>{Be=!0},ne.onerror=()=>{Be=!1},ne.src=le)}le&&yt();function Te(){function t(){return`hsl(${Math.floor(Math.random()*360)}, 70%, 75%)`}return[t(),t()]}function Je(){localStorage.setItem("fixedGradient",String(ee)),localStorage.setItem("scrollGradient",String(te)),localStorage.setItem("imageBg",String(H)),localStorage.setItem("fixedGradientColors",JSON.stringify(Se)),localStorage.setItem("scrollGradientColors",JSON.stringify(Ee)),H||(localStorage.removeItem("imageBgUrl"),le=null,ne=null,Be=!1)}const cn="v0.6.0-4-g4e847e1",dn="4e847e1",hn="HEAD",fn="v0.6.0",gn="2025-09-16T13:19:30.453Z";window.addEventListener("DOMContentLoaded",()=>{const t=document.getElementById("settings-btn"),n=document.getElementById("settings-modal"),a=document.getElementById("close-settings"),r=document.getElementById("fixed-gradient-toggle"),s=document.getElementById("scroll-gradient-toggle"),i=document.getElementById("image-bg-toggle"),o=document.getElementById("speed-unlock-toggle"),c=document.getElementById("fps-counter-toggle"),d=document.getElementById("tesla-mode-toggle"),m=document.getElementById("multiplayer-toggle");_=document.getElementById("player-name-input"),G=document.getElementById("level-type-toggle"),t&&n&&a&&r&&s&&i&&o&&c&&d&&m&&_&&G&&(t.addEventListener("click",()=>{n.style.display="flex";const I=document.getElementById("github-star-btn");I&&(I.style.display="none"),r.checked=ee,s.checked=te,i.checked=H,o.checked=X,c.checked=_e,d.checked=Ue,m.checked=z,_&&(_.value=R),G&&(G.checked=oe&&ie==="vertical")}),a.addEventListener("click",()=>{n.style.display="none";const I=document.getElementById("github-star-btn");I&&(I.style.display="flex")}),r.addEventListener("change",()=>{r.checked?(ee=!0,te=!1,H=!1,s.checked=!1,i.checked=!1,Se=Te()):ee=!1,Je()}),s.addEventListener("change",()=>{s.checked?(te=!0,ee=!1,H=!1,r.checked=!1,i.checked=!1,Ee=Te()):te=!1,Je()}),i.addEventListener("change",()=>{i.checked?(H=!0,ee=!1,te=!1,r.checked=!1,s.checked=!1,mt()):H=!1,Je()}),o.addEventListener("change",()=>{X=o.checked,localStorage.setItem("speedUnlocked",String(X)),Oe=X?2:1}),c.addEventListener("change",()=>{_e=c.checked,localStorage.setItem("showFpsCounter",String(_e))}),d.addEventListener("change",()=>{Ue=d.checked,localStorage.setItem("teslaMode",String(Ue)),qe()}),m.addEventListener("change",()=>{z=m.checked,localStorage.setItem("multiplayerEnabled",String(z)),window.location.reload()}),G.addEventListener("change",()=>{oe=G.checked,oe?(ie="vertical",T="vertical"):(ie="horizontal",T="horizontal"),localStorage.setItem("manualLevelType",String(oe)),localStorage.setItem("manualLevelTypeValue",ie),localStorage.setItem("levelType",T),Fe()}),_&&_.addEventListener("input",()=>{R=_.value.slice(0,12),localStorage.setItem("playerName",R)}));const x=document.getElementById("shop-btn"),g=document.getElementById("shop-modal"),y=document.getElementById("close-shop");x&&g&&y&&(x.addEventListener("click",()=>{Rt()}),y.addEventListener("click",()=>{g.style.display="none";const I=document.getElementById("github-star-btn");I&&(I.style.display="flex")}));const k=document.getElementById("scanner-btn"),p=document.getElementById("scanner-modal"),P=document.getElementById("close-scanner"),C=document.getElementById("scan-btn"),M=document.getElementById("barcode-input"),ye=document.getElementById("clear-cart-btn");k&&p&&P&&(k.addEventListener("click",()=>{jt()}),P.addEventListener("click",()=>{p.style.display="none";const I=document.getElementById("github-star-btn");I&&(I.style.display="flex")})),C&&M&&(C.addEventListener("click",()=>{const I=M.value.trim();I&&Ye(I)}),M.addEventListener("keypress",I=>{if(I.key==="Enter"){const Q=M.value.trim();Q&&Ye(Q)}}),M.addEventListener("input",I=>{const Q=I.target;Q.value=Q.value.replace(/\D/g,"")})),ye&&ye.addEventListener("click",()=>{st()}),document.addEventListener("click",I=>{const Q=I.target;if(Q.classList.contains("quick-scan")){const Ve=Q.getAttribute("data-barcode");Ve&&ct(Ve)}}),Dt();const Ae=document.querySelector(".version-string, #version, .version, #version-string");Ae&&(Ae.textContent=`Version: ${cn} (tag: ${fn}, ${hn}, ${dn}, built: ${gn})`),qe()});function qe(){const t=document.getElementById("onscreen-controls"),n=document.getElementById("desktop-copyright"),a=sn();t&&(t.style.display=a?"flex":"none"),n&&(n.style.display=a?"none":"block")}function pn(){const t=document.getElementById("btn-left"),n=document.getElementById("btn-right"),a=document.getElementById("btn-jump"),r=document.getElementById("btn-action");t&&n&&a&&r&&(t.addEventListener("touchstart",s=>{s.preventDefault(),w.ArrowLeft=!0},{passive:!1}),t.addEventListener("touchend",s=>{s.preventDefault(),w.ArrowLeft=!1},{passive:!1}),n.addEventListener("touchstart",s=>{s.preventDefault(),w.ArrowRight=!0},{passive:!1}),n.addEventListener("touchend",s=>{s.preventDefault(),w.ArrowRight=!1},{passive:!1}),a.addEventListener("touchstart",s=>{s.preventDefault(),w.Space=!0},{passive:!1}),a.addEventListener("touchend",s=>{s.preventDefault(),w.Space=!1},{passive:!1}),t.addEventListener("mousedown",s=>{s.preventDefault(),w.ArrowLeft=!0}),t.addEventListener("mouseup",s=>{s.preventDefault(),w.ArrowLeft=!1}),n.addEventListener("mousedown",s=>{s.preventDefault(),w.ArrowRight=!0}),n.addEventListener("mouseup",s=>{s.preventDefault(),w.ArrowRight=!1}),a.addEventListener("mousedown",s=>{s.preventDefault(),w.Space=!0}),a.addEventListener("mouseup",s=>{s.preventDefault(),w.Space=!1}),r.addEventListener("touchstart",s=>{s.preventDefault(),w.KeyE=!0},{passive:!1}),r.addEventListener("touchend",s=>{s.preventDefault(),w.KeyE=!1},{passive:!1}),r.addEventListener("mousedown",s=>{s.preventDefault(),w.KeyE=!0}),r.addEventListener("mouseup",s=>{s.preventDefault(),w.KeyE=!1}))}pn();qe();let we=[],Xe=0;function Ce(){we=[];for(let t=0;t<60;t++){const n=Math.random()*Math.PI*2,a=4+Math.random()*3;we.push({x:f.width/2+(Math.random()-.5)*100,y:f.height/2-80+(Math.random()-.5)*40,vx:Math.cos(n)*a,vy:Math.sin(n)*a-2,color:`hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`,size:8+Math.random()*8,life:60+Math.random()*40,angle:Math.random()*Math.PI*2,spin:(Math.random()-.5)*.2})}Xe=60}function mn(){for(const t of we)t.x+=t.vx,t.y+=t.vy,t.vy+=.15,t.angle+=t.spin,t.life--;we=we.filter(t=>t.life>0&&t.y<f.height+40),Xe>0&&Xe--}function yn(){for(const t of we)e.save(),e.translate(t.x,t.y),e.rotate(t.angle),e.fillStyle=t.color,e.fillRect(-t.size/2,-t.size/6,t.size,t.size/3),e.restore()}let Le=[];function un(t,n){for(let a=0;a<3;a++)Le.push({x:t+(Math.random()-.5)*40,y:n+(Math.random()-.5)*20,vx:(Math.random()-.5)*2,vy:-2-Math.random()*2,life:90+Math.random()*30,maxLife:120,size:20+Math.random()*10})}function xn(){for(const t of Le)t.x+=t.vx,t.y+=t.vy,t.vy+=.02,t.life--;Le=Le.filter(t=>t.life>0)}function bn(){for(const t of Le){const n=t.life/t.maxLife;e.save(),e.globalAlpha=n,e.translate(t.x-E,t.y-B),e.scale(t.size/20,t.size/20),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#ff1493",e.fill(),e.fillStyle="rgba(255, 255, 255, 0.5)",e.beginPath(),e.moveTo(-5,3),e.bezierCurveTo(-5,0,-8,0,-8,3),e.bezierCurveTo(-8,6,-5,8,-5,10),e.bezierCurveTo(-5,8,-2,6,-2,3),e.bezierCurveTo(-2,0,-5,0,-5,3),e.closePath(),e.fill(),e.restore()}}function ue(t,n,a,r,s,i=8){e.fillStyle=s,e.fillRect(t,n,a,r);const o=vn(s,.3);e.fillStyle=o,e.beginPath(),e.moveTo(t+a,n),e.lineTo(t+a+i,n-i),e.lineTo(t+a+i,n+r-i),e.lineTo(t+a,n+r),e.closePath(),e.fill();const c=Sn(s,.2);e.fillStyle=c,e.beginPath(),e.moveTo(t,n),e.lineTo(t+i,n-i),e.lineTo(t+a+i,n-i),e.lineTo(t+a,n),e.closePath(),e.fill()}function je(t,n,a,r,s=3,i=3){e.save(),e.fillStyle="rgba(0, 0, 0, 0.2)",e.fillRect(t+s,n+i,a,r),e.restore()}function wn(t,n,a,r,s,i=3,o=3){e.save(),e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.moveTo(t+i,n+o),e.lineTo(t+a+i,s+o),e.lineTo(t+a+i,s+r+o),e.lineTo(t+i,n+r+o),e.closePath(),e.fill(),e.restore()}function vn(t,n){if(t.startsWith("#")){const a=t.slice(1),r=parseInt(a.substr(0,2),16),s=parseInt(a.substr(2,2),16),i=parseInt(a.substr(4,2),16);return`rgb(${Math.floor(r*(1-n))}, ${Math.floor(s*(1-n))}, ${Math.floor(i*(1-n))})`}return t}function Sn(t,n){if(t.startsWith("#")){const a=t.slice(1),r=parseInt(a.substr(0,2),16),s=parseInt(a.substr(2,2),16),i=parseInt(a.substr(4,2),16);return`rgb(${Math.floor(r+(255-r)*n)}, ${Math.floor(s+(255-s)*n)}, ${Math.floor(i+(255-i)*n)})`}return t}function En(t,n,a){e.save(),e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(t+2,n+3,a*.8,a*.3,0,0,2*Math.PI),e.fill(),e.restore();const r=e.createRadialGradient(t-a*.3,n-a*.3,0,t,n,a);r.addColorStop(0,"#4df"),r.addColorStop(.7,"#0cf"),r.addColorStop(1,"#0af"),e.fillStyle=r,e.beginPath(),e.arc(t,n,a,0,2*Math.PI),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.6)",e.beginPath(),e.arc(t-a*.3,n-a*.3,a*.3,0,2*Math.PI),e.fill()}function Tn(){if(H&&Be&&ne){const o=ne,c=Math.max(f.width/o.width,f.height/o.height),d=o.width*c,m=o.height*c;let x=-E%d;x>0&&(x-=d);for(let g=x;g<f.width;g+=d)e.drawImage(o,g,0,d,m)}else if(ee){const o=e.createLinearGradient(0,0,0,f.height);o.addColorStop(0,Se[0]),o.addColorStop(1,Se[1]),e.fillStyle=o,e.fillRect(0,0,f.width,f.height)}else if(te){const o=e.createLinearGradient(-E,0,de-E,f.height);o.addColorStop(0,Ee[0]),o.addColorStop(1,Ee[1]),e.fillStyle=o,e.fillRect(0,0,f.width,f.height)}else e.fillStyle="#87ceeb",e.fillRect(0,0,f.width,f.height);e.save();let t=1;if(T==="vertical"){const o=Math.max(...u.map(d=>d.width)),c=Math.max(f.width,o);t=f.width/c,E=Math.max(0,Math.min(l.x+l.width/2-f.width/(2*t),c-f.width/t)),B=Math.max(0,Math.min(l.y+l.height/2-f.height/(2*t),$-f.height/t)),e.scale(t,t)}e.translate(-E,-B);let n=-1;if(T==="vertical"&&u.length>0){let o=-1/0;for(let c=0;c<u.length;c++)u[c].y>o&&(o=u[c].y,n=c)}for(let o=0;o<u.length;o++){const c=u[o];if("isSlope"in c&&c.isSlope){wn(c.x,c.y,c.width,c.height,c.endY);const d=e.createLinearGradient(c.x,c.y,c.x,c.y+c.height);d.addColorStop(0,"#8b6f47"),d.addColorStop(1,"#654321"),e.fillStyle=d,e.beginPath(),e.moveTo(c.x,c.y),e.lineTo(c.x+c.width,c.endY),e.lineTo(c.x+c.width,c.endY+c.height),e.lineTo(c.x,c.y+c.height),e.closePath(),e.fill()}else je(c.x,c.y,c.width,c.height),ue(c.x,c.y,c.width,c.height,"#654321",6);T==="vertical"&&o===n&&(e.save(),e.font="bold 48px sans-serif",e.fillStyle="#fff",e.textAlign="center",e.textBaseline="middle",e.globalAlpha=.85,e.shadowColor="rgba(0, 0, 0, 0.5)",e.shadowOffsetX=2,e.shadowOffsetY=2,e.shadowBlur=4,e.fillText("↑",c.x+c.width/2,c.y+c.height/2),e.globalAlpha=1,e.shadowColor="transparent",e.shadowOffsetX=0,e.shadowOffsetY=0,e.shadowBlur=0,e.restore())}for(const o of O)je(o.x,o.y,o.width,o.height),ue(o.x,o.y,o.width,o.height,"#888",4);for(const o of F)je(o.x,o.y,o.width,o.height),ue(o.x,o.y,o.width,o.height,"#b5651d",5);for(const o of b)o.collected||(o.type==="coin"?En(o.x+o.width/2,o.y+o.height/2,10):o.type==="heart"?(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()):o.type==="doublejump"?(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore()):o.type==="grow"&&(e.save(),e.translate(o.x+o.width/2,o.y+o.height/2),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore()));for(const o of q){e.save(),e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.moveTo(o.x+2,o.y+o.height+2),e.lineTo(o.x+o.width/2+2,o.y+2),e.lineTo(o.x+o.width+2,o.y+o.height+2),e.closePath(),e.fill(),e.restore();const c=e.createLinearGradient(o.x,o.y,o.x+o.width,o.y+o.height);c.addColorStop(0,"#f55"),c.addColorStop(.5,"#e33"),c.addColorStop(1,"#c22"),e.fillStyle=c,e.beginPath(),e.moveTo(o.x,o.y+o.height),e.lineTo(o.x+o.width/2,o.y),e.lineTo(o.x+o.width,o.y+o.height),e.closePath(),e.fill(),e.strokeStyle="#f77",e.lineWidth=1,e.beginPath(),e.moveTo(o.x+o.width/2,o.y),e.lineTo(o.x+o.width/4,o.y+o.height/2),e.stroke()}for(const o of re){je(o.x,o.y,o.width,o.height),ue(o.x,o.y,o.width,o.height,"#0a8000",3);const c=e.createRadialGradient(o.x+o.width/2,Math.max(o.y,L-15)+7,0,o.x+o.width/2,Math.max(o.y,L-15)+7,o.width/2);c.addColorStop(0,"#064000"),c.addColorStop(1,"#032000"),e.fillStyle=c;const d=Math.max(o.y,L-15);e.fillRect(o.x+4,d,o.width-8,15),e.fillStyle="#0c8000",e.fillRect(o.x+8,o.y+8,3,o.height-16),e.fillRect(o.x+o.width-11,o.y+8,3,o.height-16);const m=e.createLinearGradient(o.x,0,o.x+o.width,0);m.addColorStop(0,"#0c8000"),m.addColorStop(.5,"#0e9000"),m.addColorStop(1,"#0c8000"),e.fillStyle=m,e.fillRect(o.x+4,o.y+o.height/4,o.width-8,2),e.fillRect(o.x+4,o.y+o.height/2,o.width-8,2),e.fillRect(o.x+4,o.y+3*o.height/4,o.width-8,2)}for(const o of J)if(o.alive&&h.targetEnemy!==o)if(e.save(),e.fillStyle="rgba(0, 0, 0, 0.2)",e.beginPath(),e.ellipse(o.x+o.width/2+2,o.y+o.height+2,o.width*.4,o.height*.2,0,0,2*Math.PI),e.fill(),e.restore(),o.type==="circle"){const c=e.createRadialGradient(o.x+o.width/2-o.width*.2,o.y+o.height/2-o.height*.2,0,o.x+o.width/2,o.y+o.height/2,o.width/2);c.addColorStop(0,"#f8a"),c.addColorStop(.7,"#f06"),c.addColorStop(1,"#d04"),e.fillStyle=c,e.beginPath(),e.arc(o.x+o.width/2,o.y+o.height/2,o.width/2,0,2*Math.PI),e.fill(),e.fillStyle="rgba(255, 255, 255, 0.4)",e.beginPath(),e.arc(o.x+o.width/2-o.width*.25,o.y+o.height/2-o.height*.25,o.width*.15,0,2*Math.PI),e.fill(),e.fillStyle="#000";const d=3;e.fillRect(o.x+8,o.y+8,d,d),e.fillRect(o.x+o.width-11,o.y+8,d,d)}else{ue(o.x,o.y,o.width,o.height,"#f90",3),e.fillStyle="#000";const c=4;e.fillRect(o.x+6,o.y+8,c,c),e.fillRect(o.x+o.width-10,o.y+8,c,c)}if(Nt(),e.restore(),Z>0&&Math.floor(Z/5)%2===0?e.globalAlpha=.3:e.globalAlpha=1,e.save(),e.save(),e.fillStyle="rgba(0, 0, 0, 0.3)",e.fillRect(l.x-E+3,l.y-B+l.height-2,l.width,8),e.restore(),W==="SQUARE")ue(l.x-E,l.y-B,l.width,l.height,"#ff0",4);else if(e.font=`${Math.min(l.width,l.height)}px serif`,e.textAlign="center",["🟡","🔴","🔵","🟢"].includes(W)){const c=Math.round(l.height*.4);e.textBaseline="middle",e.fillText(W,l.x-E+l.width/2,l.y-B+l.height-c)}else e.textBaseline="middle",e.fillText(W,l.x-E+l.width/2,l.y-B+l.height/2);e.restore(),e.globalAlpha=1,e.save(),e.fillStyle="#0cf";let a=v,r=[];for(const o of j.values())typeof o.score=="number"&&o.score>a?(a=o.score,r=[o.id]):typeof o.score=="number"&&o.score===a&&r.push(o.id);v===a&&r.push("self");for(const o of j.values())e.fillRect(o.x-E,o.y-B,o.width,o.height),z&&j.size>0&&o.name&&(e.save(),e.font="16px sans-serif",r.includes(o.id)?(e.fillStyle="gold",e.fillText("👑",o.x-E+o.width/2,o.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(o.name,o.x-E+o.width/2,o.y-8),e.restore());e.restore(),z&&j.size>0&&(e.save(),e.font="16px sans-serif",r.includes("self")?(e.fillStyle="gold",e.fillText("👑",l.x-E+l.width/2,l.y-22)):e.fillStyle="#fff",e.textAlign="center",e.fillText(R||"Player",l.x-E+l.width/2,l.y-8),e.restore()),e.save(),e.fillStyle="#fff",e.font="20px sans-serif",e.textAlign="left",e.fillText(`Score: ${v}`,20,30),e.fillText(`Top Score: ${Pe}`,20,60),e.fillText(`Level: ${A}`,20,90),e.fillStyle="#ffd700",e.fillText(`Total Points: ${N}`,20,120),e.fillStyle="#fff";let s=150;if(_e&&(e.fillText(`FPS: ${lt}`,20,s),s+=30),X&&(e.fillStyle="#0cf",e.fillText(`Speed: ${Oe}x`,20,s),e.fillStyle="#fff"),z&&j.size>0){const o=new Map;o.set(D.currentPlayerId,{id:D.currentPlayerId,name:R||"Player",score:v,isSelf:!0});for(const d of j.values())d.id!==D.currentPlayerId&&o.set(d.id,{id:d.id,name:d.name||"Player",score:typeof d.score=="number"?d.score:0,isSelf:!1});const c=Array.from(o.values());c.sort((d,m)=>m.score-d.score),e.save(),e.globalAlpha=.85,e.fillStyle="#222",e.fillRect(f.width-240,20,220,36+32*Math.min(5,c.length)),e.globalAlpha=1,e.font="18px sans-serif",e.fillStyle="#fff",e.textAlign="left",e.fillText("Leaderboard",f.width-225,44);for(let d=0;d<Math.min(5,c.length);d++){const m=c[d];e.font=m.isSelf?"bold 18px sans-serif":"18px sans-serif",e.fillStyle=m.isSelf?"#0cf":d===0?"gold":"#fff";const x=d===0?"👑 ":"";e.fillText(`${x}${m.name.slice(0,12)}`,f.width-225,76+d*32),e.textAlign="right",e.fillText(String(m.score),f.width-30,76+d*32),e.textAlign="left"}e.restore()}for(let o=0;o<U;o++)e.save(),e.translate(20+o*28,120),e.scale(1.2,1.2),e.beginPath(),e.moveTo(0,6),e.bezierCurveTo(0,0,-10,0,-10,6),e.bezierCurveTo(-10,12,0,16,0,20),e.bezierCurveTo(0,16,10,12,10,6),e.bezierCurveTo(10,0,0,0,0,6),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore();let i=20+U*28+20;l.hasDoubleJump&&(e.save(),e.translate(i,120),e.rotate(-.3),e.beginPath(),e.moveTo(0,0),e.quadraticCurveTo(10,-10,0,-20),e.quadraticCurveTo(-8,-10,0,0),e.closePath(),e.fillStyle="#fff",e.fill(),e.strokeStyle="#0cf",e.lineWidth=2,e.stroke(),e.restore(),i+=36);for(let o=0;o<l.growLevel;o++)e.save(),e.translate(i,120),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.lineTo(10,10),e.arc(0,10,10,0,Math.PI,!0),e.closePath(),e.fillStyle="#fff",e.fill(),e.beginPath(),e.arc(0,0,10,Math.PI,2*Math.PI),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),i+=36;l.eatenEnemy&&(e.save(),e.translate(i,120),l.eatenEnemy.type==="circle"&&(e.fillStyle="#f06",e.beginPath(),e.arc(0,0,10,0,2*Math.PI),e.fill(),e.strokeStyle="#fff",e.lineWidth=2,e.stroke()),e.restore(),i+=36),e.restore(),V?(e.save(),e.fillStyle="rgba(0, 0, 0, 0.7)",e.fillRect(f.width/2-200,f.height/2-100,400,200),e.strokeStyle="#444",e.lineWidth=2,e.strokeRect(f.width/2-200,f.height/2-100,400,200),e.font="bold 48px sans-serif",e.fillStyle="#e33",e.textAlign="center",e.fillText("Game Over",f.width/2,f.height/2-60),e.font="32px sans-serif",e.fillStyle="#fff",e.fillText(`Score: ${v}`,f.width/2,f.height/2-10),e.fillText(`Top Score: ${Pe}`,f.width/2,f.height/2+40),v>Number(localStorage.getItem("topScore")||"0")&&(e.font="bold 28px sans-serif",e.fillStyle="#0cf",e.fillText("You beat your own top score!",f.width/2,f.height/2+90),Xe===0&&Ce()),e.restore(),ht()):(Ft(),ft()),e.save(),e.translate(-E,-B),e.fillStyle="#fff",e.fillRect(S.x,S.y,8,S.height),e.beginPath(),e.moveTo(S.x+8,S.y),e.lineTo(S.x+8+32,S.y+16),e.lineTo(S.x+8,S.y+32),e.closePath(),e.fillStyle="#e33",e.fill(),e.restore(),yn(),bn()}function ut(){const t=performance.now(),n=t-Qe;Tn(),n>=1e3/Ct&&(Ze++,Ze%60===0&&(lt=Math.round(1e3/(n/60))),an(n/1e3),mn(),xn(),Qe=t),requestAnimationFrame(ut)}const w={};let ot=!1,it=!1,ke=0;window.addEventListener("keydown",t=>{w[t.code]=!0});window.addEventListener("keyup",t=>{w[t.code]=!1});z?(async()=>{try{await D.initialize()?(console.log("Multiplayer enabled!"),D.onGameStateUpdate(n=>{j.clear(),n.players.forEach(a=>{a.id!==D.currentPlayerId?j.set(a.id,a):(a.name&&a.name!==R&&(R=a.name,localStorage.setItem("playerName",R),_&&(_.value=R)),typeof a.score=="number"&&(v=a.score,pe(v)))})}),D.onPlayerJoined(n=>{console.log(`Player ${n} joined the game!`)}),D.onPlayerLeft(n=>{console.log(`Player ${n} left the game`),j.delete(n)}),D.onPlayerUpdate((n,a,r,s)=>{if(j.has(n)){const i=j.get(n);Object.assign(i,a),typeof r=="number"&&(i.score=r),typeof s=="string"&&(i.name=s)}else j.set(n,{id:n,...a,score:r,name:s});n===D.currentPlayerId&&(typeof r=="number"&&(v=r,pe(v)),typeof s=="string"&&s!==R&&(R=s,localStorage.setItem("playerName",R),_&&(_.value=R)))})):console.log("Running in single-player mode")}catch{console.log("Multiplayer initialization failed, continuing in single-player mode")}})():console.log("Running in single-player mode");ut();function Cn(){u.length=0,F.length=0,b.length=0,q.length=0,O.length=0,J.length=0,re.length=0,u.push({x:0,y:$,width:f.width,height:50});const t=60,n=60;for(let p=$-100;p>0;p-=n)for(let P=20;P<f.width-20;P+=t)b.push({x:P,y:p,width:20,height:20,collected:!1,type:"coin",id:Y("coin")});const a=80,r=20,s=60,i=$-60,o=80,c=[40,f.width/2-a/2,f.width-a-40];let d=0;for(let p=i;p>o;p-=s){let P;p>$-300||p>$/2?P=c:P=[40+d%2*(f.width-a-80)];for(const C of P)O.push({x:C,y:p,width:a,height:r,dx:d%2===0?2:-2,range:120,startX:C}),d++}const x=13*8,g=50,y=40+x,k={x:0,y,width:f.width,height:g};if(u.push(k),S.x=f.width/2-S.width/2,S.y=y-80+g,l.x=50,l.y=$-l.height-10,l.vx=0,l.vy=0,be(),B=Math.max(0,$-f.height),T="vertical",z&&b.length>0){const p=window.location.port==="5173"?"http://localhost:3001/register-collectibles":"/register-collectibles";try{fetch(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({collectibles:b.map(P=>({id:P.id,type:P.type}))})})}catch{}}}window.addEventListener("resize",()=>{const t=document.getElementById("share-btn"),n=document.getElementById("restart-btn");t&&t.style.display!=="none"&&(window.innerWidth<=768?(t.style.top="calc(50% + 140px)",t.style.left="calc(50% - 160px)",t.style.transform="translateX(0)",t.style.fontSize="1.2em",t.style.padding="10px 16px"):(t.style.top="calc(50% + 120px)",t.style.left="50%",t.style.transform="translateX(-50%)",t.style.fontSize="1.8em",t.style.padding="12px 24px")),n&&n.style.display!=="none"&&(window.innerWidth<=768?(n.style.top="calc(50% + 140px)",n.style.left="calc(50% + 80px)",n.style.transform="translateX(0)",n.style.fontSize="1.2em",n.style.padding="10px 16px"):(n.style.top="calc(50% + 160px)",n.style.left="50%",n.style.transform="translateX(-50%)",n.style.fontSize="2em",n.style.padding="16px 32px"))});
