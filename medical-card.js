/* My Card creation and export. Personal data stays in the browser. */
(function(){
  'use strict';
  const PTX = window.PTX = window.PTX || {};
  PTX.mountMedicalCard = function(root, api){
    const {esc, languages:L, conditions, allergies, wallet, save, photo, savePhoto, track} = api;
    const sample = {name:'보리 / Bori', breed:'Maltese', weight:'4.2', owner:'Sample owner', ownerTel:'+82 10-0000-0000', condNone:true, alg:['chicken'], medsNone:true};
    let lang = api.language(), revision = 0, imageUrl = null, walletUrl = null, file = null;
    if(!L[lang]) lang = 'en';
    const q = s => root.querySelector(s);
    const ready = w => !!(w.name && w.weight && w.ownerTel);
    const choiceText = (list, ids) => list.filter(o=>(ids||[]).includes(o.id)).map(o=>lang==='ko'?o.ko:o[lang]+' / '+o.ko).join('\n');
    function health(w, list, key, note, none){
      const selected = choiceText(list,w[key]);
      return [selected,w[note]].filter(Boolean).join('\n') || (w[none]?L[lang].none:({ko:'미입력',en:'Not provided',ja:'未入力',zh:'未填写'})[lang]);
    }
    function rows(w){
      const t=L[lang], result = [
        [t.dog,w.name||'—'],[t.breed,w.breed||'—'],[t.weight,w.weight?w.weight+' kg':'—'],
        [t.cond,health(w,conditions,'cond','condNote','condNone')],
        [t.allergy,health(w,allergies,'alg','algNote','algNone')],
        [t.meds,w.meds||(w.medsNone?t.none:({ko:'미입력',en:'Not provided',ja:'未入力',zh:'未填写'})[lang])],
        [t.owner,w.owner||'—'],[t.tel,w.ownerTel||'—']
      ];
      if(w.emer) result.push([t.emer,w.emer]);
      if(w.chip) result.push([t.chip,w.chip]);
      if(w.vet) result.push([t.vet,[w.vet,w.vetTel].filter(Boolean).join(' · ')]);
      return result;
    }
    const note = () => ({ko:'보호자 제공 정보 · 직접 쓴 메모와 약 이름은 원문입니다. 원본 증명서를 대신하지 않습니다.',en:'Owner-provided information. Free-text notes and medication names remain in their original language. This is not an official certificate.',ja:'飼い主が提供した情報です。自由記入のメモ・薬名は原文のままです。公的な証明書ではありません。',zh:'信息由主人提供。自由填写的备注及药名保留原文。本卡不是官方证明。'})[lang];
    function dateLabel(w){
      const value=(w.updatedAt||new Date().toISOString()).slice(0,10);
      return (w.updatedAt?'Updated / 更新 / 수정일: ':'Created / 作成 / 생성일: ')+value;
    }
    function card(w, url, example){
      return `<article class="medical-card" lang="${lang==='zh'?'zh-CN':lang}">
        <header class="medical-card-head"><div><span class="medical-brand">PawTrip · My Card${example?' · SAMPLE':''}</span><h3>${L[lang].title}</h3><p>${esc(w.name||'—')}</p></div>${url?`<img class="medical-photo" src="${esc(url)}" alt="반려견 사진">`:''}</header>
        <dl>${rows(w).map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <footer><p>${esc(note())}</p><span>${esc(dateLabel(w))}</span><b>pawtrip.us</b></footer></article>`;
    }
    function clearImage(){ if(imageUrl){URL.revokeObjectURL(imageUrl); imageUrl=null;} if(walletUrl){URL.revokeObjectURL(walletUrl);walletUrl=null;} file=null; }
    root.disposeMedicalCard = ()=>{revision++;clearImage();};
    function home(){
      revision++; clearImage();
      const w=wallet(), has=!!(w.name||w.ownerTel||w.chip);
      root.innerHTML=`<section class="panel medical-intro"><span class="num">여행 전에 챙기는 한 장</span><h2 class="sec-h">현지 동물병원에서 보여줄 우리 강아지 카드</h2><p>정보를 입력하고 언어를 고르면 휴대폰에 보관할 카드를 만들 수 있어요.</p><div class="row-btns"><button class="btn btn-primary" type="button" data-create>${has?'간단 정보 수정':'내 카드 만들기'}</button><button class="btn btn-sm" type="button" data-example>예시 보기</button>${has?'<button class="btn btn-sm" type="button" data-preview>내 카드 보기·저장</button>':''}</div><div class="medical-stage"></div></section>`;
      q('[data-create]').onclick=form;
      q('[data-example]').onclick=()=>{track('medical_example_view',{});preview(true);};
      if(has) q('[data-preview]').onclick=()=>preview(false);
    }
    function form(){
      revision++; clearImage(); track('medical_create_start',{});
      const w=wallet();
      const input=(key,label,type='text',extra='')=>`<div class="field"><label for="mc-${key}">${label}</label><input id="mc-${key}" name="${key}" type="${type}" value="${esc(w[key]||'')}" ${extra}></div>`;
      const group=(list,key,noteKey,noneKey,title)=>`<fieldset><legend>${title}</legend><label class="check"><input type="checkbox" name="${noneKey}" ${w[noneKey]?'checked':''}><span>알려진 ${title} 없음</span></label><details><summary>해당 항목 선택·직접 입력</summary><div class="opt-grid">${list.map(o=>`<label class="check"><input type="checkbox" name="${key}" value="${o.id}" ${(w[key]||[]).includes(o.id)?'checked':''}><span>${o.ko}</span></label>`).join('')}</div>${input(noteKey,'기타 '+title,'text','maxlength="1200"')}</details></fieldset>`;
      q('.medical-stage').innerHTML=`<form class="medical-form stack-16"><h3 class="sec-h">진료용 카드 간단 작성</h3><p class="hint">이름·체중·보호자 전화는 필수입니다. 건강 정보는 비워 두면 ‘미입력’으로 표시됩니다. 작성 후 카드 만들기를 누르면 이 기기에 저장됩니다.</p><div class="form-grid two">${input('name','반려견 이름','text','required maxlength="100" autocomplete="off"')}${input('weight','체중 (kg)','number','required min="0.1" max="100" step="0.1" inputmode="decimal"')}${input('breed','견종 (선택)','text','maxlength="100"')}${input('owner','보호자 이름 (선택)','text','maxlength="100"')}${input('ownerTel','보호자 전화 (국가번호 포함)','tel','required maxlength="100" placeholder="+82 10-0000-0000"')}<div class="field"><label for="mc-photo">사진 (선택)</label><input id="mc-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp"><p class="hint">기존 사진은 유지됩니다. 새 사진을 선택하면 교체합니다.</p></div></div>
        ${group(conditions,'cond','condNote','condNone','지병')}${group(allergies,'alg','algNote','algNone','알레르기')}
        <fieldset><legend>복용 중인 약</legend><label class="check"><input type="checkbox" name="medsNone" ${w.medsNone?'checked':''}><span>복용 중인 약 없음</span></label><div class="field"><label for="mc-meds">약 이름·용량·횟수 (선택)</label><textarea id="mc-meds" name="meds" maxlength="1200" placeholder="처방전에 적힌 영문 성분명·용량·횟수">${esc(w.meds||'')}</textarea></div></fieldset>
        <p class="hint">선택형 항목만 번역됩니다. 직접 쓴 내용은 원문 그대로 표시됩니다.</p><p class="save-state" role="status" data-form-status></p><div class="row-btns"><button class="btn btn-primary" type="submit">카드 만들고 미리보기</button><button class="btn btn-sm" type="button" data-cancel>취소</button></div></form>`;
      const f=q('form');
      function mutuallyExclusive(key,noteKey,noneKey){
        f.addEventListener('input',e=>{const name=e.target.name;
          if(name===noneKey && e.target.checked){ f.querySelectorAll(`[name="${key}"]`).forEach(x=>x.checked=false); f.elements[noteKey].value=''; }
          else if((name===key && e.target.checked)||(name===noteKey && e.target.value.trim())) f.elements[noneKey].checked=false;
        });
      }
      mutuallyExclusive('cond','condNote','condNone'); mutuallyExclusive('alg','algNote','algNone');
      f.elements.medsNone.onchange=()=>{if(f.elements.medsNone.checked) f.elements.meds.value='';};
      f.elements.meds.oninput=()=>{if(f.elements.meds.value.trim()) f.elements.medsNone.checked=false;};
      q('[data-cancel]').onclick=home;
      f.onsubmit=async e=>{
        e.preventDefault(); if(!f.reportValidity()) return;
        const values=new FormData(f), next={...wallet()};
        for(const key of ['name','weight','breed','owner','ownerTel','condNote','algNote','meds']) next[key]=String(values.get(key)||'').trim();
        if(!ready(next)){q('[data-form-status]').textContent='이름·체중·보호자 전화를 입력해 주세요.';return;}
        for(const key of ['cond','alg']) next[key]=values.getAll(key);
        for(const key of ['condNone','algNone','medsNone']) next[key]=values.has(key);
        next.updatedAt=new Date().toISOString();
        const submit=f.querySelector('[type="submit"]');submit.disabled=true;
        try{
          const selected=f.elements.photo.files[0];
          if(selected){if(!['image/jpeg','image/png','image/webp'].includes(selected.type)) throw new Error('사진은 JPG·PNG·WebP 형식으로 선택해 주세요.');await savePhoto(selected);}
          if(!save(next)) throw new Error('저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.');
          track('medical_create_complete',{}); home(); await preview(false);
        }catch(err){q('[data-form-status]').textContent=err.message||'저장하지 못했어요. 다시 시도해 주세요.';submit.disabled=false;}
      };
      q('[name="name"]').focus();
    }
    async function preview(example){
      const token=++revision; clearImage();const w=example?sample:wallet();
      q('.medical-stage').innerHTML=`<section class="medical-preview"><h3 class="sec-h">${example?'예시 카드 · 가상 정보':'내 진료용 카드'}</h3><div class="chips" role="group" aria-label="저장할 카드 언어">${['en','ja','zh','ko'].map(k=>`<button class="chip" type="button" data-medical-lang="${k}" aria-pressed="${lang===k}">${L[k].name}</button>`).join('')}</div><div data-medical-card></div><p class="save-state" role="status" data-export-status>카드를 준비하고 있어요…</p><div class="row-btns">${example?'<button class="btn btn-primary" type="button" data-use-example>내 카드 만들기</button>':'<button class="btn btn-primary" type="button" data-download disabled>PNG 이미지 내려받기</button><button class="btn btn-sm" type="button" data-share hidden>공유·저장</button><button class="btn btn-sm" type="button" data-print disabled>인쇄·PDF 저장</button><button class="btn btn-sm" type="button" data-edit>정보 수정</button>'}</div>${example?'':'<p class="hint">내려받은 이미지는 파일·다운로드 폴더에서 확인하세요. 사진첩에 보관하려면 공유·저장 또는 이미지 미리보기를 이용하세요. 연락처와 건강 정보가 포함되므로 전달 전에 확인하세요.</p><details class="medical-image-fallback"><summary>이미지 미리보기·저장 방법</summary><p class="hint">휴대폰에서 이미지를 길게 누르거나 공유 메뉴로 저장하세요. 기기마다 저장 메뉴가 다를 수 있습니다. PC 카카오톡에서 이미지가 붙지 않으면 PNG를 내려받은 뒤 채팅창에 파일을 끌어 넣거나 파일 첨부를 이용하세요.</p><div data-export-image></div></details><p class="hint">마이크로칩·비상 연락처·병원 정보를 추가하려면 <a href="/mycard/?edit=1">상세 정보 수정</a>을 이용하세요.</p>'}</section>`;
      q('[data-medical-card]').innerHTML=card(w,null,example);
      root.querySelectorAll('[data-medical-lang]').forEach(b=>b.onclick=()=>{lang=b.dataset.medicalLang; api.setLanguage(lang);track('medical_language_select',{language:lang});preview(example);});
      if(example) q('[data-use-example]').onclick=form;
      else {
        q('[data-edit]').onclick=form;
        const walletButton=document.createElement('button');walletButton.type='button';walletButton.className='btn btn-sm';walletButton.dataset.wallet='';
        const endpoint=window.PAWTRIP_WALLET?.endpoint;
        walletButton.textContent=endpoint?'Apple Wallet에 추가':'Apple Wallet · 준비 중';walletButton.disabled=!endpoint;
        q('.medical-preview .row-btns').appendChild(walletButton);
        const panel=document.createElement('div');panel.className='medical-wallet-panel';q('.medical-preview').appendChild(panel);
        walletButton.onclick=()=>walletPanel(panel,w,token,endpoint);
      }
      let url=null;
      try{if(!example) url=await photo();}catch(_){}
      if(token!==revision || !root.isConnected) return;
      q('[data-medical-card]').innerHTML=card(w,url,example);
      if(example){q('[data-export-status]').textContent='예시는 저장된 내 정보를 바꾸지 않습니다.';return;}
      q('[data-print]').disabled=false;
      q('[data-print]').onclick=()=>printCard(q('[data-medical-card]').innerHTML);
      try{
        const blob=await png(w,url); if(token!==revision || !root.isConnected) return;
        imageUrl=URL.createObjectURL(blob); file=new File([blob],`pawtrip-medical-${lang}.png`,{type:'image/png'});
        q('[data-export-image]').innerHTML=`<img src="${imageUrl}" alt="저장할 진료용 카드 이미지">`;
        q('[data-download]').disabled=false;
        q('[data-export-status]').textContent='이미지가 준비됐어요. 선택한 언어로 저장됩니다.';
        q('[data-download]').onclick=()=>{const a=document.createElement('a');a.href=imageUrl;a.download=file.name;document.body.appendChild(a);a.click();a.remove();track('medical_image_download',{language:lang});q('[data-export-status]').textContent='이미지 내려받기를 요청했어요. 다운로드 폴더를 확인하세요.';};
        let canShare=false; try{canShare=!!(navigator.share && navigator.canShare && navigator.canShare({files:[file]}));}catch(_){}
        if(canShare){q('[data-share]').hidden=false;q('[data-share]').onclick=async()=>{try{await navigator.share({files:[file],title:'PawTrip · My Card'});if(token===revision){track('medical_image_share',{language:lang});q('[data-export-status]').textContent='공유 메뉴를 열었어요. 선택한 앱에서 이미지가 첨부됐는지 확인하세요. 첨부되지 않으면 PNG를 내려받아 직접 첨부해 주세요.';}}catch(err){if(token===revision) q('[data-export-status]').textContent=err.name==='AbortError'?'공유를 취소했어요.':'공유하지 못했어요. 이미지 내려받기 또는 미리보기를 이용하세요.';}};}
      }catch(_){if(token===revision) q('[data-export-status]').textContent='이미지를 만들지 못했어요. 인쇄·PDF 저장을 이용하거나 다시 시도해 주세요.';}
    }
    function walletPanel(panel,w,token,endpoint){
      panel.innerHTML=`<section class="panel" style="margin-top:16px"><h4 class="sec-h">Apple Wallet에 보관하기</h4><p>현재 언어의 이름·체중·연락처·건강 정보와 사진을 Wallet 카드로 만듭니다. 사진과 정보를 발급 서버에서 일시 처리하며 저장하지 않습니다.</p><label class="check"><input type="checkbox" data-wallet-consent><span>이 카드의 정보와 사진을 Wallet 발급 서버로 보내는 데 동의합니다.</span></label><div class="row-btns"><button class="btn btn-primary btn-sm" type="button" data-wallet-generate disabled>Wallet 카드 만들기</button></div><p class="save-state" role="status" data-wallet-status></p><div data-wallet-result></div><p class="hint">아이폰에서 발급 파일을 열어 Wallet에 추가하세요. 정보를 수정하면 카드를 다시 발급해야 합니다.</p></section>`;
      const button=panel.querySelector('[data-wallet-generate]'),consent=panel.querySelector('[data-wallet-consent]'),status=panel.querySelector('[data-wallet-status]');
      consent.onchange=()=>button.disabled=!consent.checked;
      button.onclick=async()=>{
        if(!consent.checked)return;
        button.disabled=true;consent.disabled=true;status.textContent='Wallet 카드를 만들고 있어요…';
        const timeout=new AbortController(),timer=setTimeout(()=>timeout.abort(),20000);
        try{
          const dest=new URL(endpoint,location.href);
          if(dest.protocol!=='https:' && !(['127.0.0.1','localhost'].includes(dest.hostname)&&dest.protocol==='http:')) throw new Error('Wallet 연결을 확인해야 합니다. PNG 저장을 이용해 주세요.');
          const payload={language:lang,card:{name:w.name||'',breed:w.breed||'',weight:String(w.weight||''),conditions:health(w,conditions,'cond','condNote','condNone'),allergies:health(w,allergies,'alg','algNote','algNone'),medications:w.meds||(w.medsNone?L[lang].none:({ko:'미입력',en:'Not provided',ja:'未入力',zh:'未填写'})[lang]),owner:w.owner||'',phone:w.ownerTel||'',emergency:w.emer||'',chip:w.chip||'',vet:[w.vet,w.vetTel].filter(Boolean).join(' · ')}};
          const source=await api.photo();
          if(source){const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=source;});const cv=document.createElement('canvas');cv.width=180;cv.height=180;const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,180,180);const s=Math.min(180/img.width,180/img.height);g.drawImage(img,(180-img.width*s)/2,(180-img.height*s)/2,img.width*s,img.height*s);payload.photo=cv.toDataURL('image/png');}
          if(token!==revision||!root.isConnected)return;
          track('medical_wallet_request',{language:lang});
          const response=await fetch(dest.href,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',cache:'no-store',body:JSON.stringify(payload),signal:timeout.signal});
          if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.message||'Wallet 카드를 발급하지 못했어요. PNG 저장을 이용해 주세요.');}
          if(!(response.headers.get('Content-Type')||'').startsWith('application/vnd.apple.pkpass'))throw new Error('Wallet 파일 형식을 확인하지 못했어요. PNG 저장을 이용해 주세요.');
          const blob=await response.blob();if(token!==revision||!root.isConnected)return;
          if(walletUrl)URL.revokeObjectURL(walletUrl);walletUrl=URL.createObjectURL(blob);
          panel.querySelector('[data-wallet-result]').innerHTML=`<a class="btn btn-primary btn-sm" href="${walletUrl}" download="pawtrip-my-card.pkpass" data-wallet-open>Wallet 카드 열기</a>`;
          panel.querySelector('[data-wallet-open]').onclick=()=>track('medical_wallet_download',{language:lang});
          status.textContent='발급됐어요. Wallet 카드 열기를 눌러 아이폰에서 추가하세요.';
        }catch(err){if(token===revision && root.isConnected)status.textContent=err.name==='AbortError'?'연결 시간이 초과됐어요. 다시 시도하거나 PNG 저장을 이용해 주세요.':err.message;}
        finally{clearTimeout(timer);if(token===revision&&root.isConnected){consent.disabled=false;button.disabled=!consent.checked;}}
      };
    }
    async function png(w,url){
      if(document.fonts) await document.fonts.ready;
      const cv=document.createElement('canvas'),g=cv.getContext('2d'); if(!g) throw new Error('canvas');
      const font='Arial, "Malgun Gothic", "Yu Gothic", "Microsoft YaHei", sans-serif';
      const wrap=(value,width,size)=>{
        g.font=`${size}px ${font}`;const lines=[];
        for(const paragraph of String(value).split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line && g.measureText(line+ch).width>width){lines.push(line);line='';}line+=ch;}lines.push(line);}
        return lines;
      };
      const table=rows(w).map(([label,value])=>{const labels=wrap(label,190,20),values=wrap(value,410,24);return {labels,values,height:Math.max(labels.length*30,values.length*34)+24};});
      const title=wrap(L[lang].title, url?470:624,28), name=wrap(w.name||'—',url?470:624,24);
      const headerHeight=Math.max(150,70+title.length*38+name.length*34), footer=wrap(note(),624,18);
      const height=headerHeight+table.reduce((n,r)=>n+r.height,0)+footer.length*26+100;
      if(height>15000) throw new Error('image too tall');
      cv.width=1440;cv.height=Math.ceil(height*2);g.scale(2,2);
      g.fillStyle='#fff';g.fillRect(0,0,720,height);g.fillStyle='#163449';g.fillRect(0,0,720,headerHeight);
      const text=(s,x,y,size,color,weight='400')=>{g.font=`${weight} ${size}px ${font}`;g.fillStyle=color;g.fillText(s,x,y);};
      text('PawTrip · My Card',48,35,18,'#fff','700'); let y=73;
      title.forEach(s=>{text(s,48,y,28,'#fff','700');y+=38;});name.forEach(s=>{text(s,48,y,24,'#fff');y+=34;});
      if(url){const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});const scale=Math.min(100/img.width,100/img.height);g.drawImage(img,560+(100-img.width*scale)/2,25+(100-img.height*scale)/2,img.width*scale,img.height*scale);}
      y=headerHeight;
      for(const row of table){g.fillStyle='#e4ebef';g.fillRect(48,y+row.height-1,624,1);row.labels.forEach((s,i)=>text(s,48,y+31+i*30,20,'#405361','700'));row.values.forEach((s,i)=>text(s,260,y+31+i*34,24,'#111'));y+=row.height;}
      y+=30;footer.forEach(s=>{text(s,48,y,18,'#405361');y+=26;});text(dateLabel(w),48,y+15,16,'#405361');text('pawtrip.us',48,y+45,18,'#163449','700');
      return new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(new Error('PNG failed')),'image/png'));
    }
    function printCard(html){
      const frame=document.createElement('iframe');frame.className='medical-print-frame';frame.title='진료용 카드 인쇄';
      frame.onload=async()=>{try{const win=frame.contentWindow;await win.document.fonts.ready;await Promise.all(Array.from(win.document.images).map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r;})));win.addEventListener('afterprint',()=>frame.remove(),{once:true});win.focus();win.print();track('medical_print_request',{language:lang});}catch(_){frame.remove();q('[data-export-status]').textContent='인쇄 화면을 열지 못했어요. 이미지를 내려받아 인쇄해 주세요.';}};
      frame.srcdoc=`<!doctype html><html><head><meta charset="utf-8"><title>PawTrip My Card</title><style>@page{size:A4;margin:15mm}body{margin:0;font:14px Arial,"Malgun Gothic",sans-serif;color:#111}.medical-card{max-width:680px;margin:auto}.medical-card-head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #163449;padding-bottom:14px}.medical-brand{font-weight:bold}h3{font-size:24px;margin:8px 0}p{margin:8px 0}.medical-photo{width:90px;height:90px;object-fit:contain}dl{margin:16px 0}dt{font-weight:bold;break-after:avoid}dd{margin:4px 0 14px;white-space:pre-wrap;overflow-wrap:anywhere;break-inside:avoid}footer{border-top:1px solid #aaa;font-size:11px;padding-top:10px}footer b{display:block;margin-top:8px}</style></head><body>${html}</body></html>`;
      document.body.appendChild(frame);
    }
    home();
  };
})();
