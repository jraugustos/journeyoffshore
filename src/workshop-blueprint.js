/* Blueprint workspace, v9. The overview is always derived from the same case objects as the fronts. */
const BP_STATUS=['Em defini\u00e7\u00e3o','Priorizado','N\u00e3o priorizado','Desativado'];
const BP_PHASES=['Day-1','Release A','Release B','Release C','Release D'];
const BP_LANES=[['actor','Ator','Quem executa esta etapa?'],['channel','Canal','Por onde o ator executa?'],['operation','Opera\u00e7\u00e3o','Qual opera\u00e7\u00e3o responde e qual \u00e9 seu papel?'],['system','Sistema','Qual sistema executa o processo?'],['capabilities','Capacidades','Quais capacidades precisam existir ou ser ativadas?'],['data','Dados','Dados necessários e sistemas ou capacidades que os fornecem.'],['support','Atendimento','Como ocorre o suporte nesta etapa?']];
const BP_OLD_PROFILE={'IPB OFF':'Private Offshore','IPB ON':'Private Onshore','SPEC + IP':'Special e Person','SPEC+IP':'Special e Person'};
Object.assign(view,{bpMacro:'all',bpCase:'standard',bpProfile:'all',bpRelease:'all',bpStatus:'all',bpDensity:'compact',catalogMacro:'all',catalogBoard:'all',catalogRelease:'all',catalogAudience:'all',catalogSearch:'',registryTab:'people'});
let bpModal=null;
const bpAlias=id=>({accounts:'banking',payments:'banking',channels:'banking',reporting:'wealth'}[id]||id);
const bpMacro=id=>state.macros.find(m=>m.id===id);
const bpDefault=b=>(b?.cases||[]).find(c=>c.isDefault);
const bpPerson=id=>state.people.find(p=>p.id===id);
const bpCap=id=>state.capabilities.find(c=>c.id===id);
const bpNames=ids=>(ids||[]).map(id=>bpPerson(id)?.name).filter(Boolean);
const bpMeaningful=s=>typeof s==='string'&&s.trim()&&!/^(a definir|a detalhar|a validar|pendente|[-\u2014])\.?$/i.test(s.trim());
const bpActive=b=>!['N\u00e3o priorizado','Desativado'].includes(b.status)&&!['N\u00e3o priorizado','Desativado'].includes(bpMacro(b.macroId)?.status);
const bpStatusClass=s=>s==='Priorizado'?'green':s==='Em defini\u00e7\u00e3o'?'orange':'outline';
const bpTag=s=>pill(s,bpStatusClass(s));
const bpOptions=(items,value)=>items.map(x=>{const v=Array.isArray(x)?x[0]:x,t=Array.isArray(x)?x[1]:x;return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`}).join('');
const bpField=(label,html,full=true,help='')=>`<div class="field ${full?'full':''}"><label>${label}</label>${html}${help?`<small class="dim">${help}</small>`:''}</div>`;
const bpInput=(name,value='',required=false)=>`<input name="${name}" value="${esc(value)}" ${required?'required':''} maxlength="2000">`;
const bpText=(name,value='',rows=3)=>`<textarea name="${name}" rows="${rows}" maxlength="20000">${esc(value)}</textarea>`;
const bpSelect=(name,items,value,extra='')=>`<select name="${name}" ${extra}>${bpOptions(items,value)}</select>`;
const bpBtn=(text,action,extra='',cls='')=>btn(text,'bp-'+action,extra,cls);
const bpMacroLabel=b=>bpMacro(b.macroId)?.name||b.macroId;
function bpReplaceProfiles(v){if(typeof v==='string')return Object.entries(BP_OLD_PROFILE).reduce((s,[a,b])=>s.split(a).join(b),v);if(Array.isArray(v))return v.map(bpReplaceProfiles);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[bpReplaceProfiles(k),bpReplaceProfiles(x)]));return v;}
function bpBlankBoard(id,name,macroId){return {id,name,short:name,macroId,code:String(state?.boards.length+1||1).padStart(2,'0'),pill:macroId==='usage'?'Produto':'Macroprocesso',status:'Em defini\u00e7\u00e3o',owners:[],ownerIds:[],summary:'',question:'',topics:[],scope:{offerDefinition:'',problem:'',within:'',outside:'',value:''},offers:[],asis:[],profiles:RELATIONS.map((group,i)=>({uid:id+'-profile-'+i,group,needs:'',conditions:''})),cases:[],blueprint:[],csd:[],notes:[],decisions:[],decisionHistory:[],actionPlan:[],progress:[0,0,0,0,0,0],journeyMap:{steps:[],assignments:{}}};}
function bpBlankStep(name=''){return {uid:qid(),name,actor:'',channel:'',operationOwner:'',operationRole:'',system:'',capabilityIds:[],capabilityNotes:'',support:'',release:'',status:'Em defini\u00e7\u00e3o',featureIds:[],nature:'Preenchimento do workshop',source:'',notes:''};}
function bpBlankCase(b,isDefault=false){return {uid:qid(),boardId:b.id,macroId:b.macroId,ref:isDefault?'PADR\u00c3O':'',title:isDefault?'Padr\u00e3o':'',isDefault,profiles:isDefault?[...RELATIONS]:[],status:'Em defini\u00e7\u00e3o',need:'',trigger:'',result:'',exception:'',owner:'',steps:[]};}
function bpCopySteps(source){return (source.steps||[]).map(s=>({...clone(s),uid:qid(),copiedFrom:{caseId:source.uid,stepId:s.uid},copiedAt:new Date().toISOString()}));}
function bpSanitizeState(src){
 if(!src||typeof src!=='object'||!Array.isArray(src.boards)||!src.boards.length)return null;
 if(src.schema===4){
  if(!Array.isArray(src.macros)||!src.macros.length)return null;
  const out=clone(src);out.formatVersion='9.0';out.session={...INITIAL.session,...out.session};
  out.people=Array.isArray(out.people)?out.people:[];out.capabilities=Array.isArray(out.capabilities)?out.capabilities:[];out.responsibilities=Array.isArray(out.responsibilities)?out.responsibilities:[];out.sharedRecords=Array.isArray(out.sharedRecords)?out.sharedRecords:[];out.featureRouting=out.featureRouting||clone(INITIAL.featureRouting);
  const knownMacros=new Set(out.macros.map(m=>m.id));const ids=new Set();
  for(const b of out.boards){if(!b.id||ids.has(b.id)||!knownMacros.has(b.macroId))return null;ids.add(b.id);b.scope={offerDefinition:'',problem:'',within:'',outside:'',value:'',...b.scope};for(const k of ['offers','asis','profiles','cases','blueprint','csd','notes','decisions','decisionHistory','actionPlan','owners','ownerIds'])if(!Array.isArray(b[k]))b[k]=[];b.progress=[0,1,2,3,4,5].map(i=>b.progress?.[i]||0);b.status=BP_STATUS.includes(b.status)?b.status:'Em defini\u00e7\u00e3o';b.journeyMap=b.journeyMap||{steps:[],assignments:{}};
   let dc=b.cases.find(c=>c.isDefault);if(!dc){dc={uid:b.id+'-default',title:'Padr\u00e3o',ref:'PADR\u00c3O',isDefault:true,profiles:[...RELATIONS],status:'Em defini\u00e7\u00e3o',steps:[]};b.cases.unshift(dc);}
   const caseIds=new Set();for(const c of b.cases){if(!c.uid||caseIds.has(c.uid))return null;caseIds.add(c.uid);c.macroId=b.macroId;c.boardId=b.id;c.isDefault=c===dc;c.profiles=c.isDefault?[...RELATIONS]:(Array.isArray(c.profiles)?c.profiles.filter(p=>RELATIONS.includes(p)):[]);c.steps=Array.isArray(c.steps)?c.steps:[];const stepIds=new Set();for(const s of c.steps){if(!s.uid||stepIds.has(s.uid))return null;stepIds.add(s.uid);s.capabilityIds=Array.isArray(s.capabilityIds)?s.capabilityIds:[];s.featureIds=Array.isArray(s.featureIds)?[...new Set(s.featureIds.filter(id=>MATRIX.items.some(f=>f.id===id)))]:[];if(!BP_PHASES.includes(s.release))s.release='';}}
  }
  for(const m of out.macros){m.boards=out.boards.filter(b=>b.macroId===m.id).map(b=>b.id);m.ownerIds=Array.isArray(m.ownerIds)?m.ownerIds:[];m.status=BP_STATUS.includes(m.status)?m.status:'Em defini\u00e7\u00e3o';}
  return out;
 }
 if(![1,2,3].includes(src.schema))return null;
 const out=clone(INITIAL);out.session={...out.session,...src.session};out.updatedAt=src.updatedAt||'';out.migratedFrom=src.schema;
 out.migrationArchive=clone(src); // No legacy field or decision is discarded.
 out.sharedRecords=[];
 const targets={onboarding:'onboarding',accounts:'banking',payments:'banking',cards:'cards',wealth:'wealth'};
 const initialized=new Set();
 for(const old of src.boards){const target=out.boards.find(b=>b.id===targets[old.id]);if(!target){out.sharedRecords.push(bpReplaceProfiles(clone(old)));continue;}
  if(!initialized.has(target.id)){for(const k of ['offers','asis','blueprint','csd','notes','decisions','decisionHistory','actionPlan'])target[k]=[];target.cases=target.cases.filter(c=>c.isDefault);target.previousContext=[];initialized.add(target.id);}
  target.previousContext.push(bpReplaceProfiles({name:old.name,scope:old.scope,owners:old.owners||[],journeyMap:old.journeyMap||{},summary:old.summary||''}));
  for(const k of ['offers','asis','blueprint','csd','notes','decisions','decisionHistory','actionPlan'])for(const x of old[k]||[]){const rec=bpReplaceProfiles(clone(x));rec.uid=rec.uid||qid();rec.legacyBoard=old.id;if(!target[k].some(a=>a.uid===rec.uid))target[k].push(rec);}
  if(old.id!=='payments'&&old.scope)target.scope=bpReplaceProfiles(clone(old.scope));
  for(const oldc of old.cases||[]){const c=bpReplaceProfiles(clone(oldc));c.uid=c.uid||qid();c.isDefault=false;c.macroId=target.macroId;c.boardId=target.id;c.profiles=Array.isArray(c.profiles)?c.profiles.filter(p=>RELATIONS.includes(p)):[];c.needsReview=true;c.steps=[];c.legacyHorizon=c.horizon||'';c.legacyStatus=c.status;c.status='Em defini\u00e7\u00e3o';
   if(c.flow)for(const n of c.flow.split('\u2192').map(x=>x.trim()).filter(Boolean)){const step=bpBlankStep(n);step.nature='Importado \u00b7 revisar';step.source='Fluxo do caso na vers\u00e3o anterior';c.steps.push(step);}
   target.cases.push(c);
  }
 }
 const banking=out.boards.find(b=>b.id==='banking');if(banking&&banking.previousContext?.length){banking.scope={offerDefinition:'',problem:'',within:'',outside:'',value:''};banking.scopeNeedsReview=true;}
 out.migrationNotes=[...(out.migrationNotes||[]),'JSON anterior reorganizado. O documento original completo permanece no arquivo, em migrationArchive.','Conte\u00fados transversais sem destino inequ\u00edvoco est\u00e3o em Registros preservados.'];
 return out;
}
normalizeState=bpSanitizeState;
function bpFindCase(id){for(const b of state.boards){const c=b.cases.find(x=>x.uid===id);if(c)return {b,c};}return null;}
function bpCurrentCase(b){if(view.bpCase==='standard')return bpDefault(b);return b.cases.find(c=>c.uid===view.bpCase)||null;}
function bpGroups(contextBoard=null){
 const selected=view.bpCase==='standard'?null:bpFindCase(view.bpCase);
 const result=[];for(const m of state.macros){if(!contextBoard&&view.bpMacro!=='all'&&m.id!==view.bpMacro)continue;if(contextBoard&&m.id!==contextBoard.macroId)continue;
  const groups=[];for(const b of state.boards.filter(x=>x.macroId===m.id)){if(contextBoard&&b.id!==contextBoard.id)continue;if(selected&&selected.b.id!==b.id)continue;if(view.bpStatus!=='all'&&b.status!==view.bpStatus)continue;const c=selected?selected.c:bpDefault(b);if(!c)continue;if(view.bpProfile!=='all'&&!c.profiles.includes(view.bpProfile))continue;
   const steps=c.steps.filter(s=>(view.bpRelease==='all'||(view.bpRelease==='none'?!s.release:s.release===view.bpRelease)));
   if(!steps.length&&view.bpRelease!=='all')continue;
   groups.push({b,c,steps:steps.length?steps:[{uid:'placeholder-'+b.id,name:'Etapas a definir',placeholder:true}]});
  }if(groups.length)result.push({m,groups});
 }return result;
}
function bpCoverage(b,includeVariants=false){let steps=(includeVariants?b.cases:[bpDefault(b)]).filter(Boolean).flatMap(c=>c.steps).filter(s=>s.status!=='Desativado');let done=0;for(const s of steps){done+=[bpMeaningful(s.actor),bpMeaningful(s.channel),bpMeaningful(s.operationOwner)&&bpMeaningful(s.operationRole),bpMeaningful(s.system),s.capabilityIds.length>0||bpMeaningful(s.capabilityNotes),bpMeaningful(s.support)].filter(Boolean).length;}return {done,total:steps.length*6,steps:steps.length,ratio:steps.length?Math.round(done/(steps.length*6)*100):0};}
const bpV8Completion=completion;
completion=function(b){try{const x=bpV8Completion(b);x.ratio=bpCoverage(b).ratio;return x;}catch(e){return {ratio:bpCoverage(b).ratio,perStep:[0,0,0,0,0,0]};}};
printOwners=function(b){const own=bpNames(b.ownerIds);return (own.length?own:bpNames(bpMacro(b.macroId)?.ownerIds)).join(' / ')||'A definir';};
function bpCapacityOwners(capId,b){const scoped=state.responsibilities.filter(r=>r.capabilityId===capId&&r.context==='board:'+b.id);const rows=scoped.length?scoped:state.responsibilities.filter(r=>r.capabilityId===capId&&r.context==='macro:'+b.macroId);return [...new Set(rows.flatMap(r=>bpNames(r.personIds)))].join(' / ');}
function bpUpdateOwners(){for(const b of state.boards){const own=bpNames(b.ownerIds);b.owners=own.length?own:bpNames(bpMacro(b.macroId)?.ownerIds);}}
function bpRoute(f){return state.featureRouting[f.id]||{boardId:'',macroId:''};}
featureBoardId=function(f){return bpRoute(f).boardId;};
mapItemsFor=function(b){return MATRIX.items.filter(f=>bpRoute(f).boardId===b.id);};
function bpSourceSteps(f){const b=boardBy(bpRoute(f).boardId);return b?(bpDefault(b)?.steps||[]).filter(s=>s.featureIds.includes(f.id)):[];}
function bpScopeCaseOptions(b=null){const rows=[['standard','Padr\u00e3o']];for(const board of (b?[b]:state.boards)){if(!b&&view.bpMacro!=='all'&&board.macroId!==view.bpMacro)continue;for(const c of board.cases){if(c.isDefault||!c.profiles.length)continue;if(view.bpProfile!=='all'&&!c.profiles.includes(view.bpProfile)&&view.bpCase!==c.uid)continue;rows.push([c.uid,(b?'':board.name+' \u00b7 ')+c.title]);}}return rows;}
function bpNavItem(text,page,icon){return `<button class="nav-btn ${view.page===page?'active':''}" data-action="navigate" data-page="${page}"><span class="bp-nav-icon">${icon}</span><span class="navtxt">${text}</span></button>`;}
sidebar=function(){return `<aside class="sidebar"><div class="nav-caption">Workspace</div>${bpNavItem('Vis\u00e3o geral','overview','\u25a6')}${bpNavItem('Acompanhamento','tracker','\u25d4')}${bpNavItem('Launch Timeline','launch','\u2197')}${bpNavItem('Funcionalidades','catalog','\u2637')}${bpNavItem('Cadastros e respons\u00e1veis','registry','\u25ce')}<div class="nav-caption">Frentes de trabalho</div>${state.macros.map((m,i)=>m.id==='usage'?`<div class="bp-nav-group"><button class="nav-btn ${view.page==='macro'?'active':''}" data-action="bp-open-macro" data-id="${m.id}"><span class="num">0${i+1}</span><span class="navtxt">${esc(m.short)}<span class="tinyline">${esc(m.status)}</span></span></button><div class="bp-nav-children">${state.boards.filter(b=>b.macroId===m.id).map(b=>`<button class="nav-btn ${view.page==='board'&&view.boardId===b.id?'active':''} ${!bpActive(b)?'bp-muted-nav':''}" data-action="bp-open-front" data-id="${esc(b.id)}"><span class="bp-nav-dot"></span><span class="navtxt">${esc(b.name)}<span class="tinyline">${esc(b.status)}</span></span></button>`).join('')}</div></div>`:`<button class="nav-btn ${view.page==='board'&&view.boardId===m.boards[0]?'active':''} ${m.status==='N\u00e3o priorizado'||m.status==='Desativado'?'bp-muted-nav':''}" data-action="bp-open-front" data-id="${esc(m.boards[0])}"><span class="num">0${i+1}</span><span class="navtxt">${esc(m.short)}<span class="tinyline">${esc(m.status)}</span></span></button>`).join('')}<div class="sidebar-end">Uma base. Duas escalas.<br>O preenchimento das frentes comp\u00f5e a vis\u00e3o geral.${bpBtn('Registros preservados','archive','','tiny')}</div></aside>`;};
function bpFilters(b=null){return `<div class="bp-toolbar"><div class="bp-filters">${!b?`<label>Macroprocesso<select id="bp-macro">${bpOptions([['all','Todos os macroprocessos'],...state.macros.map(m=>[m.id,m.short])],view.bpMacro)}</select></label>`:''}<label>Caso de uso<select id="bp-case">${bpOptions(bpScopeCaseOptions(b),view.bpCase)}</select></label><label>Perfil<select id="bp-profile">${bpOptions([['all','Todos os perfis'],...RELATIONS],view.bpProfile)}</select></label><label>Marco da etapa<select id="bp-release">${bpOptions([['all','Todos os marcos'],...BP_PHASES,['none','Sem marco atribu\u00eddo']],view.bpRelease)}</select></label>${!b?`<label>Status da frente<select id="bp-status">${bpOptions([['all','Todos os status'],...BP_STATUS],view.bpStatus)}</select></label>`:''}</div><div class="bp-filter-actions">${bpBtn('Limpar filtros','clear','','tiny')}${bpBtn('+ Caso de uso','new-case',b?`data-board="${b.id}"`:'','dark')}</div></div>`;}
function bpIntroCounts(){return `<div class="bp-count-strip"><span><strong>${state.macros.length}</strong> macroprocessos</span><span><strong>${state.boards.length}</strong> frentes</span><span><strong>${state.boards.reduce((n,b)=>n+b.cases.filter(c=>!c.isDefault).length,0)}</strong> casos espec\u00edficos</span><span><strong>${MATRIX.items.length}</strong> funcionalidades preservadas</span></div>`;}
overview=function(){return `<div class="workspace bp-wide"><section class="bp-hero"><div class="eyebrow">Ita\u00fa Private Bank \u00b7 De Novo</div><h1>Novas jornadas <em>Offshore</em></h1></section><section class="bp-home-map"><div class="bp-section-title"><div><h2>Blueprint do Offshore</h2></div>${bpBtn('Como preencher','help','','')}</div>${bpFilters()}<div class="bp-jumps">${state.macros.map(m=>bpBtn(m.short,'jump-macro',`data-id="${m.id}"`,'tiny')).join('')}<label class="bp-density">Colunas <select id="bp-density">${bpOptions([['compact','Compactas'],['comfortable','Confort\u00e1veis']],view.bpDensity)}</select></label></div>${bpRenderMatrix(null)}<div class="bp-context-note"><strong>Constru\u00eddo nas frentes.</strong> Clique em um macroprocesso ou produto para detalhar. As colunas seguem as etapas do processo; o cabe\u00e7alho agrupa todas as etapas de cada macroprocesso. Campos vazios significam que o workshop ainda precisa defini-los.</div></section><details class="bp-source-note"><summary>Sobre o ponto de partida e a classifica\u00e7\u00e3o</summary><p>KYC, Convite e Abertura, assim como Cash in, Cash out e Cart\u00e3o de d\u00e9bito, seguem a estrutura fornecida. As demais etapas organizam as funcionalidades existentes e est\u00e3o marcadas como propostas. Nenhum canal, ator, sistema, capacidade ou marco foi aprovado automaticamente. Respons\u00e1veis anteriores est\u00e3o dispon\u00edveis no cadastro, sem v\u00ednculos presumidos.</p><p>Prospec\u00e7\u00e3o, Cr\u00e9dito e Mortgage come\u00e7am como n\u00e3o priorizados, com status edit\u00e1vel. Desativar um item n\u00e3o apaga o conte\u00fado.</p></details><div class="bp-footer-links">${bpBtn('Ver cat\u00e1logo funcional','catalog','','')}${btn('Abrir Launch Timeline','navigate','data-page="launch"','')}${bpBtn('Cadastrar respons\u00e1veis','registry','','')}</div></div>`;};
function bpLaneContent(s,key,b){if(s.placeholder)return `<span class="bp-empty">A preencher</span>`;if(key==='operation'){if(!s.operationOwner&&!s.operationRole)return `<span class="bp-empty">Opera\u00e7\u00e3o e papel a definir</span>`;return `${s.operationOwner?`<strong class="bp-op-owner">${esc(s.operationOwner)}</strong>`:''}${s.operationRole?`<span>${nl(s.operationRole)}</span>`:''}`;}if(key==='capabilities'){const caps=s.capabilityIds.map(id=>bpCap(id)).filter(Boolean);return `${caps.map(c=>`<span class="bp-cap-item"><strong>${esc(c.name)}</strong>${bpCapacityOwners(c.id,b)?`<small>${esc(bpCapacityOwners(c.id,b))}</small>`:''}</span>`).join('')}${s.capabilityNotes?`<span>${nl(s.capabilityNotes)}</span>`:''}${!caps.length&&!s.capabilityNotes?'<span class="bp-empty">Capacidades a vincular</span>':''}`;}return s[key]?nl(s[key]):`<span class="bp-empty">${key==='support'?'Suporte a definir':'A preencher'}</span>`;}
function bpRenderMatrix(contextBoard){
 const grouped=bpGroups(contextBoard),flat=grouped.flatMap(x=>x.groups.flatMap(g=>g.steps.map(s=>({...g,s,macro:x.m}))));
 if(!flat.length)return `<div class="bp-no-results"><h3>Nenhuma etapa com estes filtros</h3><p>O caso selecionado pode n\u00e3o atender ao perfil, ou ainda n\u00e3o ter etapas no marco escolhido. O padr\u00e3o n\u00e3o substitui uma variante silenciosamente.</p>${bpBtn('Limpar filtros','clear','','dark')}</div>`;
 let col=2,html=`<div class="bp-cell bp-label bp-macro-label" style="grid-column:1;grid-row:1">Macroprocessos</div>`;
 for(const {m,groups} of grouped){const span=groups.reduce((n,g)=>n+g.steps.length,0);html+=`<div class="bp-cell bp-macro ${m.status==='Desativado'||m.status==='N\u00e3o priorizado'?'is-muted':''}" data-macro="${m.id}" style="grid-column:${col}/span ${span};grid-row:1"><button data-action="${m.id==='usage'?'bp-open-macro':'bp-open-front'}" data-id="${m.id==='usage'?'usage':m.boards[0]}"><span>${esc(m.name)}</span><small>${esc(bpNames(m.ownerIds).join(' / ')||'Respons\u00e1vel a definir')}</small></button>${bpBtn(m.status,'edit-macro',`data-id="${m.id}"`,'tiny')}</div>`;col+=span;}
 html+=`<div class="bp-cell bp-label" style="grid-row:2;grid-column:1">Contexto / produto</div>`;col=2;
 for(const {m,groups} of grouped)for(const {b,c,steps} of groups){
  const homeCase=view.page==='overview'&&!contextBoard;
  const caseOptions=b.cases.map(cc=>[cc.uid,cc.isDefault?'Caso padr\u00e3o':cc.title]);
  const currentUid=c.uid;
  html+=`<div class="bp-cell bp-product ${!bpActive(b)?'is-muted':''}" style="grid-column:${col}/span ${steps.length};grid-row:2"><div class="v13-product-case-wrap">${m.id==='usage'?`<button type="button" data-action="bp-open-front" data-id="${b.id}" class="bp-product-title">${esc(b.name)} <span>\u2197</span></button>`:''}<div class="v13-select-line">${homeCase?`<select class="v13-case-select" data-v13-home-case="${b.id}" aria-label="Caso de uso de ${esc(b.name)}">${bpOptions(caseOptions,currentUid)}</select>`:`<span class="bp-product-title">${esc(m.id==='usage'?c.title:c.isDefault?'Caso padr\u00e3o':c.title)}</span>`}${m.id!=='usage'?`<button type="button" class="v13-front-link" data-action="bp-open-front" data-id="${b.id}" aria-label="Abrir ${esc(b.name)}">\u2197</button>`:''}</div>${!homeCase?`<span class="bp-product-sub">${esc(b.status)}</span>`:''}</div></div>`;
  col+=steps.length;
 }
 html+=`<div class="bp-cell bp-label" style="grid-row:3;grid-column:1">Etapas do processo</div>`;
 for(let i=0;i<flat.length;i++){const {b,c,s}=flat[i];html+=`<div class="bp-cell bp-step-head ${s.status==='Desativado'?'is-muted':''}" style="grid-column:${i+2};grid-row:3"><div class="bp-step-count">${String(c.steps.indexOf(s)+1||1).padStart(2,'0')}${s.placeholder?'':`${v10PhaseBadge(s.release||'A definir')}`}</div><button data-action="${contextBoard?'bp-edit-stage':'bp-stage-focus'}" data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}" ${s.placeholder?'disabled':''}>${esc(s.name)}</button>${!s.placeholder?`<div class="bp-step-bottom"><span>${esc(s.nature==='Proposta de classifica\u00e7\u00e3o'?'Proposta':s.status)}</span>${contextBoard?`<span class="bp-order">${bpBtn('\u2190','move-stage',`data-id="${s.uid}" data-dir="-1" aria-label="Mover etapa para a esquerda"`,'tiny')}${bpBtn('\u2192','move-stage',`data-id="${s.uid}" data-dir="1" aria-label="Mover etapa para a direita"`,'tiny')}</span>`:''}</div>${contextBoard?`<div class="v10-step-actions">${bpBtn('Editar','edit-stage',`data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}"`,'tiny')}${bpBtn('Excluir','delete-stage',`data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}"`,'tiny warn')}</div>`:''}`:contextBoard?bpBtn('+ Etapa','new-stage',`data-board="${b.id}"`,'tiny'):''}</div>`;}
 BP_LANES.forEach(([key,label,hint],ri)=>{const row=4+ri;html+=`<div class="bp-cell bp-label" style="grid-column:1;grid-row:${row}"><strong>${label}</strong><small>${hint}</small></div>`;flat.forEach(({b,c,s},i)=>{html+=`<button class="bp-cell bp-value ${s.placeholder?'is-placeholder':''} ${!bpActive(b)||s.status==='Desativado'?'is-muted':''}" style="grid-column:${i+2};grid-row:${row}" data-action="${contextBoard?'bp-edit-stage':'bp-stage-focus'}" data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}" data-field="${key}" ${s.placeholder?'disabled':''} aria-label="${esc(label+' da etapa '+s.name)}"><div>${bpLaneContent(s,key,b)}</div>${contextBoard&&!s.placeholder?'<span class="bp-cell-edit">Editar</span>':''}</button>`;});});
 if(contextBoard){html+=`<div class="bp-cell bp-label" style="grid-column:1;grid-row:${4+BP_LANES.length}"><strong>Funcionalidades</strong><small>Refer\u00eancias da matriz RFI</small></div>`;flat.forEach(({b,c,s},i)=>{const fs=(s.featureIds||[]).map(id=>MATRIX.items.find(f=>f.id===id)).filter(Boolean);html+=`<div class="bp-cell bp-functional" style="grid-column:${i+2};grid-row:${4+BP_LANES.length}"><details class="bp-feature-stack"><summary>${fs.length} funcionalidades</summary>${fs.map(f=>`<button data-action="feature-details" data-feature="${f.id}" class="bp-fref v12-fref" style="${v10PhaseStyle(v10FeatureRelease(f))}"><span class="v12-fid">${f.id}</span><span class="v13-fref-title">${esc(f.funcionalidade)}</span><span class="v13-fref-divider">Etapa: ${esc(s.name)}</span><span class="v13-fref-details">${v10PhaseBadge(v10FeatureRelease(f))}</span></button>`).join('')}</details>${s.placeholder?'':bpBtn('Vincular funcionalidades','edit-stage',`data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}" data-field="features"`,'tiny')}</div>`;});}
 return `<div class="bp-scroll-hint"><span>\u2194 Deslize para percorrer as etapas</span><span>${flat.filter(x=>!x.s.placeholder).length} etapas exibidas \u00b7 cada coluna \u00e9 uma etapa</span></div><div class="bp-scroll" tabindex="0" role="region" aria-label="Blueprint ${contextBoard?esc(contextBoard.name):'do Offshore'}"><div class="bp-grid ${view.bpDensity==='comfortable'?'bp-comfortable':''}" style="--bp-cols:${flat.length}">${html}</div></div>`;
}
function bpOpenFront(id,caseId=null){id=bpAlias(id);const b=boardBy(id);if(!b)return;view.page='board';view.boardId=id;view.step=-1;view.guideOpen=false;view.bpCase=caseId||'standard';view.bpStatus='all';view.search='';render();goTop();}
function bpBoardMap(b){const c=bpCurrentCase(b);const ids=new Set((c?.steps||[]).flatMap(s=>s.featureIds));const unlinked=mapItemsFor(b).filter(f=>!ids.has(f.id));return `<section class="bp-board-blueprint"><div class="bp-section-title"><div><span class="micro">BLUEPRINT DA FRENTE</span><h2>${esc(c?.isDefault?'Jornada padr\u00e3o':c?.title||'Selecione um caso')}</h2><p>Ator, canal, opera\u00e7\u00e3o, sistema, capacidades e atendimento, etapa por etapa.</p></div><div class="row-actions">${bpBtn('+ Etapa','new-stage',`data-board="${b.id}"`,'dark')}${bpBtn('Copiar etapas','copy',`data-board="${b.id}"`)}</div></div>${bpFilters(b)}${c?`<div class="bp-case-context">${pill('Macroprocesso: '+bpMacroLabel(b),'outline')}${bpTag(c.status)}${pill(c.isDefault?'Padr\u00e3o \u00b7 base de refer\u00eancia':c.profiles.join(' / ')||'Perfil a definir',c.isDefault?'':'orange')}${bpBtn('Editar caso','edit-case',`data-case="${c.uid}" data-board="${b.id}"`,'tiny')}${c.isDefault?'<small>O padr\u00e3o n\u00e3o define elegibilidade da oferta.</small>':''}</div>`:''}${bpRenderMatrix(b)}<div class="bp-map-footer"><span>Marco da etapa \u2260 marco do produto na RFI. As datas do programa n\u00e3o foram presumidas.</span>${bpBtn('Guia de preenchimento','help','','tiny')}</div>${unlinked.length?`<details class="bp-source-note"><summary>${unlinked.length} funcionalidades da frente sem etapa neste caso</summary><div class="bp-unlinked">${unlinked.map(f=>`<button data-action="feature-details" data-feature="${f.id}" class="bp-unlinked-row"><span>${f.id}</span><strong>${esc(f.funcionalidade)}</strong><small>${esc(v10FeatureRelease(f))}</small></button>`).join('')}</div></details>`:''}</section>`;}
renderJourneyMap=bpBoardMap;
stageNav=function(){return `<nav class="stage-nav" aria-label="Se\u00e7\u00f5es da frente"><button class="stage-tab map-tab ${view.step===-1?'active':''}" data-action="step" data-index="-1"><span class="stage-index">\u25a6</span><span>Blueprint</span></button>${STAGES.map((s,i)=>`<button class="stage-tab ${view.step===i?'active':''}" data-action="step" data-index="${i}"><span class="stage-index">${i+1}</span><span>${esc(s.short)}</span></button>`).join('')}</nav>`;};
const bpV8Board=boardView;
boardView=function(){const b=activeBoard(),c=completion(b);return `<div class="workspace bp-wide"><div class="crumb"><button data-action="navigate" data-page="overview">Vis\u00e3o geral</button><span>\u203a</span><span>${esc(bpMacroLabel(b))}</span>${b.macroId==='usage'?`<span>\u203a</span><span>${esc(b.name)}</span>`:''}</div><div class="board-hero"><div class="board-head"><div><div class="eyebrow">${b.macroId==='usage'?'PRODUTO':'MACROPROCESSO'}</div><h1>${esc(b.name)}</h1><p>${esc(b.summary)}</p><div class="board-meta">${bpTag(b.status)}${pill('Respons\u00e1vel: '+printOwners(b),'outline')}${pill(openTasks(b).length+' d\u00favidas abertas')}${pill(finalDecisions(b).length+' decis\u00f5es finais','green')}${bpBtn('Editar frente','edit-front',`data-board="${b.id}"`,'tiny')}</div></div><div class="board-summary"><div class="micro">BLUEPRINT PADR\u00c3O</div><div class="big">${bpCoverage(b).ratio}%</div><div class="mini-progress"><i style="width:${bpCoverage(b).ratio}%"></i></div><div class="small">${bpCoverage(b).done}/${bpCoverage(b).total} campos preenchidos</div></div></div></div>${!bpActive(b)?'<div class="bp-inactive-banner">Esta frente est\u00e1 fora do c\u00e1lculo de avan\u00e7o do ciclo. O conte\u00fado permanece acess\u00edvel e pode ser editado ou priorizado.</div>':''}${stageNav(b)}${view.step===-1?bpBoardMap(b):`<div class="section-block"><div class="stage-intro"><div><div class="eyebrow">ETAPA ${view.step+1} / 6</div><h2>${esc(STAGES[view.step].name)}</h2><p>${esc(STAGES[view.step].description)}</p></div><div class="stage-state"><label for="stage-progress">Valida\u00e7\u00e3o do bloco</label><select id="stage-progress">${bpOptions([['0','A iniciar'],['1','Em constru\u00e7\u00e3o'],['2','Validado']],String(b.progress[view.step]||0))}</select></div></div>${[stageScope,stageASIS,stageCases,stageExperience,stageCSD,renderActionPlan][view.step](b)}${stageNotes(b)}<div class="stage-bottom">${btn('\u2190 Anterior','prev-step',view.step===0?'disabled':'')}<span>${validated(b)}/5 blocos validados</span>${view.step===5?btn('Acompanhamento','navigate','data-page="tracker"','dark'):btn('Pr\u00f3ximo \u2192','next-step','','dark')}</div></div>${guide(b)}`}</div>`;};
STAGES[2].description='Cada caso pertence a um macroprocesso e pode ter etapas pr\u00f3prias. Cadastre o perfil e reaproveite etapas do padr\u00e3o ou de outro caso.';
STAGES[2].questions=['Qual \u00e9 a situa\u00e7\u00e3o e o perfil?','Quais etapas mudam em rela\u00e7\u00e3o ao padr\u00e3o?','Em qual marco cada etapa precisa existir?'];
STAGES[3].description='A experi\u00eancia utiliza a mesma blueprint da frente. N\u00e3o h\u00e1 um segundo mapa para manter.';
stageCases=function(b){return `<section class="canvas-card">${cardHeading('Casos de uso da frente','Todo caso est\u00e1 vinculado a '+bpMacroLabel(b)+'. As etapas podem variar por perfil.',bpBtn('+ Caso de uso','new-case',`data-board="${b.id}"`,'dark'))}<div class="bp-case-list">${b.cases.map(c=>`<article class="bp-case-card"><div class="bp-case-head"><div>${pill(c.isDefault?'PADR\u00c3O':c.ref||'CASO ESPEC\u00cdFICO',c.isDefault?'orange':'outline')}<h3>${esc(c.title)}</h3><p>${esc(c.need||'Necessidade a detalhar')}</p></div>${bpTag(c.status)}${pill(c.steps.length+' etapas')}</div><div class="tags">${c.isDefault?pill('Base de refer\u00eancia'):c.profiles.map(p=>pill(p,'outline')).join('')}${!c.isDefault&&!c.profiles.length?pill('Perfil a definir','red'):''}${c.needsReview?pill('Importado \u00b7 revisar','outline'):''}</div>${c.trigger||c.result?`<p class="bp-case-detail"><strong>Gatilho:</strong> ${esc(c.trigger||'A definir')}<br><strong>Resultado:</strong> ${esc(c.result||'A definir')}</p>`:''}<div class="bp-case-actions">${bpBtn(!c.isDefault&&!c.profiles.length?'Definir perfil':'Abrir blueprint',!c.isDefault&&!c.profiles.length?'edit-case':'open-case',`data-board="${b.id}" data-case="${c.uid}"`,'dark')}${bpBtn('Editar','edit-case',`data-board="${b.id}" data-case="${c.uid}"`)}${bpBtn('Copiar etapas deste caso','new-case',`data-board="${b.id}" data-source="${c.uid}"`)}${!c.isDefault?bpBtn('Excluir','delete-case',`data-board="${b.id}" data-case="${c.uid}"`,'ghost'):''}</div></article>`).join('')}</div></section>`;};
stageExperience=function(b){return bpBoardMap(b)+(b.blueprint.length?`<details class="bp-source-note"><summary>Anota\u00e7\u00f5es anteriores de experi\u00eancia (${b.blueprint.length})</summary><p>Conte\u00fado preservado como refer\u00eancia. N\u00e3o alimenta automaticamente as novas linhas da blueprint.</p>${b.blueprint.map(x=>`<article class="bp-archive-item"><h4>${esc(x.moment)}</h4><p>${nl(x.client||'')}</p><p><strong>Comercial:</strong> ${nl(x.commercial||'')}</p><p><strong>Opera\u00e7\u00e3o:</strong> ${nl(x.operations||'')}</p><p><strong>Sistemas:</strong> ${nl(x.systems||'')}</p>${actEdit('blueprint',x.uid)}</article>`).join('')}</details>`:'');};
function bpCatalog(){const rows=MATRIX.items.filter(f=>{const r=bpRoute(f);return(view.catalogMacro==='all'||r.macroId===view.catalogMacro)&&(view.catalogBoard==='all'||r.boardId===view.catalogBoard)&&(view.catalogAudience==='all'||f.publico===view.catalogAudience)&&(view.catalogRelease==='all'||(view.catalogRelease==='Day-1'?v10FeatureRelease(f).includes('Day-1'):v10FeatureRelease(f)===view.catalogRelease));});return `<div class="workspace bp-wide"><section class="bp-hero"><div class="eyebrow">Fonte RFI + DeNovo</div><h1>Cat\u00e1logo de <em>funcionalidades</em></h1><p>O invent\u00e1rio original reclassificado por macroprocesso, frente e etapa padr\u00e3o. Os requisitos n\u00e3o foram reescritos.</p></section><div class="bp-toolbar"><div class="bp-filters"><label>Macroprocesso<select id="catalog-macro">${bpOptions([['all','Todos'],...state.macros.map(m=>[m.id,m.short])],view.catalogMacro)}</select></label><label>Frente<select id="catalog-board">${bpOptions([['all','Todas'],...state.boards.map(b=>[b.id,b.name])],view.catalogBoard)}</select></label><label>P\u00fablico<select id="catalog-audience">${bpOptions([['all','Todos'],...MAP_AUDIENCES],view.catalogAudience)}</select></label><label>Marco na fonte<select id="catalog-release">${bpOptions([['all','Todos'],...BP_PHASES,'Sem fase definida'],view.catalogRelease)}</select></label></div><label class="bp-search-label">Buscar<input id="catalog-search" value="${esc(view.catalogSearch)}" placeholder="Nome, ID, requisito RFI..."></label></div><div class="bp-context-note"><strong>${rows.length} de ${MATRIX.items.length} funcionalidades</strong> \u00b7 Classifica\u00e7\u00e3o inicial proposta para valida\u00e7\u00e3o no workshop. Marco do produto n\u00e3o confirma entrega no canal.</div><div class="bp-catalog-list">${rows.map(f=>{const r=bpRoute(f),b=boardBy(r.boardId),m=bpMacro(r.macroId),steps=bpSourceSteps(f);return `<button class="bp-catalog-row" data-action="feature-details" data-feature="${f.id}" data-query="${esc([f.id,f.funcionalidade,f.rfi_ids,b?.name,...steps.map(s=>s.name)].join(' ').toLowerCase())}" ${view.catalogSearch&&![f.id,f.funcionalidade,f.rfi_ids,b?.name,...steps.map(s=>s.name)].join(' ').toLowerCase().includes(view.catalogSearch.toLowerCase())?'hidden':''}><span class="bp-fid">${f.id}</span><div class="bp-catalog-body"><span class="micro">${esc(m?.short||'A classificar')} \u00b7 ${esc(b?.name||'Frente a definir')}</span><h3>${esc(f.funcionalidade)}</h3><p>Etapa: ${esc(steps.map(s=>s.name).join(' / ')||'Ainda n\u00e3o vinculada ao padr\u00e3o')}</p><div class="tags">${pill(f.publico,'outline')}${v10PhaseBadge(v10FeatureRelease(f))}${pill(f.status_vendor,statusColor(f.status_vendor))}</div></div><span class="bp-open-arrow">\u2197</span></button>`}).join('')}</div><div class="bp-context-note">85 funcionalidades de experi\u00eancia no arquivo fornecido. A refer\u00eancia a 105 requisitos da RFI n\u00e3o equivale a 105 funcionalidades nesta matriz.</div></div>`;}
featureModal=function(id){const f=MATRIX.items.find(x=>x.id===id);if(!f)return;const r=bpRoute(f),b=boardBy(r.boardId);document.getElementById('feature-layer')?.remove();const el=document.createElement('div');el.className='modal-layer';el.id='feature-layer';el.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="feature-title"><div class="modal-head"><div><div class="micro">${esc(f.id)} \u00b7 FUNCIONALIDADE ORIGINAL</div><h2 id="feature-title">${esc(f.funcionalidade)}</h2></div><button class="modal-close" data-action="close-feature" aria-label="Fechar">\u00d7</button></div><div class="bp-feature-body"><div class="tags">${pill(f.publico,'outline')}${v10PhaseBadge(v10FeatureRelease(f))}${pill(f.status_vendor,statusColor(f.status_vendor))}</div><dl class="bp-detail-dl"><dt>Classifica\u00e7\u00e3o atual</dt><dd>${esc(bpMacro(r.macroId)?.name||'A definir')} \u203a ${esc(b?.name||'A definir')}</dd><dt>Etapas no caso padr\u00e3o</dt><dd>${esc(bpSourceSteps(f).map(s=>s.name).join(' / ')||'Sem etapa atribu\u00edda')}</dd><dt>Marco na fonte original</dt><dd>${esc(f.marco_produto)}${Object.hasOwn(r,'release')?`<br><small>Marco revisto no workshop: ${esc(r.release)}${r.releaseReason?' \u00b7 '+esc(r.releaseReason):''}</small>`:''}</dd><dt>Natureza da classifica\u00e7\u00e3o</dt><dd>${esc(r.status||'Proposta')}</dd><dt>Contexto e depend\u00eancias</dt><dd>${nl(f.observacao)}</dd><dt>Requisitos RFI</dt><dd>${esc(f.rfi_ids||'Sem ID diretamente atribu\u00edvel')}</dd><dt>Natureza / expectativa UX</dt><dd>${esc(f.natureza)} \u00b7 ${esc(f.expectativa_ux)}</dd><dt>Classifica\u00e7\u00e3o no arquivo original</dt><dd>${esc(f.jornada)} \u00b7 ${esc(f.subjornada)}</dd><dt>Fontes</dt><dd>${esc(f.fonte_rfi)}<br>${esc(f.fonte_timeline)}</dd></dl><p class="bp-context-note">Cobertura t\u00e9cnica declarada n\u00e3o \u00e9 escopo digital aprovado. As informa\u00e7\u00f5es da fonte permanecem preservadas.</p><div class="modal-foot">${bpBtn('Reclassificar','reclassify',`data-feature="${f.id}"`)}${b?bpBtn('Abrir blueprint da frente','feature-front',`data-id="${b.id}"`,'dark'):''}</div></div></div>`;document.body.append(el);el.querySelector('.modal-close').focus();};
tracker=function(){const active=state.boards.filter(bpActive),covs=active.map(b=>bpCoverage(b)),total=covs.reduce((n,x)=>n+x.total,0),done=covs.reduce((n,x)=>n+x.done,0);let boards=state.boards.filter(b=>view.ownerFilter==='Todos'||b.owners.includes(view.ownerFilter)||state.responsibilities.some(r=>(r.context==='board:'+b.id||r.context==='macro:'+b.macroId)&&bpNames(r.personIds).includes(view.ownerFilter)));const ownerNames=[...new Set(state.people.map(p=>p.name))];return `<div class="workspace bp-wide"><section class="bp-hero"><div class="eyebrow">Vis\u00e3o transversal</div><h1>Acompanhamento</h1><p>Preenchimento da blueprint, valida\u00e7\u00f5es e pend\u00eancias. Ter conte\u00fado n\u00e3o significa ter uma decis\u00e3o aprovada.</p></section><div class="bp-stat-grid"><div><strong>${total?Math.round(done/total*100):0}%</strong><span>blueprint padr\u00e3o preenchida</span><small>${done}/${total} campos das frentes no ciclo</small></div><div><strong>${active.length}/${state.boards.length}</strong><span>frentes no ciclo</span><small>N\u00e3o priorizadas e desativadas ficam fora do total</small></div><div><strong>${active.reduce((n,b)=>n+finalDecisions(b).length,0)}</strong><span>decis\u00f5es finais</span><small>Registradas nas frentes ativas</small></div><div><strong>${active.reduce((n,b)=>n+openTasks(b).length,0)}</strong><span>d\u00favidas abertas</span><small>Quest\u00f5es ainda sem resolu\u00e7\u00e3o</small></div></div><div class="bp-table-head"><div><h2>Avan\u00e7o por frente</h2><p>Sete dimensões e o objetivo do processo: oito verificações por etapa. Operação exige área e papel; dados exigem fornecedor ou dispensa explícita.</p></div><label>Respons\u00e1vel<select id="owner-filter">${bpOptions(['Todos',...ownerNames],view.ownerFilter)}</select></label></div><div class="bp-table-scroll"><table class="bp-track-table"><thead><tr><th>Macroprocesso / frente</th><th>Respons\u00e1veis</th><th>Status</th><th>Blueprint padr\u00e3o</th><th>Casos espec\u00edficos</th><th>Blocos validados</th><th>D\u00favidas</th><th>A\u00e7\u00f5es</th></tr></thead><tbody>${boards.map(b=>{const cov=bpCoverage(b),actions=b.actionPlan||[];return `<tr class="${!bpActive(b)?'bp-row-muted':''}"><td><small>${esc(bpMacro(b.macroId)?.short)}</small><button data-action="bp-open-front" data-id="${b.id}">${esc(b.name)} \u2197</button></td><td>${esc(printOwners(b))}</td><td>${bpTag(b.status)}</td><td><strong>${cov.ratio}%</strong><div class="mini-progress"><i style="width:${cov.ratio}%"></i></div><small>${cov.done}/${cov.total} campos \u00b7 ${cov.steps} etapas</small></td><td>${b.cases.filter(c=>!c.isDefault).length}</td><td>${validated(b)}/5</td><td>${openTasks(b).length}</td><td>${actions.filter(a=>a.status==='Conclu\u00edda').length}/${actions.length}</td></tr>`}).join('')}</tbody></table></div><div class="bp-context-note"><strong>Regra de leitura:</strong> os campos da blueprint padr\u00e3o alimentam a cobertura. A valida\u00e7\u00e3o dos cinco blocos continua manual. O status da frente pode ser alterado sem apagar dados.</div><div class="bp-table-head"><h2>Responsabilidades por capacidade</h2>${bpBtn('Gerenciar v\u00ednculos','registry','','')}</div>${bpResponsibilityList()}<details class="bp-source-note"><summary>Casos que precisam de revis\u00e3o</summary>${state.boards.flatMap(b=>b.cases.filter(c=>!c.isDefault&&(!c.profiles.length||c.needsReview)).map(c=>`<div class="bp-review-row"><div><strong>${esc(c.title)}</strong><small>${esc(b.name)} \u00b7 ${c.profiles.length?'Estrutura importada':'Perfil pendente'}</small></div>${bpBtn('Revisar','edit-case',`data-board="${b.id}" data-case="${c.uid}"`,'tiny')}</div>`)).join('')||'<p>Nenhum caso pendente de revis\u00e3o.</p>'}</details></div>`;};
function bpContextLabel(ctx){const [kind,id]=(ctx||'').split(':');return kind==='macro'?'Macroprocesso: '+(bpMacro(id)?.short||id):'Frente: '+(boardBy(id)?.name||id);}
function bpResponsibilityList(){return state.responsibilities.length?`<div class="bp-resp-list">${state.responsibilities.map(r=>`<article class="bp-review-row"><div><strong>${esc(bpCap(r.capabilityId)?.name||'Capacidade n\u00e3o encontrada')}</strong><small>${esc(bpContextLabel(r.context))} \u00b7 ${esc(bpNames(r.personIds).join(' / ')||'Sem respons\u00e1vel')}</small><p>${esc(r.role||'Papel a detalhar')}</p></div>${bpBtn('Editar','edit-assignment',`data-id="${r.uid}"`,'tiny')}</article>`).join('')}</div>`:`<div class="bp-empty-panel">Nenhum respons\u00e1vel por capacidade foi vinculado. Cadastre as pessoas e atribua cada capacidade ao contexto correto, sem confundir isso com o ator da etapa.</div>`;}
function bpRegistry(){return `<div class="workspace"><section class="bp-hero"><div class="eyebrow">Governan\u00e7a do workshop</div><h1>Cadastros e <em>respons\u00e1veis</em></h1><p>Uma pessoa pode responder por um macroprocesso, por uma frente ou por uma capacidade naquele contexto.</p></section><div class="bp-registry-tabs">${[['people','Pessoas'],['processes','Processos e frentes'],['capabilities','Capacidades e v\u00ednculos']].map(([id,title])=>bpBtn(title,'registry-tab',`data-id="${id}"`,view.registryTab===id?'dark':'')).join('')}</div>${view.registryTab==='people'?`<section class="canvas-card">${cardHeading('Pessoas','Os nomes herdados s\u00e3o refer\u00eancias do workspace anterior. Nenhum v\u00ednculo foi presumido.',bpBtn('+ Pessoa','new-person','','dark'))}<div class="bp-person-list">${state.people.map(p=>`<article class="bp-review-row"><span class="bp-avatar">${esc(p.name.slice(0,1))}</span><div><strong>${esc(p.name)}</strong><small>${esc(p.role||'Papel / \u00e1rea a informar')}${p.email?' \u00b7 '+esc(p.email):''}</small></div>${pill(p.status,'outline')}${bpBtn('Editar','edit-person',`data-id="${p.id}"`,'tiny')}</article>`).join('')}</div></section>`:view.registryTab==='processes'?`<section class="canvas-card">${cardHeading('Macroprocessos','A responsabilidade pela frente e a responsabilidade por uma capacidade s\u00e3o v\u00ednculos independentes.')}<div class="bp-process-list">${state.macros.map(m=>`<article><div class="bp-review-row"><div><strong>${esc(m.name)}</strong><small>${esc(bpNames(m.ownerIds).join(' / ')||'Respons\u00e1vel a definir')}</small></div>${bpTag(m.status)}${bpBtn('Editar','edit-macro',`data-id="${m.id}"`,'tiny')}</div>${m.id==='usage'?`<div class="bp-nested-products">${state.boards.filter(b=>b.macroId===m.id).map(b=>`<div class="bp-review-row"><div><strong>${esc(b.name)}</strong><small>${esc(printOwners(b))}</small></div>${bpTag(b.status)}${bpBtn('Editar','edit-front',`data-board="${b.id}"`,'tiny')}</div>`).join('')}</div>`:''}</article>`).join('')}</div></section>`:`<section class="canvas-card">${cardHeading('Cat\u00e1logo de capacidades','Dispon\u00edvel para v\u00ednculo nas etapas. Estar neste cadastro n\u00e3o significa participar de todos os processos.',bpBtn('+ Capacidade','new-capability','','dark'))}<div class="bp-cap-register">${state.capabilities.map(c=>`<div class="bp-review-row"><div><strong>${esc(c.name)}</strong><small>${esc(c.description||'Descri\u00e7\u00e3o a detalhar')}</small></div>${bpTag(c.status)}${bpBtn('Editar','edit-capability',`data-id="${c.id}"`,'tiny')}</div>`).join('')}</div></section><section class="canvas-card">${cardHeading('Respons\u00e1veis por capacidade e contexto','Exemplo: Banking pode ter um dono e Payments Rails, dentro de Banking, outro.',bpBtn('+ V\u00ednculo','new-assignment','','dark'))}${bpResponsibilityList()}</section>`}</div>`;}
function bpMacroView(){const m=bpMacro('usage');return `<div class="workspace bp-wide"><section class="bp-hero"><div class="eyebrow">Macroprocesso</div><h1>Usar, consultar<br>e gerenciar</h1><p>Cada produto abre sua pr\u00f3pria jornada. Cash in, Cash out e demais itens s\u00e3o etapas dentro do produto.</p><div class="board-meta">${bpTag(m.status)}${pill('Respons\u00e1veis: '+(bpNames(m.ownerIds).join(' / ')||'A definir'),'outline')}${bpBtn('Editar macroprocesso','edit-macro','data-id="usage"','tiny')}</div></section><div class="bp-front-list">${state.boards.filter(b=>b.macroId==='usage').map(b=>`<button class="bp-front-card ${!bpActive(b)?'is-muted':''}" data-action="bp-open-front" data-id="${b.id}"><div>${bpTag(b.status)}<h2>${esc(b.name)}</h2><p>${esc(b.summary)}</p></div><div><strong>${bpDefault(b).steps.length} etapas padr\u00e3o</strong><small>${mapItemsFor(b).length} funcionalidades</small><span>\u2197</span></div></button>`).join('')}</div><div class="bp-context-note">Respons\u00e1veis e status s\u00e3o edit\u00e1veis no cadastro. A condi\u00e7\u00e3o de prioriza\u00e7\u00e3o n\u00e3o \u00e9 uma aprova\u00e7\u00e3o regulat\u00f3ria ou de oferta.</div></div>`;}
function bpArchive(){return `<div class="workspace"><section class="bp-hero"><div class="eyebrow">Preserva\u00e7\u00e3o do trabalho</div><h1>Registros <em>preservados</em></h1><p>Conte\u00fados transversais anteriores sem destino inequ\u00edvoco na nova estrutura. N\u00e3o alimentam a blueprint at\u00e9 serem reclassificados.</p></section>${state.migrationArchive?`<div class="bp-context-note">O JSON anterior completo tamb\u00e9m permanece no backup.${bpBtn('Exportar JSON anterior','export-archive','','tiny')}</div>`:''}${(state.sharedRecords||[]).map(b=>`<details class="bp-source-note"><summary>${esc(b.name||b.id)}</summary>${['scope','offers','asis','cases','csd','decisions','actionPlan','blueprint','notes'].map(k=>{const value=b[k];if(!value||(Array.isArray(value)&&!value.length))return '';const label={scope:'Oferta e recorte',offers:'Produtos',asis:'AS-IS',cases:'Casos de uso',csd:'CSD',decisions:'Decis\u00f5es',actionPlan:'Plano de a\u00e7\u00e3o',blueprint:'Experi\u00eancia',notes:'Anota\u00e7\u00f5es'}[k];return `<h3>${label}</h3>${(Array.isArray(value)?value:[value]).map(x=>`<article class="bp-archive-item">${Object.entries(x).filter(([key,v])=>v&&typeof v==='string'&&!['uid','id'].includes(key)).map(([key,v])=>`<p><strong>${esc(key)}:</strong> ${nl(v)}</p>`).join('')}</article>`).join('')}`;}).join('')}</details>`).join('')||'<div class="bp-empty-panel">N\u00e3o h\u00e1 registros transversais a reclassificar.</div>'}</div>`;}
render=function(keepScroll=false){const y=keepScroll?window.scrollY:0;const sx=keepScroll?document.querySelector('.bp-scroll')?.scrollLeft||0:0;bpUpdateOwners();app.className=view.focus?'focus':'';let content=view.page==='board'?boardView():view.page==='tracker'?tracker():view.page==='launch'?renderLaunchTimeline():view.page==='catalog'?bpCatalog():view.page==='registry'?bpRegistry():view.page==='macro'?bpMacroView():view.page==='archive'?bpArchive():overview();app.innerHTML=renderTopbar()+`<div class="shell">${sidebar()}<main class="main" id="workspace-main" tabindex="-1">${content}</main></div>`;updateSaveFlag();if(keepScroll){window.scrollTo(0,y);const scroll=document.querySelector('.bp-scroll');if(scroll)scroll.scrollLeft=sx;}};
// Timeline remains a reference, with routes into the new fronts.
for(const item of LAUNCH.items){if(item.board)item.board=bpAlias(item.board);if(item.id==='debit-card'||/debit/i.test(item.name))item.board='banking';if(/mortgage/i.test(item.name))item.board='mortgage';if(/other loan/i.test(item.name))item.board='credit';}
/* Typed editors. Every save writes one canonical case/step object, then rerenders both views. */
function bpPeoplePicker(ids=[]){return `<div class="bp-checks">${state.people.filter(p=>p.status!=='Inativo'||ids.includes(p.id)).map(p=>`<label><input type="checkbox" name="personIds" value="${esc(p.id)}" ${ids.includes(p.id)?'checked':''}><span>${esc(p.name)}${p.role?`<small>${esc(p.role)}</small>`:''}</span></label>`).join('')||'<p>Cadastre uma pessoa primeiro em Cadastros e respons\u00e1veis.</p>'}</div>`;}
function bpProfilePicker(profiles=[]){return `<div class="bp-checks bp-profile-checks">${RELATIONS.map(p=>`<label><input type="checkbox" name="profiles" value="${esc(p)}" ${profiles.includes(p)?'checked':''}>${esc(p)}</label>`).join('')}</div>`;}
function bpDialog(kind,title,body,context={},intro=''){bpCloseDialog();const el=document.createElement('dialog');el.id='bp-dialog';el.className='bp-dialog';el.setAttribute('aria-labelledby','bp-dialog-title');el.innerHTML=`<div class="bp-dialog-head"><div><div class="micro">NOVAS JORNADAS OFFSHORE</div><h2 id="bp-dialog-title">${title}</h2>${intro?`<p>${intro}</p>`:''}</div><button type="button" class="modal-close" data-action="bp-close" aria-label="Fechar">\u00d7</button></div><form id="bp-form"><div class="form-grid">${body}</div><p class="bp-form-error" role="alert" id="bp-form-error"></p><div class="bp-dialog-foot"><button type="button" class="btn" data-action="bp-close">Cancelar</button><button type="submit" class="btn accent">Salvar altera\u00e7\u00f5es</button></div></form>`;document.body.append(el);bpModal={kind,...context};el.addEventListener('cancel',()=>{bpModal=null;setTimeout(()=>el.remove(),0);});el.addEventListener('click',e=>{if(e.target===el)bpCloseDialog();});el.showModal();el.querySelector('input:not([type="checkbox"]),select,textarea')?.focus();}
function bpCloseDialog(){const el=document.getElementById('bp-dialog');if(el){el.close();el.remove();}bpModal=null;}
function bpEditCase(boardId,caseId='',sourceId=''){
 const b=boardBy(boardId)||activeBoard(),c=caseId?b.cases.find(c=>c.uid===caseId):null;if(caseId&&!c)return;const def=c?.isDefault;let body='';
 body+=bpField('Macroprocesso',`<div class="bp-readonly">${esc(bpMacroLabel(b))}</div>`);
 body+=bpField('Frente / produto',caseId?`<div class="bp-readonly">${esc(b.name)}</div>`:bpSelect('boardId',state.boards.map(x=>[x.id,bpMacro(x.macroId).short+' \u203a '+x.name]),b.id,'id="bp-case-board"'));
 body+=bpField('Nome do caso de uso',bpInput('title',c?.title||'',true));
 body+=bpField('Identifica\u00e7\u00e3o do caso',bpInput('ref',c?.ref||''),false);
 body+=bpField('Status',bpSelect('status',BP_STATUS,c?.status||'Em defini\u00e7\u00e3o'),false);
 body+=bpField(def?'Perfis da refer\u00eancia padr\u00e3o':'Perfis vinculados (ao menos um)',def?`<p class="bp-readonly">${RELATIONS.map(esc).join(' \u00b7 ')}</p>`:bpProfilePicker(c?.profiles|| (view.bpProfile!=='all'?[view.bpProfile]:[])),true,def?'O padr\u00e3o \u00e9 uma refer\u00eancia comum, n\u00e3o uma regra de elegibilidade.':'Special e Person \u00e9 um \u00fanico grupo. Os grupos podem se sobrepor.');
 if(!caseId)body+=bpField('Come\u00e7ar a blueprint',bpSelect('copySource',[['empty','Come\u00e7ar sem etapas'],...b.cases.map(x=>[x.uid,'Copiar etapas: '+x.title])],sourceId||bpDefault(b).uid,'id="bp-copy-source"'),true,'A c\u00f3pia \u00e9 independente. Alterar este caso n\u00e3o muda o original.');
 body+=bpField('Necessidade do cliente',bpText('need',c?.need||''));body+=bpField('Gatilho de in\u00edcio',bpText('trigger',c?.trigger||'',2));body+=bpField('Resultado esperado',bpText('result',c?.result||'',2));body+=bpField('Exce\u00e7\u00f5es ou condi\u00e7\u00f5es',bpText('exception',c?.exception||'',2));
 bpDialog('case',caseId?'Editar caso de uso':'Criar caso de uso',body,{boardId:b.id,caseId},'O marco \u00e9 definido em cada etapa, n\u00e3o no caso inteiro.');
}
function bpEditStage(boardId,caseId,stepId='',focus=''){
 const b=boardBy(boardId),c=b?.cases.find(c=>c.uid===caseId)||bpDefault(b);if(!b||!c)return;const rec=c.steps.find(s=>s.uid===stepId)||bpBlankStep('');const featureIds=new Set(rec.featureIds);const feats=MATRIX.items.filter(f=>bpRoute(f).boardId===b.id||featureIds.has(f.id));
 let body=bpField('Etapa do processo',bpInput('name',rec.name,true));body+=bpField('Marco desta etapa',bpSelect('release',[['','A definir'],...BP_PHASES],rec.release),false);body+=bpField('Status do item',bpSelect('status',BP_STATUS,rec.status),false);body+=bpField('Objetivo do processo',bpSelect('objective',[['','A definir'],...V17_OBJECTIVES],rec.objective||''),false);
 const laneFields=[['actor','Ator','Quem executa de fato esta etapa?',bpText('actor',rec.actor,2)],['channel','Canal','Por onde esse ator executa a etapa?',bpText('channel',rec.channel,2)],['operation','Opera\u00e7\u00e3o','Qual opera\u00e7\u00e3o \u00e9 respons\u00e1vel e qual o seu papel?',bpField('Opera\u00e7\u00e3o respons\u00e1vel',bpInput('operationOwner',rec.operationOwner))+bpField('Papel nessa a\u00e7\u00e3o',bpText('operationRole',rec.operationRole,2))],['system','Sistema','Qual sistema executa esse processo?',bpText('system',rec.system,2)],['capabilities','Capacidades','Vincule as capacidades ativadas nesta etapa.',`<div class="bp-checks bp-cap-checks">${state.capabilities.map(cap=>`<label><input type="checkbox" name="capabilityIds" value="${cap.id}" ${rec.capabilityIds.includes(cap.id)?'checked':''}><span>${esc(cap.name)}<small>${esc(bpCapacityOwners(cap.id,b)||'Respons\u00e1vel a definir neste contexto')}</small></span></label>`).join('')}</div>${bpField('Adicionar capacidades ao cadastro (uma por linha)',bpText('newCapabilities','',2))}${bpField('Papel das capacidades / condi\u00e7\u00f5es de ativa\u00e7\u00e3o',bpText('capabilityNotes',rec.capabilityNotes,2))}`],['support','Atendimento','Como o cliente recebe suporte nessa etapa?',bpText('support',rec.support,2)]];
 body+=laneFields.map(([key,label,hint,content])=>`<details class="bp-editor-section field full" id="bp-editor-${key}" ${!focus||focus===key?'open':''}><summary><strong>${label}</strong><small>${hint}</small></summary><div class="bp-editor-fields">${content}</div></details>`).join('');
 body+=`<details class="bp-editor-section field full" id="bp-editor-features" ${focus==='features'?'open':''}><summary><strong>Funcionalidades vinculadas</strong><small>O mesmo ID pode participar de mais de uma etapa. A refer\u00eancia original \u00e9 preservada.</small></summary><div class="bp-editor-fields"><input id="bp-feature-search" placeholder="Buscar por nome ou ID" aria-label="Buscar funcionalidades"><div class="bp-checks bp-feature-checks">${feats.map(f=>`<label data-feature-query="${esc((f.id+' '+f.funcionalidade).toLowerCase())}"><input type="checkbox" name="featureIds" value="${f.id}" ${featureIds.has(f.id)?'checked':''}><span><b>${f.id}</b> ${esc(f.funcionalidade)}<small>${esc(f.publico)} \u00b7 ${esc(v10FeatureRelease(f))}</small></span></label>`).join('')}</div></div></details>`;
 body+=bpField('Anota\u00e7\u00f5es da etapa',bpText('notes',rec.notes||'',2));body+=bpField('Natureza do preenchimento',bpSelect('nature',['Estrutura de refer\u00eancia','Proposta de classifica\u00e7\u00e3o','Preenchimento do workshop','Em valida\u00e7\u00e3o','Definido','Importado \u00b7 revisar'],rec.nature),false);
 if(stepId)body+=`<div class="field full">${bpBtn('Excluir esta etapa','delete-stage',`data-board="${b.id}" data-case="${c.uid}" data-id="${stepId}"`,'ghost')}</div>`;
 bpDialog('stage',stepId?'Editar etapa':'Adicionar etapa',body,{boardId:b.id,caseId:c.uid,stepId},esc(b.name)+' \u00b7 '+esc(c.title));
 if(focus){const target=document.getElementById('bp-editor-'+focus);target?.scrollIntoView({block:'start'});target?.querySelector('textarea,input')?.focus();}
}
function bpCopyDialog(boardId){const b=boardBy(boardId),c=bpCurrentCase(b);if(!c)return;const others=b.cases.filter(x=>x.uid!==c.uid);if(!others.length){toast('Crie outro caso antes de copiar etapas.');return;}bpDialog('copy','Copiar etapas de outro caso',bpField('Destino',`<div class="bp-readonly">${esc(b.name)} \u203a ${esc(c.title)}</div>`)+bpField('Caso de origem',bpSelect('source',others.map(x=>[x.uid,x.title]),others[0].uid))+bpField('Como copiar',bpSelect('mode',[['append','Adicionar depois das etapas atuais'],['replace','Substituir as etapas atuais']],'append'))+`<p class="field full bp-context-note">Ser\u00e1 criada uma c\u00f3pia independente. Perfis e dados do caso de destino n\u00e3o mudam. Os IDs internos das etapas s\u00e3o novos; os IDs das funcionalidades permanecem os mesmos.</p>`,{boardId:b.id,caseId:c.uid});}
function bpEditEntity(kind,id){let obj,body,title;
 if(kind==='person'){obj=state.people.find(p=>p.id===id)||{};title=id?'Editar pessoa':'Cadastrar pessoa';body=bpField('Nome',bpInput('name',obj.name||'',true))+bpField('Papel / \u00e1rea',bpInput('role',obj.role||''))+bpField('E-mail (opcional)',bpInput('email',obj.email||''))+bpField('Status',bpSelect('status',['Ativo','Inativo'],obj.status||'Ativo'));}
 else if(kind==='capability'){obj=state.capabilities.find(c=>c.id===id)||{};title=id?'Editar capacidade':'Cadastrar capacidade';body=bpField('Nome',bpInput('name',obj.name||'',true))+bpField('Descri\u00e7\u00e3o',bpText('description',obj.description||''))+bpField('Status',bpSelect('status',BP_STATUS,obj.status||'Em defini\u00e7\u00e3o'));}
 else if(kind==='macro'){obj=bpMacro(id);title='Editar macroprocesso';body=bpField('Nome',`<div class="bp-readonly">${esc(obj.name)}</div>`)+bpField('Status',bpSelect('status',BP_STATUS,obj.status))+bpField('Respons\u00e1veis pelo macroprocesso',bpPeoplePicker(obj.ownerIds),true,'Atribui\u00e7\u00f5es por capacidade s\u00e3o feitas separadamente.');}
 else if(kind==='front'){obj=boardBy(id);title='Editar frente';body=bpField('Macroprocesso',`<div class="bp-readonly">${esc(bpMacroLabel(obj))}</div>`)+bpField('Nome da frente',bpInput('name',obj.name,true))+bpField('Descri\u00e7\u00e3o',bpText('summary',obj.summary))+bpField('Status',bpSelect('status',BP_STATUS,obj.status))+bpField('Respons\u00e1veis pela frente',bpPeoplePicker(obj.ownerIds),true,'Sem v\u00ednculo pr\u00f3prio, a frente herda os respons\u00e1veis pelo macroprocesso.');}
 if(obj)bpDialog(kind,title,body,{id});
}
function bpAssignment(id=''){const r=state.responsibilities.find(x=>x.uid===id)||{};bpDialog('assignment',id?'Editar responsabilidade':'Vincular respons\u00e1veis',bpField('Capacidade',bpSelect('capabilityId',state.capabilities.map(c=>[c.id,c.name]),r.capabilityId||state.capabilities[0]?.id))+bpField('Contexto do v\u00ednculo',bpSelect('context',[...state.macros.map(m=>['macro:'+m.id,'Macroprocesso: '+m.short]),...state.boards.map(b=>['board:'+b.id,'Frente: '+b.name])],r.context||'board:banking'))+bpField('Respons\u00e1veis',bpPeoplePicker(r.personIds))+bpField('Papel / responsabilidade',bpText('role',r.role||''))+(id?`<div class="field full">${bpBtn('Excluir v\u00ednculo','delete-assignment',`data-id="${id}"`,'ghost')}</div>`:''),{id},'Um v\u00ednculo espec\u00edfico da frente prevalece sobre o v\u00ednculo geral do macroprocesso.');}
function bpReclassify(featureId){const f=MATRIX.items.find(x=>x.id===featureId),r=bpRoute(f),b=boardBy(r.boardId)||state.boards[0];bpDialog('reclassify','Reclassificar funcionalidade',bpField('Funcionalidade',`<div class="bp-readonly">${esc(f.id+' \u00b7 '+f.funcionalidade)}</div>`)+bpField('Frente de trabalho',bpSelect('boardId',state.boards.map(x=>[x.id,bpMacro(x.macroId).short+' \u203a '+x.name]),b.id,'id="bp-route-board"'))+bpField('Etapa do caso padr\u00e3o',bpSelect('stepId',[['','Sem etapa atribu\u00edda'],...bpDefault(b).steps.map(s=>[s.uid,s.name])],bpSourceSteps(f)[0]?.uid||'','id="bp-route-step"'))+bpField('Situa\u00e7\u00e3o da classifica\u00e7\u00e3o',bpSelect('status',['Proposta de classifica\u00e7\u00e3o','Validada no workshop'],r.status||'Proposta de classifica\u00e7\u00e3o')),{featureId},'Muda o enquadramento principal e o v\u00ednculo no padr\u00e3o. Os dados da fonte e os v\u00ednculos de casos espec\u00edficos n\u00e3o s\u00e3o apagados.');}
function bpError(msg){document.getElementById('bp-form-error').textContent=msg;return false;}
function bpSyncFlow(c){if(c.flow&&!c.legacyFlow)c.legacyFlow=c.flow;c.flow=c.steps.map(s=>s.name).join(' \u2192 ');c.updatedAt=new Date().toISOString();}
function bpSaveForm(e){e.preventDefault();if(!bpModal)return;const ctx=bpModal,fd=new FormData(e.target),v=k=>String(fd.get(k)||'').trim(),all=k=>fd.getAll(k).map(String);const b=boardBy(ctx.boardId),date=new Date().toISOString();
 if(ctx.kind==='case'){
  const target=ctx.caseId?b:boardBy(v('boardId'));if(!target)return bpError('Selecione uma frente.');let c=ctx.caseId?target.cases.find(x=>x.uid===ctx.caseId):bpBlankCase(target);if(!v('title'))return bpError('Informe o nome do caso.');if(!c.isDefault&&!all('profiles').length)return bpError('Vincule ao menos um perfil ao caso de uso.');
  Object.assign(c,{title:v('title'),ref:v('ref'),status:v('status'),need:v('need'),trigger:v('trigger'),result:v('result'),exception:v('exception'),profiles:c.isDefault?[...RELATIONS]:all('profiles'),macroId:target.macroId,boardId:target.id,needsReview:false});
  if(!ctx.caseId){const source=target.cases.find(x=>x.uid===v('copySource'));if(source){c.steps=bpCopySteps(source);c.copiedFrom=source.uid;}target.cases.push(c);}bpSyncFlow(c);view.boardId=target.id;view.page='board';view.step=-1;view.bpCase=c.isDefault?'standard':c.uid;view.bpProfile='all';view.bpRelease='all';
 }
 else if(ctx.kind==='stage'){
  const c=b?.cases.find(x=>x.uid===ctx.caseId);if(!c)return;if(!v('name'))return bpError('Informe o nome da etapa.');let s=c.steps.find(x=>x.uid===ctx.stepId)||bpBlankStep();for(const key of ['name','actor','channel','operationOwner','operationRole','system','capabilityNotes','support','release','status','notes','nature'])s[key]=v(key);s.featureIds=all('featureIds');s.capabilityIds=all('capabilityIds');
  for(const name of v('newCapabilities').split('\n').map(x=>x.trim()).filter(Boolean)){let cap=state.capabilities.find(c=>c.name.toLocaleLowerCase()===name.toLocaleLowerCase());if(!cap){cap={id:qid(),name,description:'',status:'Em defini\u00e7\u00e3o'};state.capabilities.push(cap);}if(!s.capabilityIds.includes(cap.id))s.capabilityIds.push(cap.id);}
  s.updatedAt=date;if(!ctx.stepId)c.steps.push(s);bpSyncFlow(c);
 }
 else if(ctx.kind==='copy'){
  const c=b.cases.find(x=>x.uid===ctx.caseId),source=b.cases.find(x=>x.uid===v('source'));if(!c||!source)return bpError('Selecione um caso de origem.');if(v('mode')==='replace'){if(!confirm('Substituir as etapas atuais? Uma c\u00f3pia das etapas anteriores ser\u00e1 preservada no hist\u00f3rico do JSON.'))return;c.stepHistory=c.stepHistory||[];c.stepHistory.push({ts:date,action:'Substitui\u00e7\u00e3o por c\u00f3pia',steps:clone(c.steps)});c.steps=bpCopySteps(source);}else c.steps.push(...bpCopySteps(source));bpSyncFlow(c);
 }
 else if(ctx.kind==='person'||ctx.kind==='capability'){
  if(!v('name'))return bpError('Informe o nome.');const list=ctx.kind==='person'?state.people:state.capabilities;let record=list.find(x=>x.id===ctx.id)||{id:qid()};if(list.some(x=>x.id!==record.id&&x.name.toLocaleLowerCase()===v('name').toLocaleLowerCase()))return bpError('J\u00e1 existe um cadastro com este nome.');record.name=v('name');record.status=v('status');if(ctx.kind==='person'){record.role=v('role');record.email=v('email');}else record.description=v('description');if(!ctx.id)list.push(record);
 }
 else if(ctx.kind==='macro'){const m=bpMacro(ctx.id);m.status=v('status');m.ownerIds=all('personIds');if(m.id!=='usage'){const single=boardBy(m.boards[0]);single.status=m.status;single.ownerIds=[...m.ownerIds];}}
 else if(ctx.kind==='front'){const front=boardBy(ctx.id);if(!v('name'))return bpError('Informe o nome.');Object.assign(front,{name:v('name'),short:v('name'),summary:v('summary'),status:v('status'),ownerIds:all('personIds')});if(front.macroId!=='usage'){const m=bpMacro(front.macroId);m.status=front.status;m.ownerIds=[...front.ownerIds];}}
 else if(ctx.kind==='assignment'){if(!all('personIds').length)return bpError('Vincule pelo menos uma pessoa.');if(!v('capabilityId')||!v('context'))return bpError('Informe capacidade e contexto.');if(state.responsibilities.some(x=>x.uid!==ctx.id&&x.capabilityId===v('capabilityId')&&x.context===v('context')))return bpError('Este v\u00ednculo j\u00e1 existe. Edite o registro para adicionar outras pessoas.');let r=state.responsibilities.find(x=>x.uid===ctx.id)||{uid:qid()};Object.assign(r,{capabilityId:v('capabilityId'),context:v('context'),personIds:all('personIds'),role:v('role')});if(!ctx.id)state.responsibilities.push(r);}
 else if(ctx.kind==='reclassify'){const target=boardBy(v('boardId'));if(!target)return;const fid=ctx.featureId;for(const front of state.boards)for(const s of bpDefault(front).steps)s.featureIds=s.featureIds.filter(x=>x!==fid);const s=bpDefault(target).steps.find(s=>s.uid===v('stepId'));if(s)s.featureIds.push(fid);const previous=state.featureRouting[fid]||{};const routing={...previous,boardId:target.id,macroId:target.macroId,status:v('status'),updatedAt:date};if(v('release')==='__source'){delete routing.release;delete routing.releaseReason;}else{routing.release=v('release');routing.releaseReason=v('releaseReason');}state.featureRouting[fid]=routing;state.featureHistory=state.featureHistory||[];state.featureHistory.push({featureId:fid,at:date,from:clone(previous),to:clone(routing)});document.getElementById('feature-layer')?.remove();}
 bpCloseDialog();bpUpdateOwners();save();render(true);toast('Altera\u00e7\u00f5es salvas no rascunho. Use Salvar JSON para gravar o arquivo.');
}
const bpV8Click=clickHandler;
clickHandler=function(e){const t=e.target.closest('[data-action]');if(!t)return;const a=t.dataset.action,id=t.dataset.id;
 if(['open-board','launch-open-board','feature-go-board'].includes(a)){document.getElementById('feature-layer')?.remove();bpOpenFront(id);return;}
 if(a==='launch-open-matrix'){view.page='catalog';view.catalogRelease=t.dataset.phase||'all';view.catalogMacro='all';view.catalogBoard='all';render();goTop();return;}
 if(a==='edit'&&t.dataset.kind==='boardmeta'){bpEditEntity('front',activeBoard().id);return;}
 if(a==='edit'&&t.dataset.kind==='cases'){bpEditCase(activeBoard().id,id||'');return;}
 if(!a.startsWith('bp-'))return bpV8Click(e);
 const b=boardBy(t.dataset.board)||activeBoard(),c=t.dataset.case?b?.cases.find(x=>x.uid===t.dataset.case):bpCurrentCase(b);
 switch(a.slice(3)){
  case 'open-front':bpOpenFront(id);return;
  case 'open-case':bpOpenFront(b.id,t.dataset.case);return;
  case 'open-macro':view.page='macro';view.guideOpen=false;render();goTop();return;
  case 'registry':view.page='registry';render();goTop();return;
  case 'registry-tab':view.registryTab=id;render(true);return;
  case 'catalog':view.page='catalog';render();goTop();return;
  case 'archive':view.page='archive';render();goTop();return;
  case 'export-archive':if(state.migrationArchive)download(JSON.stringify(state.migrationArchive,null,2),'workshop_antes_da_reorganizacao.json','application/json;charset=utf-8');return;
  case 'clear':view.bpMacro='all';view.bpCase='standard';view.bpProfile='all';view.bpRelease='all';view.bpStatus='all';render(true);return;
  case 'jump-macro':{view.bpMacro='all';view.bpCase='standard';view.bpRelease='all';view.bpStatus='all';render(true);const sc=document.querySelector('.bp-scroll'),head=document.querySelector(`[data-macro="${id}"]`);if(sc&&head)sc.scrollTo({left:head.offsetLeft-164,behavior:'smooth'});return;}
  case 'new-case':bpEditCase(b?.id||'onboarding','',t.dataset.source||'');return;
  case 'edit-case':bpEditCase(b.id,t.dataset.case);return;
  case 'delete-case':if(!c||c.isDefault)return;if(!confirm('Excluir este caso de uso? Ele sair\u00e1 das vis\u00f5es; uma c\u00f3pia ficar\u00e1 no hist\u00f3rico do JSON.'))return;b.caseArchive=b.caseArchive||[];b.caseArchive.push({...clone(c),archivedAt:new Date().toISOString()});b.cases=b.cases.filter(x=>x.uid!==c.uid);view.bpCase='standard';save();render(true);return;
  case 'new-stage':bpEditStage(b.id,c?.uid||bpDefault(b).uid);return;
  case 'edit-stage':if(String(id).startsWith('placeholder-'))return;bpEditStage(b.id,t.dataset.case||c?.uid,id,t.dataset.field||'');return;
  case 'stage-focus':if(String(id).startsWith('placeholder-'))return;bpOpenFront(b.id,t.dataset.case);requestAnimationFrame(()=>{const cell=document.querySelector(`.bp-step-head button[data-id="${id}"]`);cell?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'});});return;
  case 'delete-stage':{if(!c||!confirm('Excluir esta etapa? As funcionalidades continuam no cat\u00e1logo.'))return;const step=c.steps.find(s=>s.uid===id);if(!step)return;c.stepHistory=c.stepHistory||[];c.stepHistory.push({ts:new Date().toISOString(),action:'Etapa exclu\u00edda',steps:[clone(step)]});c.steps=c.steps.filter(s=>s.uid!==id);bpSyncFlow(c);bpCloseDialog();save();render(true);return;}
  case 'move-stage':{const cur=bpCurrentCase(activeBoard());if(!cur)return;const idx=cur.steps.findIndex(s=>s.uid===id),next=idx+Number(t.dataset.dir);if(idx<0||next<0||next>=cur.steps.length)return;cur.steps.splice(next,0,cur.steps.splice(idx,1)[0]);bpSyncFlow(cur);save();render(true);return;}
  case 'copy':bpCopyDialog(b.id);return;
  case 'edit-front':bpEditEntity('front',b.id);return;
  case 'edit-macro':bpEditEntity('macro',id);return;
  case 'new-person':bpEditEntity('person');return;
  case 'edit-person':bpEditEntity('person',id);return;
  case 'new-capability':bpEditEntity('capability');return;
  case 'edit-capability':bpEditEntity('capability',id);return;
  case 'new-assignment':bpAssignment();return;
  case 'edit-assignment':bpAssignment(id);return;
  case 'delete-assignment':if(!confirm('Excluir este v\u00ednculo de responsabilidade?'))return;state.responsibilities=state.responsibilities.filter(r=>r.uid!==id);bpCloseDialog();save();render(true);return;
  case 'reclassify':document.getElementById('feature-layer')?.remove();bpReclassify(t.dataset.feature);return;
  case 'feature-front':document.getElementById('feature-layer')?.remove();bpOpenFront(id);return;
  case 'close':bpCloseDialog();return;
  case 'help':{const body=`<div class="field full bp-help"><p><strong>1. Escolha a frente e o caso.</strong> Padr\u00e3o \u00e9 a refer\u00eancia inicial. Um caso espec\u00edfico exige pelo menos um perfil e pertence sempre ao macroprocesso da frente.</p><p><strong>2. Defina as etapas.</strong> Adicione, edite ou reordene colunas. O marco de cada etapa \u00e9 independente: Day-1 ou Release A, B, C e D.</p><p><strong>3. Preencha as sete linhas.</strong> Ator, Canal, Opera\u00e7\u00e3o (respons\u00e1vel e papel), Sistema, Capacidades, Dados e Atendimento. Clique na c\u00e9lula para editar.</p><p><strong>4. Reaproveite sem sobrescrever.</strong> Copiar etapas cria novos registros independentes. O original e suas futuras altera\u00e7\u00f5es n\u00e3o se propagam.</p><p><strong>5. Acompanhe o todo.</strong> A home l\u00ea os mesmos objetos das frentes. Sem um caso espec\u00edfico, mostra o padr\u00e3o. Perfil n\u00e3o escolhe uma variante automaticamente.</p><p><strong>6. Salve o arquivo.</strong> O navegador guarda um rascunho. Salvar JSON grava o estado completo; Abrir JSON retoma o trabalho. Sem suporte \u00e0 grava\u00e7\u00e3o direta, o HTML baixa uma c\u00f3pia do arquivo.</p></div>`;bpDialog('help','Preencher a blueprint',body);document.querySelector('#bp-dialog .bp-dialog-foot').innerHTML=bpBtn('Entendi','close','','dark');return;}
 }
};
const bpV8Change=onChange;
onChange=function(e){const id=e.target.id,val=e.target.value;
 if(id==='bp-case-board'){const b=boardBy(val),sel=document.getElementById('bp-copy-source');if(b&&sel){sel.innerHTML=bpOptions([['empty','Come\u00e7ar sem etapas'],...b.cases.map(c=>[c.uid,'Copiar etapas: '+c.title])],bpDefault(b).uid);const ro=document.querySelector('#bp-dialog .bp-readonly');if(ro)ro.textContent=bpMacroLabel(b);}return;}
 if(id==='bp-route-board'){const b=boardBy(val);document.getElementById('bp-route-step').innerHTML=bpOptions([['','Sem etapa atribu\u00edda'],...bpDefault(b).steps.map(s=>[s.uid,s.name])],'');return;}
 const fields={'bp-macro':'bpMacro','bp-case':'bpCase','bp-profile':'bpProfile','bp-release':'bpRelease','bp-status':'bpStatus','bp-density':'bpDensity','catalog-macro':'catalogMacro','catalog-board':'catalogBoard','catalog-audience':'catalogAudience','catalog-release':'catalogRelease'};
 if(fields[id]){view[fields[id]]=val;if(id==='bp-macro')view.bpCase='standard';render(true);return;}return bpV8Change(e);
};
const bpV8Input=onInput;
onInput=function(e){if(e.target.id==='catalog-search'){view.catalogSearch=e.target.value;document.querySelectorAll('.bp-catalog-row').forEach(el=>el.hidden=!el.dataset.query.includes(view.catalogSearch.toLowerCase()));return;}if(e.target.id==='bp-feature-search'){document.querySelectorAll('[data-feature-query]').forEach(el=>el.hidden=!el.dataset.featureQuery.includes(e.target.value.toLowerCase()));return;}return bpV8Input(e);};
const bpV8Submit=onSubmit;
onSubmit=function(e){if(e.target.id==='bp-form'){bpSaveForm(e);return;}return bpV8Submit(e);};
const bpV8Apply=applyOpenedJSON;
applyOpenedJSON=function(raw,name,handle=null,ask=true){const migrated=raw?.schema!==4;view.bpCase='standard';view.bpMacro='all';view.bpProfile='all';view.bpRelease='all';view.bpStatus='all';const ok=bpV8Apply(raw,name,handle,ask);if(ok&&migrated){jsonDirty=true;writeJSONMeta();updateSaveFlag();toast('JSON anterior reorganizado. Salve a nova vers\u00e3o; o original completo foi preservado.');}return ok;};
// Keep controls, labels and exported artifacts accessible.
const bpV8Dialog=bpDialog;
bpDialog=function(...args){bpV8Dialog(...args);document.querySelectorAll('#bp-dialog .field').forEach((el,i)=>{const label=el.querySelector(':scope > label'),control=el.querySelector(':scope > input,:scope > textarea,:scope > select');if(label&&control){if(!control.id)control.id='bp-control-'+i;label.htmlFor=control.id;}});};
const bpRawOpenFront=bpOpenFront;
bpOpenFront=function(id,caseId=null){const b=boardBy(bpAlias(id));if(b&&caseId&&b.cases.find(c=>c.uid===caseId)?.isDefault)caseId='standard';bpRawOpenFront(id,caseId);};
const bpOriginalScope=stageScope;
stageScope=function(b){let result=bpOriginalScope(b);if(b.scopeNeedsReview)result='<div class="bp-context-note"><strong>Recorte a redefinir.</strong> Banking agora re\xfane contas e pagamentos. Os recortes anteriores foram preservados abaixo, sem reaproveitar exclus\xf5es incompat\xedveis com a nova frente.</div>'+result;if(b.previousContext?.length)result+='<details class="bp-source-note"><summary>Recortes anteriores preservados</summary>'+b.previousContext.map(x=>'<article class="bp-archive-item"><h4>'+esc(x.name)+'</h4>'+Object.entries(x.scope||{}).filter(([k,v])=>v&&typeof v==='string').map(([k,v])=>'<p><strong>'+esc(({offerDefinition:'Oferta',problem:'Problema',within:'Dentro do recorte',outside:'Fora do recorte',value:'Resultado esperado'})[k]||k)+':</strong> '+nl(v)+'</p>').join('')+'</article>').join('')+'</details>';return result;};
const bpSaveLegacyForm=saveForm;
saveForm=function(e){const context=currentModal?{...currentModal}:null;bpSaveLegacyForm(e);if(context?.kind==='scope'&&!currentModal){const b=boardBy(context.boardId);if(b){b.scopeNeedsReview=!Object.values(b.scope).some(bpMeaningful);save();render(true);}}};
/* v10: one blueprint per case, lightweight offer eligibility, shared release tokens. */
const V10_TABS=[{id:-1,name:'Blueprint'},{id:0,name:'Oferta e recorte'},{id:1,name:'AS-IS'},{id:4,name:'CSD e decis\u00f5es'},{id:5,name:'Plano de a\u00e7\u00e3o'}];
const V10_PHASES={
 'Day-1':{tone:'#163963',light:'#eaf0f7',ink:'#163963',text:'#ffffff',order:'01'},
 'Release A':{tone:'#2d5d93',light:'#edf2f8',ink:'#254f7b',text:'#ffffff',order:'02'},
 'Release B':{tone:'#507dab',light:'#edf3f9',ink:'#315b83',text:'#ffffff',order:'03'},
 'Release C':{tone:'#89a9c9',light:'#f0f5fa',ink:'#345879',text:'#132f4b',order:'04'},
 'Release D':{tone:'#c2d4e6',light:'#f3f7fb',ink:'#42627e',text:'#17354e',order:'05'}
};
for(const [key,p] of Object.entries(V10_PHASES))Object.assign(LAUNCH_PALETTE[key],{tone:p.tone,light:p.light,darktone:p.ink});
Object.assign(view,{bpPane:'map',v10CaseQuery:''});
function v10CanonicalPhase(r){return r==='Legal Day One'||r==='Atual / Day-1'||r==='Atual + Day-1'||r==='Atual \u2192 Day-1'?'Day-1':r;}
function v10PhaseStyle(r){const p=V10_PHASES[v10CanonicalPhase(r)]||{tone:'#c9cbd0',light:'#f3f3f5',ink:'#5b6069',text:'#484d56'};return `--phase-tone:${p.tone};--phase-bg:${p.light};--phase-ink:${p.ink};--phase-text:${p.text}`;}
function v10PhaseBadge(r){const text=r&&r!=='Sem fase definida'?r:'Marco a definir';return `<span class="v10-phase" style="${v10PhaseStyle(r)}"><i aria-hidden="true"></i>${esc(text)}</span>`;}
function v10FeatureRelease(f){const r=state?.featureRouting?.[f.id];return r&&Object.hasOwn(r,'release')?r.release:f.marco_produto;}
function v10Legend(){return `<div class="v10-release-legend" aria-label="Sequ\u00eancia dos marcos de implanta\u00e7\u00e3o"><span class="micro">Marcos</span>${Object.entries(V10_PHASES).map(([k,p])=>`<span class="v10-legend-phase" style="${v10PhaseStyle(k)}"><i>${p.order}</i>${k}</span>`).join('')}<small>Ordem de implanta\u00e7\u00e3o, n\u00e3o prioridade.</small></div>`;}
function v10Progress(b,id){return id===-1?(b.blueprintProgress??0):(b.progress?.[id]||0);}
function v10Validated(b){return V10_TABS.filter(x=>Number(v10Progress(b,x.id))===2).length;}
function v10StageLabel(stage){if(['-1','2','3'].includes(String(stage)))return 'Blueprint';return V10_TABS.find(x=>String(x.id)===String(stage))?.name||'Geral';}
function v10Validation(b,id){return `<label class="v10-validation">Valida\u00e7\u00e3o do bloco<select id="v10-progress" data-block="${id}">${bpOptions([['0','A iniciar'],['1','Em constru\u00e7\u00e3o'],['2','Validado']],String(v10Progress(b,id)))}</select></label>`;}
function v10Normalize(out){if(!out)return out;out.formatVersion='10.0';out.featureHistory=Array.isArray(out.featureHistory)?out.featureHistory:[];for(const b of out.boards){if(![0,1,2].includes(Number(b.blueprintProgress))||b.blueprintProgress==null)b.blueprintProgress=b.progress?.[2]===2&&b.progress?.[3]===2?2:b.progress?.[2]>0||b.progress?.[3]>0?1:0;for(const o of b.offers||[]){o.eligibility=o.eligibility||{};o.eligibilityNotes=o.eligibilityNotes||{};}}return out;}
const v10BaseNormalize=normalizeState;
normalizeState=function(src){return v10Normalize(v10BaseNormalize(src));};
// Initialization normalizes once, after all migrations are registered.
STAGES[0].short='Oferta e recorte';
STAGES[0].result='Oferta, recorte, produtos e servi\u00e7os, com elegibilidade indicada em cada item.';
STAGES[0].questions=['Qual oferta queremos disponibilizar?','Que necessidade atende e onde termina o recorte?','Quais produtos e servi\u00e7os fazem parte dela?','Quais perfis s\u00e3o eleg\u00edveis e sob quais condi\u00e7\u00f5es?'];

/* Offer cards: profile tags replace the separate eligibility matrix. */
function v10EligibilityTags(o){const rows=RELATIONS.map(p=>({profile:p,status:o.eligibility?.[p]||'A definir',note:o.eligibilityNotes?.[p]||''}));return `<div class="v10-offer-profiles"><span class="micro">Perfis</span><div class="tags">${rows.map(x=>`<button type="button" class="v10-profile-tag ${x.status==='Eleg\u00edvel'?'eligible':x.status==='Condicional'?'conditional':x.status==='N\u00e3o eleg\u00edvel'?'ineligible':'undefined'}" data-action="v10-offer-profiles" data-id="${o.uid}" title="${esc(x.note||'Editar condi\u00e7\u00f5es deste perfil')}" aria-label="${esc(x.profile+': '+x.status+'. Editar elegibilidade')}"><span>${esc(x.profile)}</span><small>${esc(x.status)}</small></button>`).join('')}</div>${rows.some(x=>x.note)?`<details class="v10-eligibility-notes"><summary>Condi\u00e7\u00f5es por perfil</summary>${rows.filter(x=>x.note).map(x=>`<p><strong>${esc(x.profile)}:</strong> ${nl(x.note)}</p>`).join('')}</details>`:''}</div>`;}
stageScope=function(b){const fields=[['Problema que queremos resolver',b.scope.problem],['Dentro do recorte',b.scope.within],['Fora do recorte',b.scope.outside],['Resultado esperado',b.scope.value]];return `<section class="canvas-card offer-definition">${cardHeading('Defini\u00e7\u00e3o da oferta','',btn('Editar defini\u00e7\u00e3o','edit','data-kind="scope"','tiny'))}<div class="definition-text ${!isFilled(b.scope.offerDefinition)?'empty':''}">${isFilled(b.scope.offerDefinition)?nl(b.scope.offerDefinition):'Defina a proposta da oferta, para quem ela existe e qual necessidade atende.'}</div></section><section class="canvas-card">${cardHeading('Recorte de atua\u00e7\u00e3o','',btn('Editar recorte','edit','data-kind="scope"','tiny'))}<div class="fields-grid">${fields.map(([label,v])=>`<div class="read-field"><div class="lbl">${esc(label)}</div><div class="val ${!isFilled(v)?'empty':''}">${isFilled(v)?nl(v):'A definir durante o workshop'}</div></div>`).join('')}</div></section><section class="canvas-card">${cardHeading('Produtos e servi\u00e7os','',btn('+ Incluir item','edit','data-kind="offers"','tiny dark'))}<div class="offer-grid">${b.offers.map(o=>`<article class="offer-card"><div class="tags">${v10PhaseBadge(o.horizon||'A definir')}${pill(o.nature||'Hip\u00f3tese','outline')}</div><h4>${esc(o.title)}</h4><p>${nl(o.detail)}</p>${o.rules?`<p><b>Regras:</b> ${nl(o.rules)}</p>`:''}${v10EligibilityTags(o)}<div class="offer-actions">${pill(o.status||'Em discuss\u00e3o')}<div class="row-actions">${actEdit('offers',o.uid)}${actDelete('offers',o.uid)}</div></div></article>`).join('')||'<div class="empty-box">Inclua o primeiro produto ou servi\u00e7o da oferta.</div>'}</div></section>`;};
function v10EditOfferProfiles(id){const b=activeBoard(),o=b.offers.find(x=>x.uid===id);if(!o)return;const body=`<div class="field full bp-readonly">${esc(o.title)}</div>`+RELATIONS.map((p,i)=>`<section class="v10-eligibility-editor field full"><h3>${esc(p)}</h3>${bpField('Elegibilidade',bpSelect('eligibility_'+i,['A definir','Eleg\u00edvel','Condicional','N\u00e3o eleg\u00edvel'],o.eligibility?.[p]||'A definir'))}${bpField('Condi\u00e7\u00e3o ou diferen\u00e7a para este perfil',bpText('eligibility_notes_'+i,o.eligibilityNotes?.[p]||'',2))}</section>`).join('');bpDialog('offer-profiles','Perfis do produto ou servi\u00e7o',body,{boardId:b.id,offerId:id});}

/* Navigation: cases live inside the blueprint; no duplicate Experience section. */
stageNav=function(b){return `<nav class="stage-nav v10-tabs" aria-label="Se\u00e7\u00f5es da frente">${V10_TABS.map((x,i)=>`<button type="button" class="stage-tab ${view.step===x.id?'active':''}" data-action="step" data-index="${x.id}" aria-current="${view.step===x.id?'page':'false'}"><span class="stage-index">${String(i+1).padStart(2,'0')}</span><span>${esc(x.name)}</span>${v10Progress(b,x.id)===2?'<span class="v10-tab-check" aria-label="Validado">\u2713</span>':''}</button>`).join('')}</nav>`;};
boardView=function(){if([2,3].includes(view.step)){view.bpPane=view.step===2?'cases':'map';view.step=-1;}const b=activeBoard();const pos=V10_TABS.findIndex(x=>x.id===view.step),tab=V10_TABS[pos]||V10_TABS[0];return `<div class="workspace bp-wide"><div class="crumb"><button data-action="navigate" data-page="overview">Vis\u00e3o geral</button><span>\u203a</span><span>${esc(bpMacroLabel(b))}</span>${b.macroId==='usage'?`<span>\u203a</span><span>${esc(b.name)}</span>`:''}</div><div class="board-hero"><div class="board-head"><div><div class="eyebrow">${b.macroId==='usage'?'PRODUTO':'MACROPROCESSO'}</div><h1>${esc(b.name)}</h1><div class="board-meta">${bpTag(b.status)}${pill('Respons\u00e1vel: '+printOwners(b),'outline')}${pill(openTasks(b).length+' d\u00favidas abertas')}${pill(finalDecisions(b).length+' decis\u00f5es finais','green')}${bpBtn('Editar frente','edit-front',`data-board="${b.id}"`,'tiny')}</div></div><div class="board-summary"><div class="micro">BLUEPRINT PADR\u00c3O</div><div class="big">${bpCoverage(b).ratio}%</div><div class="mini-progress"><i style="width:${bpCoverage(b).ratio}%"></i></div><div class="small">${bpCoverage(b).done}/${bpCoverage(b).total} campos preenchidos</div></div></div></div>${!bpActive(b)?'<div class="bp-inactive-banner">Frente fora do c\u00e1lculo de avan\u00e7o do ciclo. O conte\u00fado pode ser editado ou priorizado.</div>':''}${stageNav(b)}${view.step===-1?`${bpBoardMap(b)}${stageNotes(b)}`:`<div class="section-block"><div class="stage-intro"><div><div class="eyebrow">BLOCO ${pos+1} / ${V10_TABS.length}</div><h2>${esc(tab.name)}</h2></div>${v10Validation(b,view.step)}</div>${({0:stageScope,1:stageASIS,4:stageCSD,5:renderActionPlan}[view.step]||stageScope)(b)}${stageNotes(b)}<div class="stage-bottom">${btn('\u2190 Anterior','prev-step')}<span>${validated(b)}/${V10_TABS.length} blocos validados</span>${pos===V10_TABS.length-1?btn('Acompanhamento','navigate','data-page="tracker"','dark'):btn('Pr\u00f3ximo \u2192','next-step','','dark')}</div></div>${guide(b)}`}</div>`;};
const v10OriginalStageCases=stageCases;
bpBoardMap=function(b){const c=bpCurrentCase(b),all=mapItemsFor(b),ids=new Set((c?.steps||[]).flatMap(s=>s.featureIds)),unlinked=all.filter(f=>!ids.has(f.id));return `<section class="bp-board-blueprint"><div class="v10-blueprint-header"><div class="v10-local-nav" role="tablist" aria-label="Visualiza\u00e7\u00e3o da blueprint"><button type="button" role="tab" aria-selected="${view.bpPane==='map'}" data-action="v10-bp-pane" data-pane="map" class="${view.bpPane==='map'?'active':''}">Jornada</button><button type="button" role="tab" aria-selected="${view.bpPane==='cases'}" data-action="v10-bp-pane" data-pane="cases" class="${view.bpPane==='cases'?'active':''}">Casos de uso <span>${b.cases.length}</span></button></div>${v10Validation(b,-1)}</div>${view.bpPane==='cases'?v10OriginalStageCases(b):`${bpFilters(b)}${c?`<div class="v10-journey-toolbar"><div><span class="micro">CASO DE USO</span><h2>${esc(c.isDefault?'Jornada padr\u00e3o':c.title)}</h2><div class="tags">${bpTag(c.status)}${c.isDefault?pill('Base de refer\u00eancia','outline'):c.profiles.map(p=>pill(p,'outline')).join('')}</div></div><div class="v10-journey-actions">${bpBtn('+ Adicionar etapa','new-stage',`data-board="${b.id}" data-case="${c.uid}"`,'accent')}${btn('Organizar etapas','v10-manage-stages',`data-board="${b.id}" data-case="${c.uid}"`)}${bpBtn('Copiar etapas','copy',`data-board="${b.id}"`)}${bpBtn('Editar caso','edit-case',`data-board="${b.id}" data-case="${c.uid}"`,'ghost')}</div></div>`:''}${c&&!c.steps.length?`<div class="v10-first-step"><h3>Construa a jornada deste caso</h3><p>Comece do zero ou copie as etapas de outro caso de uso. Os campos da blueprint ser\u00e3o preenchidos no workshop.</p>${bpBtn('+ Adicionar primeira etapa','new-stage',`data-board="${b.id}" data-case="${c.uid}"`,'accent')}${bpBtn('Copiar de outro caso','copy',`data-board="${b.id}"`)}</div>`:bpRenderMatrix(b)}<div class="v10-map-end">${c?bpBtn('+ Adicionar etapa ao final','new-stage',`data-board="${b.id}" data-case="${c.uid}"`,'tiny'):''}${bpBtn('Guia de preenchimento','help','','tiny')}</div><details class="v10-release-key"><summary>Refer\u00eancia de cores dos marcos</summary>${v10Legend()}</details>${unlinked.length?`<details class="bp-source-note"><summary>${unlinked.length} funcionalidades sem etapa neste caso</summary><div class="bp-unlinked">${unlinked.map(f=>`<button type="button" data-action="feature-details" data-feature="${f.id}" class="bp-unlinked-row"><span>${f.id}</span><strong>${esc(f.funcionalidade)}</strong>${v10PhaseBadge(v10FeatureRelease(f))}</button>`).join('')}</div></details>`:''}`}</section>`;};
renderJourneyMap=bpBoardMap;

/* A compact stage manager makes structural editing discoverable. */
function v10StageManager(boardId,caseId){const b=boardBy(boardId),c=b?.cases.find(x=>x.uid===caseId);if(!c)return;const body=`<div class="field full v10-manager-context"><strong>${esc(b.name)} \u00b7 ${esc(c.title)}</strong><p>Altere a sequ\u00eancia deste caso. Excluir uma etapa n\u00e3o exclui suas funcionalidades do cat\u00e1logo.</p></div><div class="field full v10-manager-list">${c.steps.map((s,i)=>`<article class="v10-manager-row"><span class="v10-manager-index">${String(i+1).padStart(2,'0')}</span><div class="v10-manager-main"><strong>${esc(s.name)}</strong><div class="tags">${v10PhaseBadge(s.release||'A definir')}${pill(s.featureIds.length+' funcionalidades','outline')}</div></div><div class="v10-manager-actions"><button type="button" class="btn tiny" data-action="v10-stage-up" data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}" ${i===0?'disabled':''} aria-label="Mover ${esc(s.name)} para cima">\u2191</button><button type="button" class="btn tiny" data-action="v10-stage-down" data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}" ${i===c.steps.length-1?'disabled':''} aria-label="Mover ${esc(s.name)} para baixo">\u2193</button>${bpBtn('Editar','edit-stage',`data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}"`,'tiny')}${btn('Excluir','v10-stage-remove',`data-board="${b.id}" data-case="${c.uid}" data-id="${s.uid}"`,'tiny warn')}</div></article>`).join('')||'<div class="empty-box">Este caso ainda n\u00e3o tem etapas.</div>'}</div>`;bpDialog('stage-manager','Organizar etapas',body,{boardId,caseId});document.querySelector('#bp-dialog .bp-dialog-foot').innerHTML=bpBtn('+ Adicionar etapa','new-stage',`data-board="${b.id}" data-case="${c.uid}"`,'accent')+bpBtn('Concluir','close','','dark');}

/* Cases and checkbox controls use a label with a proper text container. */
bpProfilePicker=function(profiles=[]){return `<div class="bp-checks bp-profile-checks">${RELATIONS.map(p=>`<label><input type="checkbox" name="profiles" value="${esc(p)}" ${profiles.includes(p)?'checked':''}><span>${esc(p)}</span></label>`).join('')}</div>`;};
const v10OrigEditCase=bpEditCase;
bpEditCase=function(...args){v10OrigEditCase(...args);const sel=document.querySelector('#bp-case-board');if(sel){for(const opt of sel.options){const b=boardBy(opt.value);if(b)opt.textContent=b.macroId==='usage'?bpMacro(b.macroId).short+' \u203a '+b.name:b.name;}}};
const v10OrigEditForm=editForm;
editForm=function(...args){v10OrigEditForm(...args);const stage=document.querySelector('#modal-form select[name="stage"]');if(stage){const value=stage.value;const effective=['2','3'].includes(value)?'-1':value;stage.innerHTML=bpOptions([['Geral','Geral / transversal'],...V10_TABS.map(x=>[String(x.id),x.name])],effective);}}
const v10OrigNotes=stageNotes;
stageNotes=function(b){if(view.step!==-1)return v10OrigNotes(b);const merged={...b,notes:b.notes.map(n=>['-1','2','3'].includes(String(n.stage))?{...n,stage:-1}:n),csd:b.csd.map(n=>['-1','2','3'].includes(String(n.stage))?{...n,stage:-1}:n)};return v10OrigNotes(merged);};

/* Reclassification: configurable release, original RFI record preserved. */
bpReclassify=function(featureId){const f=MATRIX.items.find(x=>x.id===featureId);if(!f)return;const r=bpRoute(f),b=boardBy(r.boardId)||state.boards[0];bpDialog('reclassify','Reclassificar funcionalidade',bpField('Funcionalidade',`<div class="bp-readonly">${esc(f.id+' \u00b7 '+f.funcionalidade)}</div>`)+bpField('Frente de trabalho',bpSelect('boardId',state.boards.map(x=>[x.id,x.macroId==='usage'?bpMacro(x.macroId).short+' \u203a '+x.name:x.name]),b.id,'id="bp-route-board"'))+bpField('Etapa do caso padr\u00e3o',bpSelect('stepId',[['','Sem etapa atribu\u00edda'],...bpDefault(b).steps.map(s=>[s.uid,s.name])],bpSourceSteps(f)[0]?.uid||'','id="bp-route-step"'))+bpField('Marco da funcionalidade',bpSelect('release',[['__source','Usar marco da fonte: '+f.marco_produto],...BP_PHASES,['Sem fase definida','Marco a definir']],Object.hasOwn(r,'release')?r.release:'__source','id="v10-feature-release"'),true,'O ajuste fica registrado no workspace. O marco da fonte original e o marco da etapa continuam preservados.')+bpField('Motivo do ajuste de marco (opcional)',bpText('releaseReason',r.releaseReason||'',2))+bpField('Situa\u00e7\u00e3o da classifica\u00e7\u00e3o',bpSelect('status',['Proposta de classifica\u00e7\u00e3o','Validada no workshop'],r.status||'Proposta de classifica\u00e7\u00e3o')),{featureId});};
const v10BaseFeatureModal=featureModal;
featureModal=function(id){v10BaseFeatureModal(id);const f=MATRIX.items.find(x=>x.id===id),layer=document.getElementById('feature-layer');if(!f||!layer)return;const r=bpRoute(f);if(Object.hasOwn(r,'release')){const tags=layer.querySelector('.tags');tags?.insertAdjacentHTML('beforeend',pill('Marco revisto no workshop','outline'));}};
const v10BaseCatalog=bpCatalog;
bpCatalog=function(){let html=v10BaseCatalog();html=html.replace('Marco na fonte','Marco da funcionalidade');html=html.replace('<div class="bp-catalog-list">',v10Legend()+'<div class="bp-catalog-list">');return html;};
launchTone=function(x){const p=V10_PHASES[x.phase]||V10_PHASES['Day-1'];return `--tone:${p.tone};--light:${p.light};--darktone:${p.ink};--marker-text:${p.text}`;};
launchFunctions=function(item){const rows=item.featureIds.map(id=>MATRIX.items.find(x=>x.id===id)).filter(Boolean);return rows.length?MAP_AUDIENCES.map(aud=>{const group=rows.filter(x=>x.publico===aud);return group.length?`<div class="lt-feature-group"><div class="lt-feature-label">${esc(aud)} \u00b7 ${group.length} funcionalidades relacionadas</div><div class="lt-features">${group.map(f=>`<button type="button" class="lt-feature" data-action="feature-details" data-feature="${f.id}" style="${v10PhaseStyle(v10FeatureRelease(f))}"><span class="lt-feature-id">${f.id}</span><span class="lt-feature-body"><strong>${esc(f.funcionalidade)}</strong><span>${esc(f.subjornada)} \u00b7 ${esc(f.rfi_ids||'Sem c\u00f3digo RFI direto')}</span></span><span class="lt-tags">${v10PhaseBadge(v10FeatureRelease(f))}${pill(f.status_vendor.replace(' (ecossistema)',''),statusColor(f.status_vendor))}${Object.hasOwn(bpRoute(f),'release')?pill('Revisto no workshop','outline'):''}</span><span class="lt-arrow">\u2197</span></button>`).join('')}</div></div>`:''}).join(''):'<div class="lt-no-items">Nenhuma funcionalidade vinculada a este item.</div>';};
const v10OriginalLaunch=renderLaunchTimeline;
renderLaunchTimeline=function(){return v10OriginalLaunch().replace('class="workspace lt-page"','class="workspace bp-wide lt-page"').replace(/<section class="lt-hero">[\s\S]*?<\/section>/, '<section class="bp-hero"><div class="eyebrow">De Novo</div><h1>Launch <em>Timeline</em></h1></section>').replace('<section class="lt-timeline-card">',v10Legend()+'<section class="lt-timeline-card">');};

/* Runtime wrappers retain existing CRUD, persistence and source data. */
const v10OriginalSaveForm=bpSaveForm;
bpSaveForm=function(e){if(bpModal?.kind==='offer-profiles'){e.preventDefault();const b=boardBy(bpModal.boardId),o=b?.offers.find(x=>x.uid===bpModal.offerId);if(!o)return;const fd=new FormData(e.target);o.eligibility=Object.fromEntries(RELATIONS.map((p,i)=>[p,String(fd.get('eligibility_'+i)||'A definir')]));o.eligibilityNotes=Object.fromEntries(RELATIONS.map((p,i)=>[p,String(fd.get('eligibility_notes_'+i)||'').trim()]));bpCloseDialog();save();render(true);toast('Perfis e condi\u00e7\u00f5es atualizados.');return;}if(bpModal?.kind==='stage-manager'){e.preventDefault();return;}const kind=bpModal?.kind;if(kind==='case')view.bpPane='map';v10OriginalSaveForm(e);};
const v10Click=clickHandler;
clickHandler=function(e){const t=e.target.closest('[data-action]');if(!t)return;const a=t.dataset.action;if(t.closest('form')&&t.type!=='submit')e.preventDefault();
 if(a==='step'){view.step=Number(t.dataset.index);view.guideOpen=false;if([2,3].includes(view.step)){view.bpPane=view.step===2?'cases':'map';view.step=-1;}render(true);return;}
 if(a==='prev-step'||a==='next-step'){const at=V10_TABS.findIndex(x=>x.id===view.step),next=at+(a==='next-step'?1:-1);if(V10_TABS[next]){view.step=V10_TABS[next].id;view.guideOpen=false;render(true);}return;}
 if(['bp-open-front','open-board','launch-open-board','bp-open-case','bp-feature-front'].includes(a))view.bpPane='map';
 if(a==='v10-bp-pane'){view.bpPane=t.dataset.pane;render(true);return;}
 if(a==='v10-offer-profiles'){v10EditOfferProfiles(t.dataset.id);return;}
 if(a==='v10-manage-stages'){v10StageManager(t.dataset.board,t.dataset.case);return;}
 if(['v10-stage-up','v10-stage-down','v10-stage-remove'].includes(a)){const b=boardBy(t.dataset.board),c=b?.cases.find(x=>x.uid===t.dataset.case);if(!c)return;const at=c.steps.findIndex(x=>x.uid===t.dataset.id);if(at<0)return;if(a==='v10-stage-remove'){if(!confirm('Excluir a etapa "'+c.steps[at].name+'" deste caso? As funcionalidades permanecem no cat\u00e1logo.'))return;c.stepHistory=c.stepHistory||[];c.stepHistory.push({ts:new Date().toISOString(),action:'Etapa exclu\u00edda',steps:[clone(c.steps[at])]});c.steps.splice(at,1);}else{const dest=at+(a==='v10-stage-up'?-1:1);if(dest<0||dest>=c.steps.length)return;c.steps.splice(dest,0,c.steps.splice(at,1)[0]);}bpSyncFlow(c);save();render(true);v10StageManager(b.id,c.uid);return;}
 return v10Click(e);
};
const v10Change=onChange;
onChange=function(e){if(e.target.id==='v10-progress'){const b=activeBoard(),idx=Number(e.target.dataset.block),val=Number(e.target.value);if(idx===-1)b.blueprintProgress=val;else b.progress[idx]=val;save();render(true);return;}return v10Change(e);};
const v10Render=render;
render=function(keepScroll=false){v10Render(keepScroll);document.querySelectorAll('.bp-hero>p,.board-head>div>p,.overview-hero>p,.tracker-hero>p,.lt-hero>p,.stage-intro>div>p,.lt-section-hd>div>p').forEach(x=>x.remove());document.querySelectorAll('.workspace').forEach(x=>x.classList.add('bp-wide'));document.querySelectorAll('.bp-catalog-row').forEach(el=>{const f=MATRIX.items.find(x=>x.id===el.dataset.feature);if(f)el.style.cssText+=v10PhaseStyle(v10FeatureRelease(f));});};

/* v11: reusable blueprint registers, scoped operation roles and urgency palette. */
const V11_PHASES={
 'Day-1':{tone:'#c43c32',light:'#fbece9',ink:'#a12d25',text:'#ffffff',order:'01'},
 'Release A':{tone:'#e5b52f',light:'#fff6d9',ink:'#755400',text:'#352900',order:'02'},
 'Release B':{tone:'#428357',light:'#eaf4ed',ink:'#28623b',text:'#ffffff',order:'03'},
 'Release C':{tone:'#3c8187',light:'#eaf4f4',ink:'#286068',text:'#ffffff',order:'04'},
 'Release D':{tone:'#799bb9',light:'#edf3f8',ink:'#385974',text:'#172e43',order:'05'}
};
for(const [key,p] of Object.entries(V11_PHASES)){
 Object.assign(V10_PHASES[key],p);
 Object.assign(LAUNCH_PALETTE[key],{tone:p.tone,light:p.light,darktone:p.ink});
}
v10Legend=function(){return `<div class="v10-release-legend v11-release-legend" aria-label="Urg\u00eancia relativa por marco"><span class="micro">Marcos</span>${Object.entries(V11_PHASES).map(([k,p])=>`<span class="v10-legend-phase" style="${v10PhaseStyle(k)}"><i>${p.order}</i>${esc(k)}</span>`).join('')}<small>Mais imediato \u2192 ondas seguintes. Cor n\u00e3o indica conclus\u00e3o.</small></div>`;};
const V11_REG={
 channels:{singular:'Canal',plural:'Canais',ids:'channelIds',tone:'channel',example:'Ex.: App whitelabel',description:'Por onde o ator executa a etapa.'},
 operations:{singular:'Opera\u00e7\u00e3o',plural:'Opera\u00e7\u00f5es',ids:'operationIds',tone:'operation',example:'Ex.: Opera\u00e7\u00f5es de cadastro',description:'\u00c1rea respons\u00e1vel e pa\u00eds. O papel \u00e9 definido em cada etapa.'},
 systems:{singular:'Sistema',plural:'Sistemas',ids:'systemIds',tone:'system',example:'Ex.: Savana',description:'Sistema respons\u00e1vel pela execu\u00e7\u00e3o.'},
 capabilities:{singular:'Capacidade',plural:'Capacidades',ids:'capabilityIds',tone:'capability',example:'Ex.: Valida\u00e7\u00e3o de identidade',description:'Capacidade necess\u00e1ria ou ativada na etapa.'}
};
const V11_COUNTRIES=[['','Pa\u00eds a definir'],['BR','Brasil'],['US','EUA'],['PT','Portugal']];
const v11NormName=s=>String(s||'').normalize('NFC').trim().replace(/\s+/g,' ').toLocaleLowerCase('pt-BR');
const v11Country=c=>V11_COUNTRIES.find(x=>x[0]===c)?.[1]||c||'Pa\u00eds a definir';
const v11List=kind=>Array.isArray(state[kind])?state[kind]:[];
const v11Entry=(kind,id)=>v11List(kind).find(x=>x.id===id);
const v11Inactive=x=>['Inativo','Desativado'].includes(x?.status);
function v11Flag(country){
 const base='class="v11-flag" viewBox="0 0 24 16" width="24" height="16" role="img" aria-label="'+esc(v11Country(country))+'"';
 if(country==='BR')return `<svg ${base}><rect width="24" height="16" rx="2" fill="#169447"/><path d="M12 2 22 8 12 14 2 8Z" fill="#ffdf35"/><circle cx="12" cy="8" r="3.6" fill="#245397"/><path d="M8.6 7.2q3.7-1 6.9 1.8" fill="none" stroke="#fff" stroke-width=".8"/></svg>`;
 if(country==='US')return `<svg ${base}><rect width="24" height="16" rx="2" fill="#fff"/><path d="M0 1.1H24M0 3.6H24M0 6.1H24M0 8.6H24M0 11.1H24M0 13.6H24M0 15.7H24" stroke="#c43b46" stroke-width="1.25"/><path d="M2 0H10V8.7H0V2Q0 0 2 0" fill="#294677"/><path d="M2 2h.4m2 0h.4m2 0h.4M3 3.8h.4m2 0h.4m2 0h.4M2 5.6h.4m2 0h.4m2 0h.4M3 7.3h.4m2 0h.4m2 0h.4" stroke="#fff" stroke-width="1"/></svg>`;
 if(country==='PT')return `<svg ${base}><rect width="24" height="16" rx="2" fill="#d5393c"/><path d="M2 0h7.6v16H2Q0 16 0 14V2Q0 0 2 0" fill="#187144"/><circle cx="9.6" cy="8" r="3.4" fill="#e9c948"/><path d="M7.9 5.8h3.4v3q-1.7 2.3-3.4 0Z" fill="#fff" stroke="#bb3435" stroke-width=".8"/><path d="M8.8 7.2h1.5v1.6H8.8z" fill="#33598d"/></svg>`;
 return `<span class="v11-country-unset" aria-hidden="true">?</span>`;
}
function v11Icon(kind){const paths={channels:'<rect x="2.5" y="3" width="13" height="9" rx="1.8"/><path d="M6 15h6m-3-3v3"/>',systems:'<ellipse cx="9" cy="4" rx="6" ry="2.3"/><path d="M3 4v9c0 3 12 3 12 0V4M3 8.5c0 3 12 3 12 0"/>',operations:'<rect x="4" y="2.5" width="10" height="13" rx="1"/><path d="M7 6h1m2 0h1M7 9h1m2 0h1M8 15v-3h2v3"/>',capabilities:'<path d="m9 2 6 3.5v7L9 16l-6-3.5v-7Z"/><path d="m3 5.5 6 3.7 6-3.7M9 9v7"/>'};return `<svg class="v11-type-icon" viewBox="0 0 18 18" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.capabilities}</svg>`;}
function v11Tag(kind,record){return `<span class="v11-tag v11-${V11_REG[kind].tone}" title="${esc(record.description||record.name)}">${v11Icon(kind)}<span>${esc(record.name)}</span>${v11Inactive(record)?'<small>Inativo</small>':''}</span>`;}
function v11OperationCard(record,role=''){return `<div class="v11-operation-card"><strong class="v11-area-name">${esc(record.name)}</strong><span class="v11-country">${v11Flag(record.country)}${esc(v11Country(record.country))}${v11Inactive(record)?' \u00b7 Inativa':''}</span>${role?`<p>${nl(role)}</p>`:'<small class="v11-role-empty">Papel a definir nesta etapa</small>'}</div>`;}
function v11Steps(out=state){return out.boards.flatMap(b=>b.cases.flatMap(c=>c.steps||[]));}
function v11SyncStep(s,out=state){
 const names=(kind,ids)=>(ids||[]).map(id=>out[kind].find(x=>x.id===id)?.name).filter(Boolean).join(' \u00b7 ');
 s.channel=names('channels',s.channelIds);s.system=names('systems',s.systemIds);
 s.operationOwner=names('operations',s.operationLinks.map(x=>x.areaId));
 s.operationRole=s.operationLinks.map(x=>x.role).filter(Boolean).join('\n');
}
function v11Normalize(out){
 if(!out)return out;
 out.formatVersion='11.0';out.registryHistory=Array.isArray(out.registryHistory)?out.registryHistory:[];
 for(const kind of ['channels','operations','systems'])out[kind]=Array.isArray(out[kind])?out[kind]:[];
 function fromLegacy(kind,value){const name=String(value||'').trim();let r=out[kind].find(x=>v11NormName(x.name)===v11NormName(name)&&(kind!=='operations'||!x.country));if(!r){r={id:qid(),name,description:'Importado do preenchimento anterior.',status:'Ativo',origin:'legacy-blueprint'};if(kind==='operations')r.country='';out[kind].push(r);}return r.id;}
 for(const s of v11Steps(out)){
  for(const [kind,field,legacy] of [['channels','channelIds','channel'],['systems','systemIds','system']]){
   if(!Array.isArray(s[field])){s[field]=[];if(bpMeaningful(s[legacy])){s.legacyBlueprintText={...s.legacyBlueprintText,[legacy]:s[legacy]};s[field]=[fromLegacy(kind,s[legacy])];}}
   s[field]=[...new Set(s[field].filter(x=>typeof x==='string'))];
   for(const id of s[field])if(!out[kind].some(x=>x.id===id))out[kind].push({id,name:'Registro a revisar ('+id+')',description:'V\u00ednculo importado sem cadastro correspondente.',status:'Inativo'});
  }
  if(!Array.isArray(s.operationLinks)){
   s.operationLinks=[];
   if(bpMeaningful(s.operationOwner)){s.legacyBlueprintText={...s.legacyBlueprintText,operationOwner:s.operationOwner,operationRole:s.operationRole||''};s.operationLinks=[{areaId:fromLegacy('operations',s.operationOwner),role:s.operationRole||''}];}
   else if(bpMeaningful(s.operationRole)&&!s.operationNotes)s.operationNotes=s.operationRole;
  }
  s.operationLinks=s.operationLinks.filter(x=>x&&typeof x.areaId==='string').map(x=>({...x,role:String(x.role||'')}));
  for(const link of s.operationLinks)if(!out.operations.some(x=>x.id===link.areaId))out.operations.push({id:link.areaId,name:'\u00c1rea a revisar ('+link.areaId+')',country:'',description:'V\u00ednculo importado sem cadastro correspondente.',status:'Inativo'});
  v11SyncStep(s,out);
 }
 return out;
}
const v11BaseNormalize=normalizeState;
normalizeState=function(src){return v11Normalize(v11BaseNormalize(src));};

const v11BaseBlank=bpBlankStep;
bpBlankStep=function(...args){return {...v11BaseBlank(...args),channelIds:[],systemIds:[],operationLinks:[],operationNotes:''};};
const v11BaseLane=bpLaneContent;
bpLaneContent=function(s,key,b){
 if(s.placeholder)return v11BaseLane(s,key,b);
 if(key==='channel'||key==='system'){const kind=key==='channel'?'channels':'systems',ids=s[V11_REG[kind].ids]||[];return ids.length?`<div class="v11-tag-list">${ids.map(id=>v11Entry(kind,id)).filter(Boolean).map(r=>v11Tag(kind,r)).join('')}</div>`:`<span class="bp-empty">${key==='channel'?'Vincular canal':'Vincular sistema'}</span>`;}
 if(key==='operation')return (s.operationLinks||[]).length||s.operationNotes?`<div class="v11-area-list">${(s.operationLinks||[]).map(x=>{const r=v11Entry('operations',x.areaId);return r?v11OperationCard(r,x.role):'';}).join('')}${s.operationNotes?`<p class="v11-operation-note">${nl(s.operationNotes)}</p>`:''}</div>`:'<span class="bp-empty">Vincular \u00e1rea e definir papel</span>';
 return v11BaseLane(s,key,b);
};
bpCoverage=function(b,includeVariants=false){const steps=(includeVariants?b.cases:[bpDefault(b)]).filter(Boolean).flatMap(c=>c.steps).filter(s=>s.status!=='Desativado');let done=0;for(const s of steps)done+=[bpMeaningful(s.actor),(s.channelIds||[]).length>0,(s.operationLinks||[]).length>0&&s.operationLinks.every(x=>bpMeaningful(x.role)),(s.systemIds||[]).length>0,s.capabilityIds.length>0||bpMeaningful(s.capabilityNotes),bpMeaningful(s.support)].filter(Boolean).length;return {done,total:steps.length*6,steps:steps.length,ratio:steps.length?Math.round(done/(steps.length*6)*100):0};};
function v11Usage(kind,id){return v11Steps().filter(s=>kind==='operations'?(s.operationLinks||[]).some(x=>x.areaId===id):(s[V11_REG[kind].ids]||[]).includes(id)).length;}
function v11RegistryContent(kind){const d=V11_REG[kind],records=v11List(kind);return `<section class="canvas-card v11-registry-card">${cardHeading(d.plural,'',btn('+ '+(kind==='operations'?'\u00c1rea':d.singular),'v11-new-record',`data-kind="${kind}"`,'dark'))}<div class="v11-registry-tools"><p>${esc(d.description)}</p><input type="search" class="search" data-v11-registry-search placeholder="Buscar ${esc(d.plural.toLowerCase())}" aria-label="Buscar ${esc(d.plural.toLowerCase())}"></div>${records.length?`<div class="v11-registry-list">${records.map(r=>`<article class="v11-registry-row" data-v11-query="${esc(v11NormName(r.name+' '+(r.country?v11Country(r.country):'')+' '+r.description))}"><div class="v11-registry-main">${kind==='operations'?`${v11Tag(kind,r)}<span class="v11-country">${v11Flag(r.country)}${esc(v11Country(r.country))}</span>`:v11Tag(kind,r)}${r.description?`<p>${esc(r.description)}</p>`:''}</div><span class="v11-usage">${v11Usage(kind,r.id)} etapa(s)</span>${pill(v11Inactive(r)?'Inativo':'Ativo',v11Inactive(r)?'outline':'green')}${btn('Editar','v11-edit-record',`data-kind="${kind}" data-id="${esc(r.id)}"`,'tiny')}</article>`).join('')}</div><p class="v11-search-empty" hidden>Nenhum cadastro encontrado.</p>`:`<div class="v11-empty-register"><strong>Nenhum ${kind==='operations'?'registro de opera\u00e7\u00e3o':d.singular.toLowerCase()} cadastrado</strong><p>Cadastre aqui ou diretamente ao preencher uma etapa da blueprint.</p></div>`}<div class="v11-register-foot">Cadastros s\u00e3o compartilhados entre as frentes. Inativar impede novos v\u00ednculos, sem apagar os existentes.</div></section>`;}
const v11BaseRegistry=bpRegistry;
bpRegistry=function(){const template=document.createElement('template');template.innerHTML=v11BaseRegistry();const tabs=template.content.querySelector('.bp-registry-tabs');tabs.innerHTML=[['people','Pessoas'],['processes','Processos e frentes'],['channels','Canais'],['operations','Opera\u00e7\u00f5es'],['systems','Sistemas'],['capabilities','Capacidades e v\u00ednculos']].map(([id,text])=>bpBtn(text,'registry-tab',`data-id="${id}"`,view.registryTab===id?'dark':'')).join('');if(['channels','operations','systems'].includes(view.registryTab)){while(tabs.nextElementSibling)tabs.nextElementSibling.remove();tabs.insertAdjacentHTML('afterend',v11RegistryContent(view.registryTab));}return template.innerHTML;};
function v11LinkLabels(){document.querySelectorAll('#bp-dialog .field').forEach((el,i)=>{const label=el.querySelector(':scope > label'),control=el.querySelector(':scope > input,:scope > textarea,:scope > select');if(label&&control){if(!control.id)control.id='v11-control-'+i;label.htmlFor=control.id;}});}
function v11RecordDialog(kind,id=''){if(!V11_REG[kind])return;const d=V11_REG[kind],r=v11Entry(kind,id)||{};let body=bpField(kind==='operations'?'Nome da \u00e1rea':'Nome do '+d.singular.toLowerCase(),bpInput('name',r.name||'',true));if(kind==='operations')body+=bpField('Pa\u00eds da opera\u00e7\u00e3o',bpSelect('country',V11_COUNTRIES,r.country||''));body+=bpField('Descri\u00e7\u00e3o (opcional)',bpText('description',r.description||'',2));body+=bpField('Status',bpSelect('status',['Ativo','Inativo'],r.status||'Ativo'));body+=`<p class="field full bp-context-note">${id?'Alterar este cadastro atualiza sua identifica\u00e7\u00e3o em todas as etapas vinculadas.':'Este cadastro ficar\u00e1 dispon\u00edvel em todas as frentes.'}${kind==='operations'?' O papel da \u00e1rea \u00e9 preenchido em cada etapa.':''}</p>`;bpDialog('v11-record',id?'Editar '+d.singular.toLowerCase():'Cadastrar '+d.singular.toLowerCase(),body,{registryKind:kind,recordId:id});}
function v11Selected(kind,rec){return kind==='operations'?(rec.operationLinks||[]).map(x=>x.areaId):rec[V11_REG[kind].ids]||[];}
function v11Choices(kind,selected=[]){const d=V11_REG[kind],records=v11List(kind).filter(r=>!v11Inactive(r)||selected.includes(r.id));if(!records.length)return `<div class="v11-picker-empty">Nenhum cadastro dispon\u00edvel. Adicione o primeiro abaixo.</div>`;return records.map(r=>`<label class="v11-choice ${selected.includes(r.id)?'is-selected':''}" data-v11-query="${esc(v11NormName(r.name+' '+(r.country?v11Country(r.country):'')))}"><input type="checkbox" name="${d.ids}" value="${esc(r.id)}" ${selected.includes(r.id)?'checked':''}><span class="v11-choice-content">${kind==='operations'?`${v11Tag(kind,r)}<span class="v11-country">${v11Flag(r.country)}${esc(v11Country(r.country))}${v11Inactive(r)?' \u00b7 Inativa':''}</span>`:v11Tag(kind,r)}</span></label>`).join('');}
function v11Picker(kind,rec){const d=V11_REG[kind];return `<div class="v11-picker" data-v11-picker="${kind}"><div class="v11-picker-top"><input type="search" data-v11-search="${kind}" placeholder="Buscar ${esc(d.plural.toLowerCase())} no cadastro" aria-label="Buscar ${esc(d.plural.toLowerCase())} no cadastro"><span class="v11-selected-count">${v11Selected(kind,rec).length} selecionado(s)</span></div><div class="v11-choices">${v11Choices(kind,v11Selected(kind,rec))}</div><p class="v11-search-empty" hidden>Nenhum resultado. Cadastre um novo item abaixo.</p>${kind==='operations'?'<div class="v11-operation-roles"></div>':''}<details class="v11-inline-create"><summary>+ Cadastrar ${kind==='operations'?'nova \u00e1rea':d.singular.toLowerCase()} aqui</summary><div class="v11-inline-form"><div class="field"><label for="v11-new-name-${kind}">${kind==='operations'?'Nome da \u00e1rea':'Nome'}</label><input id="v11-new-name-${kind}" data-v11-new-name maxlength="1000" placeholder="${esc(d.example)}"></div>${kind==='operations'?`<div class="field"><label for="v11-new-country-${kind}">Pa\u00eds</label><select id="v11-new-country-${kind}" data-v11-new-country>${bpOptions(V11_COUNTRIES,'')}</select></div>`:''}<div class="field"><label for="v11-new-description-${kind}">Descri\u00e7\u00e3o (opcional)</label><input id="v11-new-description-${kind}" data-v11-new-description maxlength="2000" placeholder="Como identificar este cadastro"></div><p class="v11-inline-error" role="alert"></p>${btn('Cadastrar e selecionar','v11-inline-add',`data-kind="${kind}"`,'dark')}<small>O cadastro \u00e9 salvo agora. O v\u00ednculo, ao salvar a etapa.</small></div></details></div>`;}
function v11OperationRoles(){const picker=document.querySelector('[data-v11-picker="operations"]');if(!picker||!bpModal)return;bpModal.operationDrafts=bpModal.operationDrafts||{};picker.querySelectorAll('[data-v11-operation-role]').forEach(el=>bpModal.operationDrafts[el.dataset.v11OperationRole]=el.value);const ids=[...picker.querySelectorAll('input[name="operationIds"]:checked')].map(x=>x.value);picker.querySelector('.v11-operation-roles').innerHTML=ids.map(id=>{const r=v11Entry('operations',id);if(!r)return '';return `<div class="v11-role-field"><span class="v11-role-title"><strong>${esc(r.name)}</strong><span class="v11-country">${v11Flag(r.country)}${esc(v11Country(r.country))}</span></span><label for="v11-role-${esc(id)}">Papel desta \u00e1rea na etapa</label><textarea id="v11-role-${esc(id)}" data-v11-operation-role="${esc(id)}" name="operationRole:${esc(id)}" rows="2" maxlength="20000" placeholder="O que esta \u00e1rea precisa fazer?">${esc(bpModal.operationDrafts[id]||'')}</textarea></div>`;}).join('');}
function v11FilterPicker(kind){const picker=document.querySelector(`[data-v11-picker="${kind}"]`);if(!picker)return;const q=v11NormName(picker.querySelector('[data-v11-search]').value);let visible=0;picker.querySelectorAll('.v11-choice').forEach(el=>{const yes=el.dataset.v11Query.includes(q);el.hidden=!yes;if(yes)visible++;el.classList.toggle('is-selected',el.querySelector('input').checked);});picker.querySelector('.v11-search-empty').hidden=!q||visible>0;picker.querySelector('.v11-selected-count').textContent=picker.querySelectorAll('input[type=checkbox]:checked').length+' selecionado(s)';}
function v11RefreshPicker(kind,extraId=''){const picker=document.querySelector(`[data-v11-picker="${kind}"]`);if(!picker)return;if(kind==='operations')v11OperationRoles();const selected=[...picker.querySelectorAll('input[type=checkbox]:checked')].map(x=>x.value);if(extraId&&!selected.includes(extraId))selected.push(extraId);picker.querySelector('.v11-choices').innerHTML=v11Choices(kind,selected);if(extraId)picker.querySelector('[data-v11-search]').value='';if(kind==='operations')v11OperationRoles();v11FilterPicker(kind);}
const v11BaseEditStage=bpEditStage;
bpEditStage=function(boardId,caseId,stepId='',focus=''){
 v11BaseEditStage(boardId,caseId,stepId,focus);if(bpModal?.kind!=='stage')return;
 const b=boardBy(boardId),c=b?.cases.find(x=>x.uid===bpModal.caseId),rec=c?.steps.find(s=>s.uid===stepId)||bpBlankStep();
 bpModal.operationDrafts=Object.fromEntries((rec.operationLinks||[]).map(x=>[x.areaId,x.role||'']));
 for(const [lane,kind] of [['channel','channels'],['operation','operations'],['system','systems'],['capabilities','capabilities']]){
  const el=document.querySelector('#bp-editor-'+lane+' .bp-editor-fields');if(!el)continue;
  el.innerHTML=v11Picker(kind,rec)+(kind==='operations'?bpField('Observa\u00e7\u00f5es da opera\u00e7\u00e3o (opcional)',bpText('operationNotes',rec.operationNotes||'',2)):'')+(kind==='capabilities'?bpField('Papel das capacidades / condi\u00e7\u00f5es de ativa\u00e7\u00e3o',bpText('capabilityNotes',rec.capabilityNotes||'',2)):'');
 }
 v11OperationRoles();v11LinkLabels();
 if(focus)requestAnimationFrame(()=>{const el=document.getElementById('bp-editor-'+focus);el?.scrollIntoView({block:'start'});el?.querySelector('input[type="search"],textarea,input:not([type="checkbox"])')?.focus({preventScroll:true});});
};
function v11LogRegistry(action,kind,record,previous=null){state.registryHistory.push({at:new Date().toISOString(),action,kind,id:record.id,before:previous,after:clone(record)});}
function v11InlineAdd(kind){const picker=document.querySelector(`[data-v11-picker="${kind}"]`);if(!picker)return;const name=picker.querySelector('[data-v11-new-name]').value.trim(),description=picker.querySelector('[data-v11-new-description]').value.trim(),country=picker.querySelector('[data-v11-new-country]')?.value||'',error=picker.querySelector('.v11-inline-error');error.textContent='';if(!name){error.textContent='Informe o nome do cadastro.';picker.querySelector('[data-v11-new-name]').focus();return;}let r=v11List(kind).find(x=>v11NormName(x.name)===v11NormName(name)&&(kind!=='operations'||(x.country||'')===country));if(r&&v11Inactive(r)){error.textContent='Este cadastro est\u00e1 inativo. Reative-o na lista de cadastros antes de criar novos v\u00ednculos.';return;}const isNew=!r;if(!r){r={id:qid(),name,description,status:kind==='capabilities'?'Em defini\u00e7\u00e3o':'Ativo'};if(kind==='operations')r.country=country;state[kind].push(r);v11LogRegistry('Criado pela blueprint',kind,r);save();}v11RefreshPicker(kind,r.id);picker.querySelector('.v11-inline-create').open=false;picker.querySelector('[data-v11-new-name]').value='';picker.querySelector('[data-v11-new-description]').value='';if(picker.querySelector('[data-v11-new-country]'))picker.querySelector('[data-v11-new-country]').value='';toast(isNew?'Cadastro criado e selecionado. Salve a etapa para confirmar o v\u00ednculo.':'Cadastro existente selecionado, sem duplicar.');}
const v11BaseSaveForm=bpSaveForm;
bpSaveForm=function(e){
 if(bpModal?.kind==='v11-record'){
  e.preventDefault();const fd=new FormData(e.target),v=k=>String(fd.get(k)||'').trim(),kind=bpModal.registryKind,id=bpModal.recordId,list=v11List(kind);
  if(!v('name'))return bpError('Informe o nome.');
  if(list.some(x=>x.id!==id&&v11NormName(x.name)===v11NormName(v('name'))&&(kind!=='operations'||(x.country||'')===v('country'))))return bpError(kind==='operations'?'Esta \u00e1rea j\u00e1 est\u00e1 cadastrada neste pa\u00eds.':'J\u00e1 existe um cadastro com este nome.');
  const record=list.find(x=>x.id===id)||{id:qid()},before=id?clone(record):null;Object.assign(record,{name:v('name'),description:v('description'),status:v('status')});if(kind==='operations')record.country=v('country');if(!id)list.push(record);v11LogRegistry(id?'Atualizado':'Criado',kind,record,before);for(const s of v11Steps())v11SyncStep(s);bpCloseDialog();save();render(true);toast('Cadastro atualizado em todas as etapas vinculadas.');return;
 }
 if(bpModal?.kind==='stage'){
  e.preventDefault();const ctx={...bpModal},fd=new FormData(e.target),v=k=>String(fd.get(k)||'').trim(),ids=k=>[...new Set(fd.getAll(k).map(String))],b=boardBy(ctx.boardId),c=b?.cases.find(x=>x.uid===ctx.caseId);if(!c)return;
  if(!v('name'))return bpError('Informe o nome da etapa.');const s=c.steps.find(x=>x.uid===ctx.stepId)||bpBlankStep();
  for(const key of ['name','actor','capabilityNotes','support','release','status','notes','nature','operationNotes'])s[key]=v(key);
  s.channelIds=ids('channelIds').filter(id=>v11Entry('channels',id));s.systemIds=ids('systemIds').filter(id=>v11Entry('systems',id));s.capabilityIds=ids('capabilityIds').filter(id=>v11Entry('capabilities',id));s.featureIds=ids('featureIds').filter(id=>MATRIX.items.some(f=>f.id===id));
  s.operationLinks=ids('operationIds').filter(id=>v11Entry('operations',id)).map(id=>({areaId:id,role:v('operationRole:'+id)}));
  v11SyncStep(s);s.updatedAt=new Date().toISOString();if(!ctx.stepId)c.steps.push(s);bpSyncFlow(c);bpCloseDialog();save();render(true);toast('Etapa salva com os cadastros vinculados.');return;
 }
 return v11BaseSaveForm(e);
};
const v11BaseClick=clickHandler;
clickHandler=function(e){const t=e.target.closest('[data-action]');if(!t)return;const a=t.dataset.action;if(a==='v11-inline-add'){e.preventDefault();v11InlineAdd(t.dataset.kind);return;}if(a==='v11-new-record'||a==='v11-edit-record'){e.preventDefault();v11RecordDialog(t.dataset.kind,t.dataset.id||'');return;}return v11BaseClick(e);};
const v11BaseChange=onChange;
onChange=function(e){const picker=e.target.closest('[data-v11-picker]');if(picker&&e.target.type==='checkbox'){v11FilterPicker(picker.dataset.v11Picker);if(picker.dataset.v11Picker==='operations')v11OperationRoles();return;}return v11BaseChange(e);};
const v11BaseInput=onInput;
onInput=function(e){if(e.target.dataset.v11Search){v11FilterPicker(e.target.dataset.v11Search);return;}if(e.target.hasAttribute('data-v11-registry-search')){const q=v11NormName(e.target.value);let count=0;document.querySelectorAll('.v11-registry-row').forEach(el=>{el.hidden=!el.dataset.v11Query.includes(q);if(!el.hidden)count++;});const empty=document.querySelector('.v11-registry-card .v11-search-empty');if(empty)empty.hidden=!q||count>0;return;}return v11BaseInput(e);};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-v11-search],[data-v11-new-name],[data-v11-new-description]')){e.preventDefault();if(e.target.hasAttribute('data-v11-new-name'))v11InlineAdd(e.target.closest('[data-v11-picker]').dataset.v11Picker);}});
/* Source palette, names and country are stored independently from delivery status. */


/* V12 · Icon/color catalog + Actor registry, retaining previous JSON. */
V11_PHASES['Release C']={tone:'#2f76b7',light:'#eaf2fd',ink:'#225a93',text:'#ffffff',order:'04'};
V11_PHASES['Release D']={tone:'#7b56b4',light:'#f2ebfa',ink:'#5c3d89',text:'#ffffff',order:'05'};
for(const ph of ['Release C','Release D']){
 Object.assign(V10_PHASES[ph],V11_PHASES[ph]);
 Object.assign(LAUNCH_PALETTE[ph],{tone:V11_PHASES[ph].tone,light:V11_PHASES[ph].light,darktone:V11_PHASES[ph].ink});
}
V11_REG.actors={singular:'Ator',plural:'Atores',ids:'actorIds',tone:'actor',example:'Ex.: Cliente',description:'Quem executa de fato a etapa: cliente, comercial, operação ou outro ator.'};
const V12_VIS_DEFAULTS={actors:{color:'#257a75',icon:'user'},channels:{color:'#7547a4',icon:'smartphone'},systems:{color:'#286b9e',icon:'server'},operations:{color:'#535b68',icon:'building'},capabilities:{color:'#626c7c',icon:'shield'}};
const V12_SWATCHES=['#bb4038','#da7924','#d4a42a','#37845c','#257a75','#2f76b7','#7547a4','#535b68'];
const V12_ICONS={
 'user':['Pessoa','<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>'],
 'users':['Pessoas','<path d="M16 21v-2a5 5 0 0 0-10 0v2"/><circle cx="11" cy="8" r="3"/><path d="M19 21v-2a5 5 0 0 0-3-4.6M17 5a3 3 0 0 1 0 6"/>'],
 'briefcase':['Comercial','<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 13h18"/>'],
 'smartphone':['Aplicativo','<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'],
 'monitor':['Web','<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 22h8M12 17v5"/>'],
 'globe':['Internacional','<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c-5 5-5 13 0 18M12 3c5 5 5 13 0 18"/>'],
 'building':['Backoffice','<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-4h4v4"/>'],
 'landmark':['Banco','<path d="m2 9 10-6 10 6M3 9h18M5 9v10m5-10v10m4-10v10m5-10v10M2 21h20"/>'],
 'server':['Servidor','<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h7M11 17h7"/>'],
 'database':['Dados','<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0"/>'],
 'network':['Integração','<circle cx="12" cy="4" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 6v6M5 17l7-5 7 5"/>'],
 'layers':['Camadas','<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>'],
 'shield':['Controle','<path d="M12 2 21 6v6c0 5-4 9-9 10-5-1-9-5-9-10V6z"/><path d="m8 12 3 3 5-6"/>'],
 'credit-card':['Cartão','<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>'],
 'file-check':['Documento','<path d="M6 2h8l5 5v15H6zM14 2v5h5M9 15l2 2 4-4"/>'],
 'headphones':['Atendimento','<path d="M3 15v-4a9 9 0 0 1 18 0v4M3 14h3v6H3zM18 14h3v6h-3zM18 20c0 2-3 3-6 3"/>'],
 'mail':['Mensagem','<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m2 7 10 7 10-7"/>'],
 'settings':['Configuração','<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2M19.1 4.9l-2.2 2.2m-9.8 9.8-2.2 2.2"/>'],
 'wallet':['Carteira','<rect x="2" y="6" width="20" height="15" rx="2"/><path d="M2 8V5a2 2 0 0 1 2-2h14M15 13h7v5h-7z"/>'],
 'send':['Transferência','<path d="m2 12 20-9-7 19-3-8-10-2ZM12 14l10-11"/>'],
 'check':['Conferência','<path d="m4 12 5 5L20 6"/>'],
 'workflow':['Orquestração','<rect x="2" y="3" width="8" height="6" rx="1"/><rect x="14" y="15" width="8" height="6" rx="1"/><path d="M10 6h7a3 3 0 0 1 3 3v6M17 9l3 3 3-3"/>']
};
const v12Hex=x=>typeof x==='string'&&/^#[0-9a-fA-F]{6}$/.test(x)?x.toLowerCase():null;
function v12IconSvg(icon,cls='v11-type-icon'){const o=V12_ICONS[icon]||V12_ICONS['layers'];return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${o[1]}</svg>`;}
function v12Color(kind,rec){return v12Hex(rec?.color)||V12_VIS_DEFAULTS[kind]?.color||'#626c7c';}
function v12Icon(kind,rec){return V12_ICONS[rec?.icon]?rec.icon:V12_VIS_DEFAULTS[kind]?.icon||'layers';}
const v12OldSyncStep=v11SyncStep;
v11SyncStep=function(s,out=state){v12OldSyncStep(s,out);if(Array.isArray(s.actorIds))s.actor=s.actorIds.map(id=>out.actors?.find(x=>x.id===id)?.name).filter(Boolean).join(' · ');};
const v12OldNormalize=normalizeState;
normalizeState=function(src){const out=v12OldNormalize(src);if(!out)return null;out.formatVersion='12.0';out.actors=Array.isArray(out.actors)?out.actors:[];
 for(const kind of ['actors','channels','systems','operations','capabilities'])for(const r of out[kind]||[]){if(!v12Hex(r.color))r.color=V12_VIS_DEFAULTS[kind].color;if(!V12_ICONS[r.icon])r.icon=V12_VIS_DEFAULTS[kind].icon;}
 for(const s of v11Steps(out)){
  if(!Array.isArray(s.actorIds)){
   s.actorIds=[];if(bpMeaningful(s.actor)){
    const name=String(s.actor).trim();let actor=out.actors.find(x=>v11NormName(x.name)===v11NormName(name));if(!actor){actor={id:qid(),name,description:'Importado da blueprint anterior.',status:'Ativo',color:V12_VIS_DEFAULTS.actors.color,icon:V12_VIS_DEFAULTS.actors.icon,origin:'legacy-blueprint'};out.actors.push(actor);}
    s.actorIds=[actor.id];
   }
  }
  s.actorIds=[...new Set(s.actorIds.filter(id=>typeof id==='string'))];
  for(const id of s.actorIds)if(!out.actors.some(x=>x.id===id))out.actors.push({id,name:'Ator a revisar ('+id+')',description:'Referência importada sem cadastro.',status:'Inativo',color:V12_VIS_DEFAULTS.actors.color,icon:'user'});
  v11SyncStep(s,out);
 }
 return out;
};

const v12OldBlank=bpBlankStep;
bpBlankStep=function(...args){return {...v12OldBlank(...args),actorIds:[]};};
const v12OldUsage=v11Usage;
v11Usage=function(kind,id){if(kind==='actors')return v11Steps().filter(s=>(s.actorIds||[]).includes(id)).length;return v12OldUsage(kind,id);};
const v12OldTag=v11Tag;
v11Tag=function(kind,record){const c=v12Color(kind,record);return `<span class="v11-tag v11-${V11_REG[kind].tone}" style="--v12-color:${c}" title="${esc(record.description||record.name)}">${v12IconSvg(v12Icon(kind,record))}<span>${esc(record.name)}</span>${v11Inactive(record)?'<small>Inativo</small>':''}</span>`;};
v11OperationCard=function(record,role=''){return `<div class="v11-operation-card" style="--v12-color:${v12Color('operations',record)}"><span class="v12-area-heading">${v12IconSvg(v12Icon('operations',record))}<strong class="v11-area-name">${esc(record.name)}</strong></span><span class="v11-country">${v11Flag(record.country)}${esc(v11Country(record.country))}${v11Inactive(record)?' · Inativa':''}</span>${role?`<p>${nl(role)}</p>`:'<small class="v11-role-empty">Papel a definir nesta etapa</small>'}</div>`;};
const v12OldLane=bpLaneContent;
bpLaneContent=function(s,key,b){if(s.placeholder)return v12OldLane(s,key,b);if(key==='actor'){const rows=(s.actorIds||[]).map(id=>v11Entry('actors',id)).filter(Boolean);return rows.length?`<div class="v11-tag-list">${rows.map(r=>v11Tag('actors',r)).join('')}</div>`:'<span class="bp-empty">Vincular ator</span>';}
 if(key==='capabilities'){const caps=(s.capabilityIds||[]).map(id=>bpCap(id)).filter(Boolean);return (caps.length||s.capabilityNotes)?`<div class="v11-tag-list">${caps.map(r=>`<div>${v11Tag('capabilities',r)}${bpCapacityOwners(r.id,b)?`<small style="display:block;margin:4px 0 0;color:#78787d">${esc(bpCapacityOwners(r.id,b))}</small>`:''}</div>`).join('')}${s.capabilityNotes?`<p style="font-size:11px;color:#777">${nl(s.capabilityNotes)}</p>`:''}</div>`:'<span class="bp-empty">Vincular capacidade</span>';}
 return v12OldLane(s,key,b);
};
bpCoverage=function(b,includeVariants=false){const steps=(includeVariants?b.cases:[bpDefault(b)]).filter(Boolean).flatMap(c=>c.steps||[]).filter(s=>s.status!=='Desativado');const done=steps.reduce((count,s)=>count+[(s.actorIds||[]).length>0,(s.channelIds||[]).length>0,(s.operationLinks||[]).length>0&&s.operationLinks.every(x=>bpMeaningful(x.role)),(s.systemIds||[]).length>0,(s.capabilityIds||[]).length>0||bpMeaningful(s.capabilityNotes),bpMeaningful(s.support)].filter(Boolean).length,0);return {done,total:steps.length*6,steps:steps.length,ratio:steps.length?Math.round(done/(steps.length*6)*100):0};};
/* Users can pick a palette color or use an arbitrary HEX color; icon selection is visual. */
function v12VisualControls(kind,r={},inline=false){const color=v12Color(kind,r),icon=v12Icon(kind,r);const name=inline?'-inline-'+kind:'-record-'+kind;
 return `<div class="v12-visual-custom ${inline?'v12-inline-visual':''}"><span class="v12-visual-title">Cor da tag</span><div class="v12-color-row"><div class="v12-color-swatches">${V12_SWATCHES.map(c=>`<label class="v12-color-swatch" title="${c}"><input type="radio" name="visualSwatch${name}" value="${c}" ${c===color?'checked':''} data-v12-swatch><span style="--swatch:${c}"></span></label>`).join('')}</div><label class="v12-color-custom">Personalizada <input type="color" name="color" value="${color}" data-v12-color aria-label="Selecionar cor personalizada"></label></div><span class="v12-visual-title">Ícone</span><div class="v12-icon-grid">${Object.entries(V12_ICONS).map(([id,[title]])=>`<label class="v12-icon-choice" title="${esc(title)}"><input type="radio" name="icon" value="${id}" ${id===icon?'checked':''} aria-label="${esc(title)}">${v12IconSvg(id)}</label>`).join('')}</div><p class="v12-visual-hint">A cor e o ícone acompanham este cadastro em todas as blueprints.</p></div>`;
}
const v12OldRegistry=bpRegistry;
bpRegistry=function(){const html=v12OldRegistry();if(view.registryTab!=='actors')return html;const template=document.createElement('template');template.innerHTML=html;const tabs=template.content.querySelector('.bp-registry-tabs');if(!tabs)return html;tabs.insertAdjacentHTML('beforeend',bpBtn('Atores','registry-tab','data-id="actors"','dark'));while(tabs.nextElementSibling)tabs.nextElementSibling.remove();tabs.insertAdjacentHTML('afterend',v11RegistryContent('actors'));return template.innerHTML;};
/* Add the Actor tab also to all other registry sections. */
const v12OriginalRegistry=bpRegistry;
bpRegistry=function(){let html=v12OriginalRegistry();if(view.registryTab==='actors')return html;const template=document.createElement('template');template.innerHTML=html;const tabs=template.content.querySelector('.bp-registry-tabs');tabs?.insertAdjacentHTML('beforeend',bpBtn('Atores','registry-tab','data-id="actors"',''));if(view.registryTab==='capabilities'){const first=tabs?.nextElementSibling;if(first){const t=document.createElement('template');t.innerHTML=v11RegistryContent('capabilities');first.replaceWith(t.content.firstElementChild);}}return template.innerHTML;};
/* Registration dialogs and inline form both expose icon and color controls. */
v11RecordDialog=function(kind,id=''){if(!V11_REG[kind])return;const d=V11_REG[kind],r=v11Entry(kind,id)||{};let body=bpField(kind==='operations'?'Nome da área':'Nome do '+d.singular.toLowerCase(),bpInput('name',r.name||'',true));if(kind==='operations')body+=bpField('País da operação',bpSelect('country',V11_COUNTRIES,r.country||''));body+=bpField('Descrição (opcional)',bpText('description',r.description||'',2));body+=v12VisualControls(kind,r,false);body+=bpField('Status',bpSelect('status',kind==='capabilities'?['Em definição','Ativo','Inativo']:['Ativo','Inativo'],r.status||(kind==='capabilities'?'Em definição':'Ativo')));body+=`<p class="field full bp-context-note">${id?'Alterar este cadastro atualiza sua identificação em todas as etapas vinculadas.':'Este cadastro ficará disponível em todas as frentes.'}${kind==='operations'?' O papel da área é preenchido em cada etapa.':''}</p>`;bpDialog('v11-record',id?'Editar '+d.singular.toLowerCase():'Cadastrar '+d.singular.toLowerCase(),body,{registryKind:kind,recordId:id});};
const v12OldPicker=v11Picker;
v11Picker=function(kind,rec){return v12OldPicker(kind,rec).replace('<p class="v11-inline-error" role="alert"></p>',v12VisualControls(kind,{},true)+'<p class="v11-inline-error" role="alert"></p>');};
const v12OldStageEdit=bpEditStage;
bpEditStage=function(boardId,caseId,stepId='',focus=''){
 v12OldStageEdit(boardId,caseId,stepId,focus);if(bpModal?.kind!=='stage')return;
 const b=boardBy(boardId),c=b?.cases.find(x=>x.uid===bpModal.caseId),rec=c?.steps.find(s=>s.uid===stepId)||bpBlankStep();
 const el=document.querySelector('#bp-editor-actor .bp-editor-fields');if(el)el.innerHTML=v11Picker('actors',rec);v11LinkLabels();
 if(focus==='actor')requestAnimationFrame(()=>document.querySelector('#bp-editor-actor [data-v11-search="actors"]')?.focus({preventScroll:true}));
};
const v12OldInline=v11InlineAdd;
v11InlineAdd=function(kind){const picker=document.querySelector(`[data-v11-picker="${kind}"]`);if(!picker)return;const name=picker.querySelector('[data-v11-new-name]')?.value.trim()||'',country=picker.querySelector('[data-v11-new-country]')?.value||'';const color=picker.querySelector('[data-v12-color]')?.value||V12_VIS_DEFAULTS[kind].color,icon=picker.querySelector('.v12-inline-visual input[name="icon"]:checked')?.value||V12_VIS_DEFAULTS[kind].icon;
 v12OldInline(kind);
 const record=v11List(kind).find(x=>v11NormName(x.name)===v11NormName(name)&&(kind!=='operations'||(x.country||'')===country));if(record){let changed=false;if(!record.color){record.color=v12Hex(color)||V12_VIS_DEFAULTS[kind].color;changed=true;}if(!record.icon){record.icon=V12_ICONS[icon]?icon:V12_VIS_DEFAULTS[kind].icon;changed=true;}if(changed){v11LogRegistry('Identidade visual inicial',kind,record);save();v11RefreshPicker(kind,record.id);}}
};
/* Save stage, actor references and catalog tokens as one operation. */
const v12BaseSaveForm=bpSaveForm;
bpSaveForm=function(e){
 if(bpModal?.kind==='v11-record'){
  e.preventDefault();const fd=new FormData(e.target),v=k=>String(fd.get(k)||'').trim(),kind=bpModal.registryKind,id=bpModal.recordId,list=v11List(kind);
  if(!v('name'))return bpError('Informe o nome.');
  if(list.some(x=>x.id!==id&&v11NormName(x.name)===v11NormName(v('name'))&&(kind!=='operations'||(x.country||'')===v('country'))))return bpError(kind==='operations'?'Esta área já está cadastrada neste país.':'Já existe um cadastro com este nome.');
  const record=list.find(x=>x.id===id)||{id:qid()},before=id?clone(record):null;
  Object.assign(record,{name:v('name'),description:v('description'),status:v('status'),color:v12Hex(v('color'))||V12_VIS_DEFAULTS[kind].color,icon:V12_ICONS[v('icon')]?v('icon'):V12_VIS_DEFAULTS[kind].icon});if(kind==='operations')record.country=v('country');if(!id)list.push(record);
  v11LogRegistry(id?'Atualizado':'Criado',kind,record,before);for(const s of v11Steps())v11SyncStep(s);bpCloseDialog();save();render(true);toast('Cadastro, cor e ícone atualizados nas etapas vinculadas.');return;
 }
 if(bpModal?.kind==='stage'){
  e.preventDefault();const ctx={...bpModal},fd=new FormData(e.target),v=k=>String(fd.get(k)||'').trim(),ids=k=>[...new Set(fd.getAll(k).map(String))],b=boardBy(ctx.boardId),c=b?.cases.find(x=>x.uid===ctx.caseId);if(!c)return;
  if(!v('name'))return bpError('Informe o nome da etapa.');const requirements=v17ReadDataForm(e.target);if(requirements.some(x=>!x.name))return bpError('Informe o nome de cada dado antes de salvar.');if(requirements.some(x=>x.providerId&&!v17ProviderExists(x.providerKind,x.providerId)))return bpError('Selecione um fornecedor válido para cada dado.');if(fd.has('dataNotApplicable')&&requirements.length)return bpError('Para marcar sem dados adicionais, remova os dados cadastrados nesta etapa.');const s=c.steps.find(x=>x.uid===ctx.stepId)||bpBlankStep();
  for(const key of ['name','capabilityNotes','support','release','status','notes','nature','operationNotes','objective'])s[key]=v(key);s.dataRequirements=requirements;s.dataNotApplicable=fd.has('dataNotApplicable');
  s.actorIds=ids('actorIds').filter(id=>v11Entry('actors',id));s.channelIds=ids('channelIds').filter(id=>v11Entry('channels',id));s.systemIds=ids('systemIds').filter(id=>v11Entry('systems',id));s.capabilityIds=ids('capabilityIds').filter(id=>v11Entry('capabilities',id));s.featureIds=ids('featureIds').filter(id=>MATRIX.items.some(f=>f.id===id));
  s.operationLinks=ids('operationIds').filter(id=>v11Entry('operations',id)).map(id=>({areaId:id,role:v('operationRole:'+id)}));
  v11SyncStep(s);s.updatedAt=new Date().toISOString();if(!ctx.stepId)c.steps.push(s);bpSyncFlow(c);bpCloseDialog();save();render(true);toast('Etapa salva com os cadastros vinculados.');return;
 }
 return v12BaseSaveForm(e);
};
/* Keep editor's icon & color controls synchronized when palette swatches are chosen. */
const v12BaseChange=onChange;
onChange=function(e){
 if(e.target.matches('[data-v12-swatch]')){const box=e.target.closest('.v12-visual-custom');const color=box?.querySelector('[data-v12-color]');if(color)color.value=e.target.value;return;}
 if(e.target.matches('[data-v12-color]')){const box=e.target.closest('.v12-visual-custom');box?.querySelectorAll('[data-v12-swatch]').forEach(el=>el.checked=el.value.toLowerCase()===e.target.value.toLowerCase());return;}
 return v12BaseChange(e);
};


/* v13 workspace improvements. */
const V13_ICON={
 save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v6h8"/></svg>',
 focus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M8 21h8M12 17v4M8 8h8M8 12h5"/></svg>',
 collapse:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M16 9l-3 3 3 3"/></svg>',
 expand:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M13 9l3 3-3 3"/></svg>',
 folder:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3Z"/></svg>'
};
view.sidebarCollapsed=false;
view.homeCaseByBoard={};
const v13NormalizeOriginal=normalizeState;
// The seed already preserves the historical v13 archive. Imported user records
// must never be cleaned again based on a display version.
normalizeState=function(src){const out=v13NormalizeOriginal(src);if(!out)return null;out.formatVersion='13.0';return out;};

const v13BaseFilters=bpFilters;
bpFilters=function(b=null){let html=v13BaseFilters(b);if(b)return html;return html.replace(/<label>Caso de uso<select id="bp-case">[\s\S]*?<\/select><\/label>/,'');};

// Scope case selections per product: selecting a variant never hides the other fronts.
bpGroups=function(contextBoard=null){
 const grouped=[];
 for(const m of state.macros){
  if(!contextBoard&&view.bpMacro!=='all'&&m.id!==view.bpMacro)continue;
  if(contextBoard&&m.id!==contextBoard.macroId)continue;
  const groups=[];
  for(const b of state.boards.filter(x=>x.macroId===m.id)){
   if(contextBoard&&b.id!==contextBoard.id)continue;
   if(!contextBoard&&view.bpStatus!=='all'&&b.status!==view.bpStatus)continue;
   let c;
   if(contextBoard)c=bpCurrentCase(b)||bpDefault(b);
   else c=b.cases.find(x=>x.uid===view.homeCaseByBoard[b.id])||bpDefault(b);
   if(!c)continue;
   if(view.bpProfile!=='all'&&!c.profiles.includes(view.bpProfile))continue;
   const matching=(c.steps||[]).filter(s=>view.bpRelease==='all'||(view.bpRelease==='none'?!s.release:s.release===view.bpRelease));
   if(!matching.length&&view.bpRelease!=='all')continue;
   const shown=matching.length?matching:[{uid:'placeholder-'+b.id,name:'Etapas a definir',placeholder:true}];
   groups.push({b,c,steps:shown});
  }
  if(groups.length)grouped.push({m,groups});
 }
 return grouped;
};

const v13BaseSidebar=sidebar;
sidebar=function(){let s=v13BaseSidebar();s=s.replace('<aside class="sidebar">',`<aside class="sidebar"><div class="v13-side-header"><button type="button" class="v13-collapse" data-action="v13-toggle-sidebar" title="${view.sidebarCollapsed?'Expandir':'Recolher'} menu" aria-label="${view.sidebarCollapsed?'Expandir':'Recolher'} menu" aria-expanded="${!view.sidebarCollapsed}">${V13_ICON[view.sidebarCollapsed?'expand':'collapse']}</button></div>`);
 s=s.replace(/<div class="sidebar-end">[\s\S]*?<\/div><\/aside>$/,'</aside>');
 return s;
};

renderTopbar=function(){return `<header class="topbar"><div class="brand"><img class="brand-logo" alt="Ita\u00fa" src="${LOGO}"><div><div class="brand-name">Novas jornadas Offshore</div><div class="brand-caption">New Bank \u00b7 Workshop de defini\u00e7\u00e3o</div></div></div><div class="toptools"><div class="saved" id="save-indicator" role="status" aria-live="polite"><i></i><span>${storageOK?'Salvo neste navegador':'Exporte para salvar'}</span></div>${jsonReconnectNeeded?btn('Reconectar JSON','reconnect-json','','tiny'):''}<button type="button" class="btn accent v13-toolbar-icon" data-action="save-json" title="Salvar JSON" aria-label="Salvar JSON">${V13_ICON.save}</button><button type="button" class="btn ghost v13-toolbar-icon" data-action="focus" title="Modo apresenta\u00e7\u00e3o" aria-label="Modo apresenta\u00e7\u00e3o">${V13_ICON.focus}</button><button type="button" class="btn ghost v13-toolbar-icon" data-action="import-json" title="Abrir JSON local" aria-label="Abrir JSON local">${V13_ICON.folder}</button><details class="dropdown"><summary class="btn dark">Exportar <span>\u2304</span></summary><div class="dropdown-panel"><button data-action="export-portable">Exportar HTML preenchido</button><button data-action="export-json">Baixar c\u00f3pia JSON</button><button data-action="export-csv" data-what="cases">Exportar casos de uso (CSV)</button><button data-action="export-csv" data-what="csd">Exportar CSD / pend\u00eancias (CSV)</button><button data-action="export-csv" data-what="actions">Exportar plano de a\u00e7\u00e3o (CSV)</button><button data-action="export-csv" data-what="progress">Exportar acompanhamento (CSV)</button><button data-action="print">Imprimir tela atual</button></div></details></div></header>`;};

// Accessible session settings sit with other workspace navigation controls.
const v13SidebarSettings=sidebar;
sidebar=function(){let s=v13SidebarSettings();return s.replace('<div class="nav-caption">Frentes de trabalho</div>',`${bpNavItem('Configurar workshop','settings','\u2699')}<div class="nav-caption">Frentes de trabalho</div>`).replace('data-action="navigate" data-page="settings"','data-action="v13-settings"');};

// Edit owners in a single dropdown, with optional co-owners collapsed by default.
const v13BaseEditEntity=bpEditEntity;
bpEditEntity=function(kind,id){
 if(kind!=='front')return v13BaseEditEntity(kind,id);
 const b=boardBy(id);if(!b)return;
 const owner=b.ownerIds?.[0]||'',extra=(b.ownerIds||[]).slice(1);
 const ownerOptions=[['','Herdar do macroprocesso / a definir'],...state.people.filter(p=>p.status!=='Inativo'||b.ownerIds?.includes(p.id)).map(p=>[p.id,p.name])];
 const extraPicker=`<details class="v13-extra-owners"><summary>Adicionar outros respons\u00e1veis (opcional)</summary><div class="bp-checks">${state.people.filter(p=>p.status!=='Inativo'||extra.includes(p.id)).map(p=>`<label><input type="checkbox" name="v13ExtraOwner" value="${esc(p.id)}" ${extra.includes(p.id)?'checked':''}><span>${esc(p.name)}</span></label>`).join('')}</div></details>`;
 let body=bpField('Macroprocesso',`<div class="bp-readonly">${esc(bpMacroLabel(b))}</div>`)+bpField('Nome da frente',bpInput('name',b.name,true))+bpField('Descri\u00e7\u00e3o',bpText('summary',b.summary))+bpField('Status',bpSelect('status',BP_STATUS,b.status))+bpField('Respons\u00e1vel pela frente',bpSelect('v13Owner',ownerOptions,owner,'class="v13-owner-picker"'))+extraPicker;
 bpDialog('front-v13','Editar frente',body,{id:b.id});
};

const v13BaseSaveForm=bpSaveForm;
bpSaveForm=function(e){
 if(bpModal?.kind!=='front-v13')return v13BaseSaveForm(e);
 e.preventDefault();const b=boardBy(bpModal.id);if(!b)return;
 const fd=new FormData(e.target),name=String(fd.get('name')||'').trim();if(!name)return bpError('Informe o nome da frente.');
 const primary=String(fd.get('v13Owner')||'');const extras=fd.getAll('v13ExtraOwner').map(String);
 const selected=[...new Set([primary,...extras].filter(Boolean))].filter(id=>state.people.some(p=>p.id===id));
 Object.assign(b,{name,short:name,summary:String(fd.get('summary')||'').trim(),status:String(fd.get('status')||b.status),ownerIds:selected});
 if(b.macroId!=='usage'){const m=bpMacro(b.macroId);m.status=b.status;m.ownerIds=[...b.ownerIds];}
 bpCloseDialog();bpUpdateOwners();save();render(true);toast('Frente e respons\u00e1veis atualizados.');
};

// Catalog as a compact single-column list with a stage indicator, not a colored border.
const v13BaseCatalog=bpCatalog;
bpCatalog=function(){const html=v13BaseCatalog();const t=document.createElement('template');t.innerHTML=html;const rows=t.content.querySelectorAll('.bp-catalog-row');
 rows.forEach(row=>{
  const f=MATRIX.items.find(x=>x.id===row.dataset.feature);if(!f)return;
  const r=bpRoute(f),b=boardBy(r.boardId),m=bpMacro(r.macroId),steps=bpSourceSteps(f);
  row.classList.add('v13-feature-row');
  row.innerHTML=`<span class="bp-fid">${esc(f.id)}</span><div class="bp-catalog-body"><span class="micro">${esc(m?.short||'A classificar')} \u00b7 ${esc(b?.name||'Frente a definir')}</span><h3>${esc(f.funcionalidade)}</h3><div class="v13-feature-meta"><span class="v13-feature-step">Etapa: ${esc(steps.map(s=>s.name).join(' / ')||'A definir')}</span></div><div class="tags">${pill(f.publico,'outline')}${v10PhaseBadge(v10FeatureRelease(f))}${pill(f.status_vendor,statusColor(f.status_vendor))}</div></div><span class="bp-open-arrow">\u2197</span>`;
 });
 return t.innerHTML;
};

const v13BaseClick=clickHandler;
clickHandler=function(e){const t=e.target.closest('[data-action]');if(!t)return;
 if(t.dataset.action==='v13-toggle-sidebar'){view.sidebarCollapsed=!view.sidebarCollapsed;render(true);return;}
 if(t.dataset.action==='v13-settings'){editForm('session');return;}
 if(t.dataset.action==='clear'&&view.page==='overview')view.homeCaseByBoard={};
 return v13BaseClick(e);
};
const v13BaseChange=onChange;
onChange=function(e){
 if(e.target.dataset.v13HomeCase){const boardId=e.target.dataset.v13HomeCase;
  const b=boardBy(boardId);if(!b||!b.cases.some(c=>c.uid===e.target.value))return;
  view.homeCaseByBoard[boardId]=e.target.value;
  const left=document.querySelector('.bp-scroll')?.scrollLeft||0;
  render(true);const el=document.querySelector('.bp-scroll');if(el)el.scrollLeft=left;
  return;
 }
 return v13BaseChange(e);
};

// Preserve scroll and collapsed navigation after the existing page renderer.
const v13BaseRender=render;
render=function(keepScroll=false){v13BaseRender(keepScroll);app.classList.toggle('sidebar-collapsed',view.sidebarCollapsed);
 document.querySelectorAll('.sidebar .nav-btn').forEach(el=>{const label=el.querySelector('.navtxt')?.textContent.trim().replace(/\s+/g,' ');if(label){el.title=label;el.setAttribute('aria-label',label);}});
};


/* v15 | Case chooser, people photos and multi-owner editor.
   No changes to blueprint records or their IDs. */
function v15ValidPhoto(photo){return typeof photo==='string'&& /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo);}
function v15Initials(name){return String(name||'?').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?';}
function v15Avatar(p,size='md'){
 const photo=v15ValidPhoto(p?.photo)?`<img src="${p.photo}" alt="" loading="lazy">`:esc(v15Initials(p?.name));
 return `<span class="v15-avatar ${size}" title="${esc(p?.name||'Responsavel')}" aria-hidden="true">${photo}</span>`;
}
function v15PersonLabel(p,size='xs'){
 if(!p)return '';return `<span class="v15-owner" title="${esc(p.name)}">${v15Avatar(p,size)}<span class="v15-owner-name">${esc(p.name)}</span></span>`;
}
function v15PersonList(ids,missing='A definir'){
 const people=[...new Set(ids||[])].map(id=>bpPerson(id)).filter(Boolean);
 return people.length?`<span class="v15-owner-group">${people.map(p=>v15PersonLabel(p)).join('')}</span>`:esc(missing);
}
function v15FrontOwnerIds(b){const direct=b.ownerIds||[];return direct.length?direct:(bpMacro(b.macroId)?.ownerIds||[]);}
function v15PeopleByName(text){
 const clean=String(text||'').trim();if(!clean)return null;
 let prefix='',raw=clean;
 const pref=raw.match(/^((?:Respons[aá]vel|Respons[aá]veis)|Dono|Owner):\s*/i);
 if(pref){prefix=pref[0];raw=raw.slice(prefix.length);}
 const groups=raw.split(/\s*\/\s*/).map(x=>x.trim()).filter(Boolean);
 if(!groups.length)return null;
 const people=groups.map(name=>state.people.find(p=>p.name.trim().toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')));
 return people.every(Boolean)?`${prefix?'<span class="v15-person-prefix">'+esc(prefix)+'</span> ':''}<span class="v15-owner-group">${people.map(p=>v15PersonLabel(p)).join('')}</span>`:null;
}
function v15DecorateVisibleOwners(){
 const app=document.getElementById('app');if(!app)return;
 app.querySelectorAll('.bp-person-list .bp-review-row').forEach(row=>{
  const name=row.querySelector('strong')?.textContent.trim();const p=state.people.find(x=>x.name===name);
  const old=row.querySelector('.bp-avatar');if(old&&p){old.innerHTML=v15Avatar(p,'lg');old.dataset.v15Ready='1';}
 });
 const selector=['.bp-macro button small','.bp-track-table tbody td:nth-child(2)',
  '.board-meta .pill','.bp-process-list .bp-review-row small','.bp-resp-list small',
  '.bp-cap-item small','.v11-tag-list small','.bp-front-card small','.action-meta span',
  '.decision-foot small','.meeting-head span','.csd-item .foot span','.bp-review-row small',
  '.bp-person-responsibility small','.owner-row .name','.owner-row .role'].join(',');
 app.querySelectorAll(selector).forEach(el=>{
  if(el.dataset.v15Decorated)return;
  const txt=el.textContent.trim();let markup=v15PeopleByName(txt);
  if(!markup&&txt.includes(' \u00b7 ')){
    const parts=txt.split(' \u00b7 '),first=v15PeopleByName(parts[0]),last=v15PeopleByName(parts[parts.length-1]);
    if(first)markup=first+' \u00b7 '+esc(parts.slice(1).join(' \u00b7 '));
    else if(last)markup=esc(parts.slice(0,-1).join(' \u00b7 '))+' \u00b7 '+last;
  }
  if(markup){el.innerHTML=markup;el.dataset.v15Decorated='1';}
 });
}
const v15OldBoardMap=bpBoardMap;
bpBoardMap=function(b){let html=v15OldBoardMap(b);
 if(view.bpPane!=='cases'){
  // One selector in the journey title instead of another large form control.
  html=html.replace(/<label>Caso de uso<select id="bp-case">[\s\S]*?<\/select><\/label>/,'');
  const cases=b.cases.map(c=>[c.uid,c.isDefault?'Jornada padr\u00e3o':c.title]);
  const current=(bpCurrentCase(b)||bpDefault(b))?.uid||'';
  const control=`<div class="v15-case-control"><select id="bp-case" aria-label="Selecionar caso de uso da frente ${esc(b.name)}" title="Selecionar outro caso de uso">${bpOptions(cases,current)}</select></div>`;
  html=html.replace(/(<span class="micro">CASO DE USO<\/span>)<h2>[\s\S]*?<\/h2>/,`$1${control}`);
 }
 return html;
};
function v15PeoplePickerHTML(){
 const ids=bpModal?.ownerDraft||[];
 const picked=ids.map(id=>bpPerson(id)).filter(Boolean);
 const options=state.people.filter(p=>(p.status!=='Inativo'||ids.includes(p.id))&&!ids.includes(p.id));
 return `<div class="v15-owner-picker"><div class="v15-picked" id="v15-owner-selected">${picked.length?picked.map(p=>`<span class="v15-owner-chip">${v15PersonLabel(p)}<button type="button" data-action="v15-remove-owner" data-id="${esc(p.id)}" title="Remover ${esc(p.name)}" aria-label="Remover ${esc(p.name)}">\u00d7</button></span>`).join(''):'<span class="v15-hint">Nenhum respons\u00e1vel selecionado.</span>'}</div><div class="v15-add-owner"><select id="v15-owner-add" aria-label="Adicionar respons\u00e1vel"><option value="">+ Adicionar respons\u00e1vel</option>${options.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></div><p class="v15-hint">Selecione quantas pessoas forem necess\u00e1rias. Fotos e nomes s\u00e3o obtidos do cadastro de Pessoas.</p></div>`;
}
function v15RefreshOwnerPicker(){const el=document.querySelector('#bp-dialog .v15-owner-picker');if(el)el.outerHTML=v15PeoplePickerHTML();}
function v15FrontDialog(id){const b=boardBy(id);if(!b)return;
 const body=bpField('Macroprocesso',`<div class="bp-readonly">${esc(bpMacroLabel(b))}</div>`)
  +bpField('Nome da frente',bpInput('name',b.name,true))
  +bpField('Descri\u00e7\u00e3o',bpText('summary',b.summary))
  +bpField('Status',bpSelect('status',BP_STATUS,b.status))
  +bpField('Respons\u00e1veis pela frente',`<div id="v15-owner-holder"></div>`,true,'Sem v\u00ednculo pr\u00f3prio, a frente herda os respons\u00e1veis pelo macroprocesso.');
 bpDialog('front-v15','Editar frente',body,{id:b.id,ownerDraft:[...(b.ownerIds||[])]});
 const holder=document.getElementById('v15-owner-holder');if(holder)holder.innerHTML=v15PeoplePickerHTML();
}
function v15MacroDialog(id){const m=bpMacro(id);if(!m)return;
 const body=bpField('Macroprocesso',`<div class="bp-readonly">${esc(m.name)}</div>`)
  +bpField('Status',bpSelect('status',BP_STATUS,m.status))
  +bpField('Respons\u00e1veis pelo macroprocesso',`<div id="v15-owner-holder"></div>`,true);
 bpDialog('macro-v15','Editar macroprocesso',body,{id:m.id,ownerDraft:[...(m.ownerIds||[])]});
 const holder=document.getElementById('v15-owner-holder');if(holder)holder.innerHTML=v15PeoplePickerHTML();
}
function v15PhotoPreviewHTML(person){return v15Avatar({name:person?.name||'Pessoa',photo:bpModal?.photoDraft||''},'lg');}
function v15PersonDialog(id=''){
 const person=state.people.find(p=>p.id===id)||{};
 const body=bpField('Nome',bpInput('name',person.name||'',true))
  +bpField('Papel / \u00e1rea',bpInput('role',person.role||''))
  +bpField('E-mail (opcional)',bpInput('email',person.email||''))
  +bpField('Status',bpSelect('status',['Ativo','Inativo'],person.status||'Ativo'))
  +bpField('Foto de perfil',`<div class="v15-photo-box"><div id="v15-photo-preview">${v15Avatar(person,'lg')}</div><div class="v15-photo-controls"><input id="v15-person-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Selecionar foto de perfil"><small class="v15-hint">JPG, PNG ou WebP. A imagem ser\u00e1 otimizada e salva no JSON local.</small><button type="button" data-action="v15-remove-photo">Remover foto</button></div></div>`,true);
 bpDialog('person-v15',id?'Editar pessoa':'Cadastrar pessoa',body,{id,photoDraft:v15ValidPhoto(person.photo)?person.photo:'',photoBusy:false});
}
const v15PreviousEntity=bpEditEntity;
bpEditEntity=function(kind,id){if(kind==='person')return v15PersonDialog(id);if(kind==='front')return v15FrontDialog(id);if(kind==='macro')return v15MacroDialog(id);return v15PreviousEntity(kind,id);};
const v15PreviousSave=bpSaveForm;
bpSaveForm=function(e){
 const ctx=bpModal;if(!ctx||!['person-v15','front-v15','macro-v15'].includes(ctx.kind))return v15PreviousSave(e);
 e.preventDefault();const fd=new FormData(e.target),val=k=>String(fd.get(k)||'').trim();
 if(ctx.kind==='person-v15'){
  if(ctx.photoBusy)return bpError('A foto ainda est\u00e1 sendo processada.');
  const name=val('name');if(!name)return bpError('Informe o nome da pessoa.');
  let p=state.people.find(x=>x.id===ctx.id)||{id:qid()};
  if(state.people.some(x=>x.id!==p.id&&x.name.toLocaleLowerCase('pt-BR')===name.toLocaleLowerCase('pt-BR')))return bpError('J\u00e1 existe uma pessoa com esse nome.');
  Object.assign(p,{name,role:val('role'),email:val('email'),status:val('status')||'Ativo',photo:v15ValidPhoto(ctx.photoDraft)?ctx.photoDraft:''});
  if(!ctx.id)state.people.push(p);
 }else if(ctx.kind==='front-v15'){
  const b=boardBy(ctx.id),name=val('name');if(!b||!name)return bpError('Informe o nome da frente.');
  const ownerIds=[...new Set(ctx.ownerDraft||[])].filter(id=>state.people.some(p=>p.id===id));
  Object.assign(b,{name,short:name,summary:val('summary'),status:val('status')||b.status,ownerIds});
  if(b.macroId!=='usage'){const m=bpMacro(b.macroId);if(m){m.status=b.status;m.ownerIds=[...ownerIds];}}
 }else if(ctx.kind==='macro-v15'){
  const m=bpMacro(ctx.id);if(!m)return;
  m.status=val('status')||m.status;m.ownerIds=[...new Set(ctx.ownerDraft||[])].filter(id=>state.people.some(p=>p.id===id));
  if(m.id!=='usage'){const b=boardBy(m.boards[0]);if(b){b.status=m.status;b.ownerIds=[...m.ownerIds];}}
 }
 bpCloseDialog();bpUpdateOwners();save();render(true);toast('Altera\u00e7\u00f5es salvas. Use Salvar JSON para atualizar o arquivo local.');
};
function v15HandlePhoto(file){
 if(!bpModal||bpModal.kind!=='person-v15'||!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){bpError('Envie JPG, PNG ou WebP de at\u00e9 5 MB.');return;}
 const current=bpModal;current.photoBusy=true;
 const reader=new FileReader();
 reader.onerror=()=>{if(bpModal===current){current.photoBusy=false;bpError('N\u00e3o foi poss\u00edvel ler a foto.');}};
 reader.onload=()=>{
  const img=new Image();
  img.onerror=()=>{if(bpModal===current){current.photoBusy=false;bpError('A foto n\u00e3o p\u00f4de ser aberta.');}};
  img.onload=()=>{
   if(bpModal!==current)return;
   try{
    const canvas=document.createElement('canvas');canvas.width=176;canvas.height=176;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,176,176);
    const side=Math.min(img.naturalWidth,img.naturalHeight);
    ctx.drawImage(img,(img.naturalWidth-side)/2,(img.naturalHeight-side)/2,side,side,0,0,176,176);
    current.photoDraft=canvas.toDataURL('image/jpeg',.78);
    const prev=document.getElementById('v15-photo-preview'),name=document.querySelector('#bp-form [name="name"]')?.value||'Pessoa';
    if(prev)prev.innerHTML=v15PhotoPreviewHTML({name});
    const err=document.getElementById('bp-form-error');if(err)err.textContent='';
   }catch(err){bpError('N\u00e3o foi poss\u00edvel otimizar a foto.');}finally{current.photoBusy=false;}
  };img.src=String(reader.result||'');
 };reader.readAsDataURL(file);
}
const v15PreviousClick=clickHandler;
clickHandler=function(e){const btn=e.target.closest('[data-action]');
 if(btn?.dataset.action==='v15-remove-owner'&&bpModal?.ownerDraft){bpModal.ownerDraft=bpModal.ownerDraft.filter(id=>id!==btn.dataset.id);v15RefreshOwnerPicker();return;}
 if(btn?.dataset.action==='v15-remove-photo'&&bpModal?.kind==='person-v15'){
  bpModal.photoDraft='';const name=document.querySelector('#bp-form [name="name"]')?.value||'Pessoa';
  const el=document.getElementById('v15-photo-preview');if(el)el.innerHTML=v15PhotoPreviewHTML({name});
  const file=document.getElementById('v15-person-photo');if(file)file.value='';return;
 }
 return v15PreviousClick(e);
};
const v15PreviousChange=onChange;
onChange=function(e){
 if(e.target.id==='v15-person-photo'){v15HandlePhoto(e.target.files?.[0]);return;}
 if(e.target.id==='v15-owner-add'&&bpModal?.ownerDraft){const id=e.target.value;
  if(id&&!bpModal.ownerDraft.includes(id)&&state.people.some(p=>p.id===id))bpModal.ownerDraft.push(id);
  v15RefreshOwnerPicker();return;
 }
 return v15PreviousChange(e);
};
const v15PreviousRender=render;
render=function(...args){v15PreviousRender(...args);v15DecorateVisibleOwners();};


/* v16 | Direct case selection inside the context row, status layout, compact navigation. */
const V16_EDIT_ICON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/></svg>';
const v16PreviousBoardView=boardView;
boardView=function(){
 const markup=v16PreviousBoardView(),b=activeBoard();
 if(!b)return markup;
 const tmp=document.createElement('template');tmp.innerHTML=markup;
 const meta=tmp.content.querySelector('.board-meta');
 if(meta){
  const ownerIds=v15FrontOwnerIds(b),people=v15PersonList(ownerIds,'A definir');
  const ownerLabel=ownerIds.length>1?'Responsáveis':'Responsável';
  meta.innerHTML=bpTag(b.status)+`<span class="v16-owner-meta"><span class="v16-meta-label">${ownerLabel}</span>${people}</span>`+`<button type="button" class="v16-edit-front" data-action="bp-edit-front" data-board="${esc(b.id)}" title="Editar frente" aria-label="Editar frente">${V16_EDIT_ICON}</button>`;
 }
 const summary=tmp.content.querySelector('.board-summary');
 if(summary){const cov=bpCoverage(b),questions=openTasks(b).length,decisions=finalDecisions(b).length;
  summary.innerHTML=`<div class="v16-summary-line"><div class="micro">BLUEPRINT PADRÃO</div><div class="big">${cov.ratio}%</div></div><div class="mini-progress"><i style="width:${cov.ratio}%"></i></div><div class="small">${cov.done}/${cov.total} campos preenchidos</div><div class="v16-summary-stats"><div class="v16-summary-stat"><strong>${questions}</strong><span>Dúvidas abertas</span></div><div class="v16-summary-stat"><strong>${decisions}</strong><span>Decisões finais</span></div></div>`;
 }
 return tmp.innerHTML;
};
// Use the original blueprint layout: no select in the large journey title.
// bpFilters(b) keeps its native 'Caso de uso' filter; the context row has a compact selector too.
bpBoardMap=function(b){return v15OldBoardMap(b);};
const v16OriginalRenderMatrix=bpRenderMatrix;
bpRenderMatrix=function(contextBoard){
 const raw=v16OriginalRenderMatrix(contextBoard);
 const tmp=document.createElement('template');tmp.innerHTML=raw;
 // The macro label takes the first line; ownership and status share a second row.
 // This prevents the first, narrow macro column from losing its title.
 tmp.content.querySelectorAll('.bp-macro').forEach(header=>{
  const main=header.querySelector(':scope > button:first-child'),status=header.querySelector(':scope > button.btn');
  const owner=main?.querySelector('small');if(!main||!status||!owner)return;
  const sub=document.createElement('div');sub.className='v16-macro-secondary';
  const m=bpMacro(header.dataset.macro);
  owner.innerHTML=v15PersonList(m?.ownerIds||[], 'Responsável a definir');
  owner.remove();status.remove();sub.append(owner,status);header.append(sub);
 });
 // Compact grouping of status and milestone on each step, without altering source records.
 tmp.content.querySelectorAll('.bp-step-head').forEach(step=>{
  const count=step.querySelector('.bp-step-count'),phase=count?.querySelector('.v10-phase');
  const bottom=step.querySelector('.bp-step-bottom'),status=bottom?.querySelector(':scope > span:first-child');
  if(!phase||!status)return;
  const flags=document.createElement('div');flags.className='v16-step-flags';
  const priority=document.createElement('span');priority.className='v16-step-status';priority.textContent=status.textContent.trim();
  flags.append(priority,phase.cloneNode(true));phase.remove();status.remove();
  const next=step.querySelector('.bp-step-bottom');
  if(next)step.insertBefore(flags,next);else step.append(flags);
  if(bottom&&!bottom.textContent.trim()&&!bottom.querySelector('button'))bottom.remove();
 });
 if(contextBoard){
  for(const product of tmp.content.querySelectorAll('.bp-product')){
   const line=product.querySelector('.v13-select-line');
   if(!line)continue;
   const selected=bpCurrentCase(contextBoard)||bpDefault(contextBoard);
   const options=contextBoard.cases.map(c=>[c.uid,c.isDefault?'Caso padrão':c.title]);
   line.innerHTML=`<select class="v13-case-select v16-context-select" data-v16-board-case="${esc(contextBoard.id)}" aria-label="Caso de uso de ${esc(contextBoard.name)}" title="Selecionar caso de uso">${bpOptions(options,selected?.uid||'')}</select>`;
   const upper=product.querySelector('.v13-product-case-wrap>button.bp-product-title');
   if(upper){const title=document.createElement('span');title.className='bp-product-title';title.textContent=contextBoard.name;upper.replaceWith(title);}
  }
 }
 return tmp.innerHTML;
};
const v16PrevSidebar=sidebar;
sidebar=function(){
 const raw=v16PrevSidebar(),tmp=document.createElement('template');tmp.innerHTML=raw;
 tmp.content.querySelector('[data-action="v13-settings"]')?.remove();
 return tmp.innerHTML;
};
const v16PrevChange=onChange;
onChange=function(e){
 if(e.target.matches('[data-v16-board-case]')){
  const id=e.target.getAttribute('data-v16-board-case'),b=boardBy(id),uid=e.target.value;
  if(!b||!b.cases.some(c=>c.uid===uid))return;
  view.bpCase=uid;
  // A profile from another journey must not silently hide the selected case.
  const chosen=b.cases.find(c=>c.uid===uid);
  if(view.bpProfile!=='all'&&!chosen.isDefault&&!chosen.profiles.includes(view.bpProfile))view.bpProfile='all';
  render(true);
  return;
 }
 return v16PrevChange(e);
};


/* v17 | Dados por etapa + Objetivo do processo. Both overview and front share the same source step. */
const V17_OBJECTIVES=['Contratar','Consultar','Gerenciar','Resgatar','Transacionar','Cancelar'];
const v17PriorBlank=bpBlankStep;
bpBlankStep=function(...args){return {...v17PriorBlank(...args),objective:'',dataRequirements:[],dataNotApplicable:false};};
const v17PriorCopy=bpCopySteps;
bpCopySteps=function(source){return v17PriorCopy(source).map(s=>({...s,dataRequirements:(s.dataRequirements||[]).map(d=>({...d,uid:qid()}))}));};
const v17PriorNormalize=normalizeState;
normalizeState=function(input){if(validateStateInput(input))return null;const out=v17PriorNormalize(input);if(!out)return out;for(const b of out.boards||[])for(const c of b.cases||[])for(const s of c.steps||[]){
 s.objective=V17_OBJECTIVES.includes(s.objective)?s.objective:'';
 s.dataNotApplicable=s.dataNotApplicable===true;
 s.dataRequirements=Array.isArray(s.dataRequirements)?s.dataRequirements.filter(d=>d&&typeof d==='object').map(d=>({uid:String(d.uid||qid()),name:String(d.name||''),providerKind:['systems','capabilities'].includes(d.providerKind)?d.providerKind:'',providerId:String(d.providerId||''),note:String(d.note||'')})):[];
}
 out.formatVersion='18.0';return out;
};
function v17ProviderExists(kind,id){return !id||(['systems','capabilities'].includes(kind)&&state[kind]?.some(r=>r.id===id));}
function v17Providers(kind,selected=''){
 if(!['systems','capabilities'].includes(kind))return '<option value="">Escolha o tipo de fornecedor</option>';
 const records=state[kind]||[],available=records.filter(r=>r.status!=='Inativo'||r.id===selected);
 return `<option value="">${available.length?'Fonte a definir':'Nenhum cadastro disponível'}</option>`+available.map(r=>`<option value="${esc(r.id)}" ${r.id===selected?'selected':''}>${esc(r.name)}</option>`).join('');
}
function v17DataRow(rec={}){
 const d={uid:rec.uid||qid(),name:rec.name||'',providerKind:rec.providerKind||'',providerId:rec.providerId||'',note:rec.note||''};
 return `<div class="v17-data-editor-row" data-v17-data-row><div class="v17-data-editor-title"><span class="v17-row-number">Dado necessário</span><button type="button" data-action="v17-remove-data" class="v17-delete-data" aria-label="Remover dado">Remover</button></div><div class="v17-data-fields"><label class="v17-data-field v17-data-field-name"><span>Nome do dado</span><input type="text" data-v17-data-name maxlength="500" placeholder="Ex.: Identificador do cliente" value="${esc(d.name)}"></label><label class="v17-data-field"><span>Fornecido por</span><select data-v17-data-kind><option value="" ${!d.providerKind?'selected':''}>A definir</option><option value="systems" ${d.providerKind==='systems'?'selected':''}>Sistema</option><option value="capabilities" ${d.providerKind==='capabilities'?'selected':''}>Capacidade</option></select></label><label class="v17-data-field"><span>Qual fonte?</span><select data-v17-data-provider ${!d.providerKind?'disabled':''}>${v17Providers(d.providerKind,d.providerId)}</select></label><label class="v17-data-field v17-data-field-note"><span>Uso / observação (opcional)</span><input data-v17-data-note type="text" maxlength="2000" placeholder="Como o dado será utilizado?" value="${esc(d.note)}"></label></div></div>`;
}
function v17DataEditor(rec,focus){
 const rows=rec.dataRequirements||[];
 return `<details class="bp-editor-section field full v17-data-section" id="bp-editor-data" ${focus==='data'?'open':''}><summary><strong>Dados</strong><small>Quais dados são necessários e qual sistema ou capacidade fornece cada um?</small></summary><div class="bp-editor-fields"><div class="v17-data-list" id="v17-data-list">${rows.map(v17DataRow).join('')}</div><div class="v17-data-actions"><button type="button" data-action="v17-add-data" class="btn tiny">+ Adicionar dado</button><label class="v17-na-check"><input type="checkbox" name="dataNotApplicable" ${rec.dataNotApplicable?'checked':''}> Sem dados adicionais nesta etapa</label></div><p class="v17-data-help">Os fornecedores usam os cadastros de Sistemas e Capacidades. Se ainda não souber a origem, deixe-a a definir. Você também pode criar novos cadastros nos respectivos blocos acima.</p></div></details>`;
}
function v17ReadDataForm(form){return [...form.querySelectorAll('[data-v17-data-row]')].map(row=>({
 uid:row.dataset.v17Uid||qid(),name:row.querySelector('[data-v17-data-name]')?.value.trim()||'',providerKind:row.querySelector('[data-v17-data-kind]')?.value||'',providerId:row.querySelector('[data-v17-data-provider]')?.value||'',note:row.querySelector('[data-v17-data-note]')?.value.trim()||''
})).filter(d=>d.name||d.providerKind||d.providerId||d.note);}
// Provide stable IDs for repeated entries across editing sessions.
const v17StableRow=v17DataRow;
v17DataRow=function(d={}){const uid=d.uid||qid();return v17StableRow({...d,uid}).replace('data-v17-data-row>','data-v17-data-row data-v17-uid="'+esc(uid)+'">');};
const v17PriorEditor=bpEditStage;
bpEditStage=function(boardId,caseId,stepId='',focus=''){
 v17PriorEditor(boardId,caseId,stepId,focus);if(bpModal?.kind!=='stage')return;
 const b=boardBy(boardId),c=b?.cases.find(x=>x.uid===bpModal.caseId),rec=c?.steps.find(s=>s.uid===stepId)||bpBlankStep();
 const cap=document.getElementById('bp-editor-capabilities');if(cap)cap.insertAdjacentHTML('afterend',v17DataEditor(rec,focus));
 if(focus==='data')requestAnimationFrame(()=>{const el=document.getElementById('bp-editor-data');el?.scrollIntoView({block:'center'});});
};
const v17PriorLane=bpLaneContent;
bpLaneContent=function(step,key,board){if(key!=='data')return v17PriorLane(step,key,board);if(step.placeholder)return '<span class="bp-empty">A preencher</span>';
 const rows=step.dataRequirements||[];
 if(step.dataNotApplicable)return '<span class="v17-data-na">Sem dados adicionais</span>';
 if(!rows.length)return '<span class="bp-empty">Dados a definir</span>';
 return `<div class="v17-data-list-cell">${rows.map(d=>{
  const r=d.providerKind&&d.providerId?state[d.providerKind]?.find(x=>x.id===d.providerId):null;
  const source=r?v11Tag(d.providerKind,r):`<span class="v17-provider-missing">${d.providerKind==='systems'?'Sistema':d.providerKind==='capabilities'?'Capacidade':'Fonte'} a definir</span>`;
  return `<div class="v17-data-cell-item"><strong>${esc(d.name||'Dado a definir')}</strong><span class="v17-data-source">${source}</span>${d.note?`<small>${esc(d.note)}</small>`:''}</div>`;
 }).join('')}</div>`;
};
// Seven blueprint lanes and a separate classification tag are now considered in progress.
bpCoverage=function(b,includeVariants=false){const steps=(includeVariants?b.cases:[bpDefault(b)]).filter(Boolean).flatMap(c=>c.steps||[]).filter(s=>s.status!=='Desativado');
 let done=0;for(const s of steps){const completeData=s.dataNotApplicable===true||((s.dataRequirements||[]).length>0&&(s.dataRequirements||[]).every(d=>bpMeaningful(d.name)&&v17ProviderExists(d.providerKind,d.providerId)&&!!d.providerKind&&!!d.providerId));
 done+=[(s.actorIds||[]).length>0,(s.channelIds||[]).length>0,(s.operationLinks||[]).length>0&&(s.operationLinks||[]).every(x=>bpMeaningful(x.role)),(s.systemIds||[]).length>0,(s.capabilityIds||[]).length>0||bpMeaningful(s.capabilityNotes),completeData,bpMeaningful(s.support),V17_OBJECTIVES.includes(s.objective)].filter(Boolean).length;
 }return {done,total:steps.length*8,steps:steps.length,ratio:steps.length?Math.round(done/(steps.length*8)*100):0};
};
const v17PriorMatrix=bpRenderMatrix;
bpRenderMatrix=function(board){const html=v17PriorMatrix(board),tmpl=document.createElement('template');tmpl.innerHTML=html;
 tmpl.content.querySelectorAll('.bp-step-head').forEach(head=>{const button=head.querySelector('button[data-id][data-board][data-case]');if(!button||button.disabled)return;
  const b=boardBy(button.dataset.board),c=b?.cases.find(x=>x.uid===button.dataset.case),s=c?.steps.find(x=>x.uid===button.dataset.id);
  if(!s)return;const flags=head.querySelector('.v16-step-flags')||head.querySelector('.bp-step-bottom');if(!flags)return;
  const tag=document.createElement('button');tag.type='button';tag.className='v17-purpose-tag'+(s.objective?' is-set':'');tag.textContent=s.objective||'+ Objetivo';tag.title=s.objective?'Objetivo do processo: '+s.objective:'Definir objetivo do processo';tag.setAttribute('aria-label',tag.title);tag.dataset.action=board?'bp-edit-stage':'bp-stage-focus';tag.dataset.board=b.id;tag.dataset.case=c.uid;tag.dataset.id=s.uid;
  flags.append(tag);
 });return tmpl.innerHTML;
};
// New records added in the existing Sistema/Capacidade pickers become available to Dados immediately.
const v17PriorInlineAdd=v11InlineAdd;
v11InlineAdd=function(kind){
 v17PriorInlineAdd(kind);
 if(!['systems','capabilities'].includes(kind))return;
 document.querySelectorAll('[data-v17-data-row]').forEach(row=>{
  const type=row.querySelector('[data-v17-data-kind]')?.value,select=row.querySelector('[data-v17-data-provider]');
  if(type!==kind||!select)return;const selected=select.value;select.innerHTML=v17Providers(type,selected);select.disabled=false;
 });
};
const v17PriorClick=clickHandler;
clickHandler=function(e){const btn=e.target.closest('[data-action]');if(btn?.dataset.action==='v17-add-data'){
 e.preventDefault();const list=document.getElementById('v17-data-list');if(list){list.insertAdjacentHTML('beforeend',v17DataRow());list.lastElementChild.querySelector('[data-v17-data-name]')?.focus();}return;
 }if(btn?.dataset.action==='v17-remove-data'){e.preventDefault();btn.closest('[data-v17-data-row]')?.remove();return;}
 return v17PriorClick(e);
};
const v17PriorChange=onChange;
onChange=function(e){if(e.target.matches('[data-v17-data-kind]')){
 const row=e.target.closest('[data-v17-data-row]'),provider=row?.querySelector('[data-v17-data-provider]');if(provider){provider.innerHTML=v17Providers(e.target.value);provider.disabled=!e.target.value;}return;
 }return v17PriorChange(e);
};

