/* Pure calculations. No production log or CAPA workbook writes. */
(() => {
 const finite=x=>Number.isFinite(x)&&x>=0;
 function stages(m){
  return [...m.s1.map((seconds,i)=>({name:`Insert ${i+1}`,section:'S1',seconds,count:1,index:i})),
   ...m.s2.map((p,i)=>({...p,section:'S2',index:i}))];
 }
 function calculate(m){
  const list=stages(m),issues=[];
  for(const p of list){
   if(!p.name.trim())issues.push('공정명을 입력하세요.');
   if(!finite(p.seconds)||p.seconds<=0)issues.push(`${p.name}: 시간 입력`);
   if(!Number.isInteger(p.count)||p.count<1||p.count>60)issues.push(`${p.name}: 개수 확인`);
   p.cycle=p.seconds/p.count;
   p.capa=p.cycle>0?3600/p.cycle:0;
  }
  if(!m.s1.length)issues.push('S1 인원을 입력하세요.');
  if(!finite(m.minutes)||m.minutes<=0)issues.push('순가동 분 입력');
  if(!finite(m.target)||m.target>100000)issues.push('목표 UPH 입력 확인');
  if(issues.length)return {valid:false,issues,stages:list};
  const cycle=Math.max(...list.map(p=>p.cycle)),positions=list.reduce((s,p)=>s+p.count,0),work=list.reduce((s,p)=>s+p.seconds,0);
  for(const p of list){p.bottleneck=Math.abs(p.cycle-cycle)<1e-7;p.load=p.cycle/cycle*100;}
  return {valid:true,issues:[],stages:list,cycle,uph:3600/cycle,positions,work,
   lob:positions?100*work/(positions*cycle):0,
   s1Capa:3600/Math.max(...list.filter(p=>p.section==='S1').map(p=>p.cycle)),
   s2Capa:m.s2.length?3600/Math.max(...list.filter(p=>p.section==='S2').map(p=>p.cycle)):null,
   bottlenecks:list.filter(p=>p.bottleneck).map(p=>p.name),
   lead:list.reduce((s,p)=>s+p.seconds,0),targetCycle:m.target>0?3600/m.target:null};
 }
 function simulate(m,limit=100000){
  const result=calculate(m);if(!result.valid)return result;
  const horizon=m.minutes*60,stations=result.stages.map(p=>({...p,machines:Array(p.count).fill(0),busy:0}));
  const hourly=Array(Math.ceil(m.minutes/60)).fill(0),trace=[];
  let produced=0,limited=false;
  for(let job=0;job<limit;job++){
   let ready=0;const path=[];
   for(const p of stations){
    const machine=p.machines.indexOf(Math.min(...p.machines));
    const start=Math.max(ready,p.machines[machine]);
    const finish=start+p.seconds;
    p.machines[machine]=finish;
    p.busy+=Math.max(0,Math.min(horizon,finish)-Math.min(horizon,start));
    path.push({name:p.name,start,finish});ready=finish;
   }
   if(ready>horizon+1e-8)break;
   produced++;hourly[Math.min(hourly.length-1,Math.max(0,Math.ceil(ready/3600)-1))]++;
   if(trace.length<12)trace.push({unit:produced,path,finish:ready});
   if(job===limit-1)limited=true;
  }
  return {...result,produced,hourly,trace,limited,minutes:m.minutes};
 }
 function recommendations(m){
  const base=calculate(m);if(!base.valid)return [];
  const out=[],total=m.s1.reduce((s,x)=>s+x,0),avg=total/m.s1.length;
  if(Math.max(...m.s1)-Math.min(...m.s1)>0.01){
   const candidate=structuredClone(m);candidate.s1=candidate.s1.map(()=>avg);
   out.push({title:'S1 작업 균등 배분',note:`총 삽입 ${total.toFixed(1)}초 유지 · 1인 ${avg.toFixed(1)}초. 작업 분할·이동 가능 여부 확인.`,candidate,after:calculate(candidate)});
  }
  if(base.stages.some(p=>p.section==='S1'&&p.bottleneck)&&m.s1.length<60){
   const candidate=structuredClone(m);candidate.s1=Array(m.s1.length+1).fill(total/(m.s1.length+1));
   out.push({title:'S1 인원 +1 / 재분배',note:`총 작업 ${total.toFixed(1)}초 유지 · ${m.s1.length}→${candidate.s1.length}명. 실제로 나눌 수 있는 작업만 재배분하세요.`,candidate,after:calculate(candidate)});
  }
  const combined=structuredClone(m);let combinedCount=0;
  for(const p of base.stages.filter(s=>s.bottleneck&&s.section==='S2')){
   const candidate=structuredClone(m),stage=candidate.s2[p.index];
   stage.count++;
   if(stage.count>60)continue;
   combined.s2[p.index]={...stage};combinedCount++;
   out.push({title:`${p.name} ${p.count}→${stage.count}개`,note:`${p.seconds}초 유지 · 같은 공정 ${stage.count}개가 병렬 작업하는 경우`,candidate,after:calculate(candidate)});
  }
  if(combinedCount>1)out.unshift({title:'S2 공동 병목 함께 개선',note:`같은 속도의 ${combinedCount}개 병목 공정을 함께 증설한 비교안입니다. 개별 개선만으로는 다른 병목이 남습니다.`,candidate:combined,after:calculate(combined)});
  for(const o of out)if(o.after.valid&&o.after.uph<=base.uph+1e-7)o.note+=' 다른 병목이 남아 현재 라인 CAPA는 증가하지 않습니다.';
  return out;
 }
 const api={stages,calculate,simulate,recommendations};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.LobCalc=api;
})();
