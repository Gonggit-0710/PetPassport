/* Shared calculator dates. This estimates preparation, not travel approval. */
(function(){
  'use strict';
  const parse=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const [y,m,d]=s.split('-').map(Number),date=new Date(y,m-1,d);return date.getFullYear()===y&&date.getMonth()===m-1&&date.getDate()===d?date:null;};
  const addDays=(d,n)=>{const date=new Date(d);date.setDate(date.getDate()+n);return date;};
  const addMonths=(d,n)=>{const date=new Date(d),day=date.getDate();date.setMonth(date.getMonth()+n);if(date.getDate()<day)date.setDate(0);return date;};
  const dayNumber=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())/86400000;
  const days=(a,b)=>dayNumber(a)-dayNumber(b);
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  function earliest(country,state,today=new Date()){
    const start=new Date(today);start.setHours(0,0,0,0);
    const blood=state.titer?parse(state.blood):null;
    if(blood){if(country.id==='jp')return addDays(blood,180);if(['fr','de','gb'].includes(country.id))return addMonths(blood,3);if(country.id==='sg')return addDays(blood,90);if(country.id==='au')return addDays(blood,185);if(country.id==='cn')return addDays(blood,21);}
    let lead=country.leadDays;if(!state.chip&&lead<30&&country.id==='us')lead=7;
    return addDays(start,lead);
  }
  function project(country,state,today=new Date()){
    const departure=parse(state.dep),first=earliest(country,state,today),base=departure&&departure>=first?departure:first;
    return {departure,earliest:first,base,tooSoon:!!departure&&departure<first,daysLeft:departure?days(departure,today):null,
      steps:country.timeline.map(step=>({...step,date:addDays(base,step.d)})).sort((a,b)=>a.d-b.d)};
  }
  window.PTTripPlan={parse,iso,days,earliest,project};
})();
