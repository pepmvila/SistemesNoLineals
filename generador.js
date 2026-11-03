/* Procedural generation: verified structures + invertible affine changes.
   Coefficients and exact solutions are produced together, never guessed. */
const NTDECKS=(()=>{try{return new Map(JSON.parse(sessionStorage.getItem('no-lineals-template-decks')||'[]'))}catch{return new Map()}})();
function nshuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){let j=rand(0,i);[a[i],a[j]]=[a[j],a[i]]}return a}
function nselectedFamilies(){return NGROUPS.filter(g=>g[2].some(id=>nchosen.includes(id))).map(g=>g[0])}
function ntakeTemplate(key,pool){
 let state=NTDECKS.get(key)||{deck:[],recent:[]};let allowed=new Set(pool.map(t=>t.id));state.deck=state.deck.filter(id=>allowed.has(id));
 if(!state.deck.length)state.deck=nshuffle(pool.map(t=>t.id));
 let position=state.deck.findIndex(id=>!state.recent.slice(-2).includes(id));if(position<0)position=state.deck.findIndex(id=>id!==state.recent.at(-1));if(position<0)position=0;
 let id=state.deck.splice(position,1)[0];state.recent.push(id);state.recent=state.recent.slice(-3);NTDECKS.set(key,state);try{sessionStorage.setItem('no-lineals-template-decks',JSON.stringify([...NTDECKS]))}catch{}return pool.find(t=>t.id===id);
}
function ntemplateHint(t){
 if(t.family==='mixed')return {
 'mixed-1':'Passa l’exponencial a una relació lineal entre els exponents. Combina la diferència de logaritmes en un quocient i resol les relacions obtingudes.',
 'mixed-2':'L’exponencial permet obtenir una relació lineal. Combina els logaritmes en el d’un producte i substitueix la relació lineal.',
 'mixed-3':'Combina els logaritmes per relacionar un argument amb el quadrat de l’altre. Iguala els exponents a la segona equació i substitueix.',
 'mixed-4':'Passa el logaritme a forma exponencial per obtenir una relació lineal. Substitueix-la a la quadràtica.',
 'mixed-5':'Controla el signe de l’argument racional del logaritme i els denominadors. Iguala els arguments dels logaritmes i elimina denominadors.',
 'mixed-6':'Eleva al quadrat la relació amb el radical per expressar una incògnita en funció de l’altra. Substitueix-la als recíprocs; el radical ha de ser no negatiu.',
 'mixed-7':'Substitueix l’expressió polinòmica dins del radical. Quadra i simplifica; comprova el signe del membre sense radical.',
 'mixed-8':'Fes un canvi de variable per a cadascuna de les potències que es repeteixen. La suma dels recíprocs és la suma dividida pel producte.',
 'mixed-9':'Les potències tenen la mateixa base: iguala els exponents per obtenir una relació quadràtica i substitueix-la a l’equació lineal.',
 'mixed-10':'Combina els logaritmes en un producte. Aïlla una arrel, eleva al quadrat i comprova el sentit de la diferència en acabar.',
 'mixed-11':'Eleva al quadrat la primera equació per obtenir una relació lineal. Combina els logaritmes en un quocient i resol el sistema lineal resultant.',
 'mixed-12':'Escriu la suma de recíprocs com una sola fracció. Fes un canvi de variable amb els dos quadrats que es repeteixen i recupera totes les combinacions de signes.'
 }[t.id]||t.hint;
 return t.hint;
}
function ngenerate(t,parameters=null){
 let l=t.l,f=t.family;
 // Keep variation in the numbers without adding gratuitous algebra.
 let sx=1,sy=1,dx=0,dy=0,gain=1;
 if(l===0){if(Math.random()<.2){if(Math.random()<.5)sx=2;else sy=2}}
 else if(Math.random()<.45){if(Math.random()<.5)sx=2;else sy=2}
 if((f==='polynomial'||f==='xy')&&!t.degrees.includes(null)&&Math.max(...t.degrees)<=2&&Math.random()<.4)gain=2;
 if(Math.random()<(l===2?.35:.15)){if(Math.random()<.5)dx=pick([-1,1]);else dy=pick([-1,1])}
 if(l===0&&(f==='rational'||f==='logarithmic')){dx=0;dy=0}
 if(f==='exponential'&&l===0){sx=1;sy=1}
 if(t.id==='xy-12'||t.id==='mixed-12'){dx=0;dy=0}
 if(t.family==='polynomial'&&t.degrees.some(d=>d>2)){sx=1;sy=1;dx=0;dy=0;gain=1}
 if(parameters){({sx,sy,dx,dy,gain}=parameters)}
 let ux=`(${sx}*x+(${dx}))/(${gain})`,uy=`(${sy}*y+(${dy}))/(${gain})`;
 const sub=s=>{try{return nerdamer(String(s).replace(/\bx\b/g,'('+ux+')').replace(/\by\b/g,'('+uy+')')).toString()}catch(e){throw Error('Substitution '+t.id+' '+JSON.stringify({sx,sy,dx,dy,gain})+' '+String(s).slice(0,100)+': '+e.message)}};
 const inverse=(s,v)=>nerdamer(`((${s})*${gain}-(${v==='x'?dx:dy}))/(${v==='x'?sx:sy})`).toString();
 let a=t.a.map((eq,i)=>{
  let [left,right]=eq.split('='),L=sub(left),R=sub(right),degree=t.degrees[i];
  if(degree!==null){let factor=gain**degree;let residual=ncas(`(${factor})*((${L})-(${R}))`),constant=nerdamer(residual,{x:0,y:0}).toString();let scale=1;L=ncas(`(${scale})*((${residual})-(${constant}))`);R=nerdamer(`-(${scale})*(${constant})`).toString()}
  return L+'='+R;
 });
 let projections={x:sub(t.p.x),y:sub(t.p.y)},solutions=t.sol.map(p=>[inverse(p[0],'x'),inverse(p[1],'y')]),rootSets={x:t.rootSets.x.map(r=>inverse(r,'x')),y:t.rootSets.y.map(r=>inverse(r,'y'))};
 let c={...t,a,p:projections,sol:solutions,rootSets,domain:t.domain.map(d=>({...d,expr:sub(d.expr)})),id:t.id+':'+[sx,sy,dx,dy,gain].join(','),hint:ntemplateHint(t)};
 let result;try{result=ncase(c)}catch(e){throw Error('Case cache '+t.id+': '+e.message)};result.templateId=t.id;result.templateTitle=t.title;result.domain=c.domain;result.mixedFamilies=t.features||null;result.generated=true;result.parameters={sx,sy,dx,dy,gain};result.sourceDegrees=t.degrees;
 return result;
}
function ngeneratedValid(c){try{return c.solutions.every(p=>{let sub={x:p[0],y:p[1]};return c.domain.every(d=>{let v=nvalue(d.expr,sub);return d.op==='gt'?v>0:d.op==='ge'?v>=-1e-10:Math.abs(v)>1e-10})&&c.a.every(eq=>Math.abs(nvalue(nres(eq),sub))<1e-8)})}catch{return false}}
function nadditiveTerms(s){let terms=[],part='',depth=0;for(let i=0;i<s.length;i++){let ch=s[i];if(ch==='(')depth++;if(ch===')')depth--;if(!depth&&(ch==='+'||ch==='-')&&part){terms.push(part);part=''}part+=ch}if(part)terms.push(part);return terms}
function nmanageable(c){try{let level=c.l,maxCoeff=[8,12,24][level],maxConstant=[60,100,200][level],maxTerms=[4,4,5][level];for(let i=0;i<c.a.length;i++){if(c.a[i].length>[110,150,200][level])return false;if(c.sourceDegrees?.[i]!==null){let terms=nadditiveTerms(ncas(nres(c.a[i]))),nonconstant=0;for(let term of terms){if(nerdamer(term).variables().length){nonconstant++;if(Math.abs(nvalue(term,{x:1,y:1}))>maxCoeff)return false}else if(Math.abs(nvalue(term))>maxConstant)return false}if(nonconstant>maxTerms)return false}}
 for(let p of c.solutions)for(let v of p){if(v.length>[24,40,70][level])return false;let den=nerdamer(v).denominator().toString();if(/^\d+$/.test(den)&&Number(den)>[4,8,16][level])return false}return true}catch{return false}}
function nsafeGenerate(t){for(let i=0;i<4;i++){try{let c=ngenerate(t);if(ngeneratedValid(c)&&nmanageable(c))return c}catch{}}let c=ngenerate(t,{sx:1,sy:1,dx:0,dy:0,gain:1});if(!ngeneratedValid(c)||!nmanageable(c))throw Error('No s’ha pogut preparar un repte vàlid.');return c;}
const nfixedMake=nmake;
nmake=function(type,l,mix=false){
 if(NFORCED!==null)return nfixedMake(type,l,mix);
 let families=nselectedFamilies(),family=['quadratic','cubic','powers'].includes(type)?'polynomial':type;
 let mixed=mix?NTEMPLATES.filter(t=>t.family==='mixed'&&t.l===l&&t.features.every(f=>families.includes(f))):[];
 let isMixed=mixed.length&&Math.random()<.35,pool=isMixed?mixed:NTEMPLATES.filter(t=>t.family===family&&t.l===l);
 if(!isMixed&&Math.random()<.9)pool=pool.filter(t=>!t.rare);
 let key=(isMixed?'mixed':family)+'|'+l+'|'+(isMixed?families.join(','):'');let t=ntakeTemplate(key,pool),result=nsafeGenerate(t);result.mix=mix;return result;
};
nnext=function(){if(!N)return;let mix=N.mix,previous=JSON.stringify(N.a),families=nselectedFamilies();let result;
 for(let attempt=0;attempt<4;attempt++){let family=pick(families);result=nmake(family==='polynomial'?'quadratic':family,nlevel,mix);if(JSON.stringify(result.a)!==previous)break}
 N=result;S={};nrender();
};
