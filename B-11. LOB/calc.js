/* Pure calculations. No production log or CAPA workbook writes. */
(() => {
 const finite=x=>Number.isFinite(x)&&x>=0;
 function stages(m){
  return [...m.s1.map((seconds,i)=>({name:`Insert ${i+1}`,section:'S1',seconds,count:1,array:m.s1Array??1,index:i})),
   ...m.s2.map((p,i)=>({...p,array:p.array??1,section:'S2',index:i}))];
 }
 function sectionCapacity(m,section){
  const list=stages(m).filter(p=>p.section===section);
  if(!list.length||list.some(p=>!finite(p.seconds)||p.seconds<=0||!Number.isInteger(p.count)||p.count<1||p.count>60||!Number.isInteger(p.array)||p.array<1||p.array>64))return null;
  return 3600/Math.max(...list.map(p=>p.seconds/(p.count*p.array)));
 }
 function calculate(m){
  const list=stages(m),issues=[];
  for(const p of list){
   if(!p.name.trim())issues.push('공정명을 입력하세요.');
   if(!finite(p.seconds)||p.seconds<=0)issues.push(`${p.name}: 시간 입력`);
   if(!Number.isInteger(p.count)||p.count<1||p.count>60)issues.push(`${p.name}: 개수 확인`);
   if(!Number.isInteger(p.array)||p.array<1||p.array>64)issues.push(`${p.name}: PCB Array 확인 (1~64)`);
   p.cycle=p.seconds/(p.count*p.array);
   p.capa=p.cycle>0?3600/p.cycle:0;
  }
  if(!m.s1.length)issues.push('S1 인원을 입력하세요.');
  if(!finite(m.minutes)||m.minutes<=0)issues.push('순가동 분 입력');
  if(!finite(m.target)||m.target>100000)issues.push('목표 UPH 입력 확인');
  if(issues.length)return {valid:false,issues,stages:list};
  const cycle=Math.max(...list.map(p=>p.cycle)),positions=list.reduce((s,p)=>s+p.count,0),work=list.reduce((s,p)=>s+p.seconds/p.array,0);
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
  const horizon=m.minutes*60;
  const hourly=Array(Math.ceil(m.minutes/60)).fill(0),trace=[];
  let arrivals=null,limited=false;
  const sections={};
  const paths=Array.from({length:12},()=>[]);
  for(const p of result.stages){
   const machines=Array(p.count).fill(0),output=[],available=arrivals?arrivals.length:limit;
   // PCB counts are conserved. A downstream batch waits for its full array.
   for(let unit=0;unit+p.array<=available;unit+=p.array){
    const machine=machines.indexOf(Math.min(...machines));
    const start=Math.max(arrivals?arrivals[unit+p.array-1]:0,machines[machine]);
    const finish=start+p.seconds;if(finish>horizon+1e-8)break;
    machines[machine]=finish;
    for(let j=0;j<p.array;j++){output.push(finish);if(unit+j<12)paths[unit+j].push({name:p.name,start,finish});}
   }
   if(arrivals===null&&output.length+p.array>limit)limited=true;
   arrivals=output;
   sections[p.section]={produced:output.length,capa:sectionCapacity(m,p.section)};
  }
  for(const [i,finish] of arrivals.entries()){
   hourly[Math.min(hourly.length-1,Math.max(0,Math.ceil(finish/3600)-1))]++;
   if(i<12)trace.push({unit:i+1,path:paths[i],finish});
  }
  return {...result,produced:arrivals.length,hourly,trace,sections,lead:arrivals[0]??null,limited,minutes:m.minutes};
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
 const api={stages,sectionCapacity,calculate,simulate,recommendations};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else globalThis.LobCalc=api;
})();
