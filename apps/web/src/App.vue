<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type StatusJovem = 'Ativo' | 'Atenção' | 'Acompanhamento'
type TipoJovem = 'Participante' | 'Visitante' | 'Liderança'
type GrupoTipo = 'Equipe' | 'Grupo' | 'Ministério'
type PerfilUsuario = 'Administrador Master' | 'Coordenação' | 'Liderança' | 'Comunicação' | 'Financeiro' | 'Consulta'
type Jovem = {
  id: string; nome: string; telefone: string; email?: string; nascimento: string; status: StatusJovem;
  equipe: string; menor: boolean; tipo?: TipoJovem; responsavel?: string; telefoneResponsavel?: string
}
type Evento = { id: string; titulo: string; data: string; local: string; inscritos: number }
type Presenca = { jovemId: string; data: string; presente: boolean }
type Grupo = { id: string; nome: string; tipo: GrupoTipo; lider: string; ativo: boolean }
type Acompanhamento = { id: string; jovemId: string; motivo: string; responsavel: string; prazo: string; status: 'Pendente'|'Concluído'; criadoEm: string }
type Usuario = { id: string; nome: string; perfil: PerfilUsuario; ativo: boolean }
type Configuracao = { nomeGrupo: string; cidade: string; radarAmarelo: number; radarVermelho: number }

function carregar<T>(chave: string, fallback: T): T {
  try { const valor = localStorage.getItem(chave); return valor ? JSON.parse(valor) as T : fallback }
  catch { return fallback }
}

const hoje = new Date().toISOString().slice(0,10)
const nav = [
  ['dashboard','Painel'], ['jovens','Jovens'], ['eventos','Eventos'], ['presenca','Presença'],
  ['grupos','Grupos e equipes'], ['acompanhamento','Acompanhamento'], ['relatorios','Relatórios'], ['admin','Administração']
] as const
const tela = ref<string>('dashboard')
const busca = ref('')
const aviso = ref('')

const jovens = ref<Jovem[]>(carregar('sgj_jovens', [
  {id:'1',nome:'Ana Clara',telefone:'(12) 99999-1001',email:'ana@exemplo.com',nascimento:'2008-04-18',status:'Ativo',equipe:'Acolhida',menor:true,tipo:'Participante',responsavel:'Maria Clara',telefoneResponsavel:'(12) 99999-2001'},
  {id:'2',nome:'Gabriel Santos',telefone:'(12) 99999-1002',nascimento:'2005-11-03',status:'Ativo',equipe:'Música',menor:false,tipo:'Liderança'},
  {id:'3',nome:'Laura Oliveira',telefone:'(12) 99999-1003',nascimento:'2009-09-12',status:'Atenção',equipe:'',menor:true,tipo:'Visitante',responsavel:'Carlos Oliveira',telefoneResponsavel:'(12) 99999-2003'},
  {id:'4',nome:'Lucas Almeida',telefone:'(12) 99999-1004',nascimento:'2006-02-22',status:'Acompanhamento',equipe:'Mídia',menor:false,tipo:'Participante'}
]))
const eventos = ref<Evento[]>(carregar('sgj_eventos', [
  {id:'e1',titulo:'Encontro de sábado',data:hoje,local:'Salão paroquial',inscritos:42},
  {id:'e2',titulo:'Formação de lideranças',data:new Date(Date.now()+7*86400000).toISOString().slice(0,10),local:'Sala de formação',inscritos:18}
]))
const presencas = ref<Presenca[]>(carregar('sgj_presencas', []))
const grupos = ref<Grupo[]>(carregar('sgj_grupos', [
  {id:'g1',nome:'Acolhida',tipo:'Equipe',lider:'Ana Clara',ativo:true},
  {id:'g2',nome:'Música',tipo:'Ministério',lider:'Gabriel Santos',ativo:true},
  {id:'g3',nome:'Mídia',tipo:'Equipe',lider:'Lucas Almeida',ativo:true}
]))
const acompanhamentos = ref<Acompanhamento[]>(carregar('sgj_acompanhamentos', [
  {id:'a1',jovemId:'4',motivo:'Ausência recorrente nos encontros',responsavel:'Coordenação',prazo:hoje,status:'Pendente',criadoEm:hoje}
]))
const usuarios = ref<Usuario[]>(carregar('sgj_usuarios', [
  {id:'u1',nome:'Administrador Master',perfil:'Administrador Master',ativo:true},
  {id:'u2',nome:'Coordenação Geral',perfil:'Coordenação',ativo:true}
]))
const configuracao = ref<Configuracao>(carregar('sgj_config', {nomeGrupo:'Meu Grupo de Jovens',cidade:'',radarAmarelo:14,radarVermelho:30}))

watch(jovens, v => localStorage.setItem('sgj_jovens', JSON.stringify(v)), {deep:true})
watch(eventos, v => localStorage.setItem('sgj_eventos', JSON.stringify(v)), {deep:true})
watch(presencas, v => localStorage.setItem('sgj_presencas', JSON.stringify(v)), {deep:true})
watch(grupos, v => localStorage.setItem('sgj_grupos', JSON.stringify(v)), {deep:true})
watch(acompanhamentos, v => localStorage.setItem('sgj_acompanhamentos', JSON.stringify(v)), {deep:true})
watch(usuarios, v => localStorage.setItem('sgj_usuarios', JSON.stringify(v)), {deep:true})
watch(configuracao, v => localStorage.setItem('sgj_config', JSON.stringify(v)), {deep:true})

const filtrados = computed(() => jovens.value.filter(j => [j.nome,j.telefone,j.email,j.equipe].some(v => (v||'').toLowerCase().includes(busca.value.toLowerCase()))))
const ativos = computed(() => jovens.value.filter(j => j.status === 'Ativo').length)
const alertas = computed(() => jovens.value.filter(j => j.status !== 'Ativo').length)
const menores = computed(() => jovens.value.filter(j => j.menor).length)
const visitantes = computed(() => jovens.value.filter(j => j.tipo === 'Visitante').length)
const presentesHoje = computed(() => presencas.value.filter(p => p.data === hoje && p.presente).length)
const pendentes = computed(() => acompanhamentos.value.filter(a => a.status === 'Pendente').length)
const diasComPresenca = computed(() => new Set(presencas.value.map(p => p.data)).size)
const taxaPresenca = computed(() => {
  if (!jovens.value.length || !diasComPresenca.value) return 0
  const marcacoes = presencas.value.filter(p => p.presente).length
  return Math.round((marcacoes / (jovens.value.length * diasComPresenca.value)) * 100)
})
const aniversariantesMes = computed(() => {
  const mes = new Date().getMonth()+1
  return jovens.value.filter(j => j.nascimento && Number(j.nascimento.slice(5,7)) === mes)
})
const distribuicaoEquipes = computed(() => grupos.value.filter(g=>g.ativo).map(g => ({...g,membros:jovens.value.filter(j=>j.equipe===g.nome).length})))

const novo = ref({nome:'',telefone:'',email:'',nascimento:'',equipe:'',menor:false,tipo:'Participante' as TipoJovem,responsavel:'',telefoneResponsavel:''})
function adicionarJovem(){
  if(!novo.value.nome.trim()) return
  jovens.value.unshift({id:crypto.randomUUID(),nome:novo.value.nome.trim(),telefone:novo.value.telefone,email:novo.value.email,nascimento:novo.value.nascimento,equipe:novo.value.equipe,menor:novo.value.menor,tipo:novo.value.tipo,responsavel:novo.value.responsavel,telefoneResponsavel:novo.value.telefoneResponsavel,status:'Ativo'})
  novo.value={nome:'',telefone:'',email:'',nascimento:'',equipe:'',menor:false,tipo:'Participante',responsavel:'',telefoneResponsavel:''}
  mostrarAviso('Jovem cadastrado com sucesso.')
}

const novoEvento = ref({titulo:'',data:'',local:''})
function adicionarEvento(){
  if(!novoEvento.value.titulo.trim() || !novoEvento.value.data) return
  eventos.value.unshift({id:crypto.randomUUID(),titulo:novoEvento.value.titulo.trim(),data:novoEvento.value.data,local:novoEvento.value.local,inscritos:0})
  novoEvento.value={titulo:'',data:'',local:''}
  mostrarAviso('Evento criado.')
}
function alterarInscritos(id:string, delta:number){ const e=eventos.value.find(x=>x.id===id); if(e) e.inscritos=Math.max(0,e.inscritos+delta) }

const novoGrupo = ref({nome:'',tipo:'Equipe' as GrupoTipo,lider:''})
function adicionarGrupo(){
  if(!novoGrupo.value.nome.trim()) return
  grupos.value.push({id:crypto.randomUUID(),nome:novoGrupo.value.nome.trim(),tipo:novoGrupo.value.tipo,lider:novoGrupo.value.lider,ativo:true})
  novoGrupo.value={nome:'',tipo:'Equipe',lider:''}
  mostrarAviso('Grupo ou equipe criado.')
}

const novoAcompanhamento = ref({jovemId:'',motivo:'',responsavel:'',prazo:''})
function adicionarAcompanhamento(){
  if(!novoAcompanhamento.value.jovemId || !novoAcompanhamento.value.motivo.trim()) return
  acompanhamentos.value.unshift({id:crypto.randomUUID(),jovemId:novoAcompanhamento.value.jovemId,motivo:novoAcompanhamento.value.motivo.trim(),responsavel:novoAcompanhamento.value.responsavel,prazo:novoAcompanhamento.value.prazo,status:'Pendente',criadoEm:hoje})
  const jovem=jovens.value.find(j=>j.id===novoAcompanhamento.value.jovemId); if(jovem) jovem.status='Acompanhamento'
  novoAcompanhamento.value={jovemId:'',motivo:'',responsavel:'',prazo:''}
  mostrarAviso('Acompanhamento registrado.')
}
function concluirAcompanhamento(id:string){ const a=acompanhamentos.value.find(x=>x.id===id); if(a){a.status='Concluído'; mostrarAviso('Acompanhamento concluído.')} }
function nomeJovem(id:string){ return jovens.value.find(j=>j.id===id)?.nome || 'Jovem não localizado' }

const novoUsuario = ref({nome:'',perfil:'Liderança' as PerfilUsuario})
function adicionarUsuario(){
  if(!novoUsuario.value.nome.trim()) return
  usuarios.value.push({id:crypto.randomUUID(),nome:novoUsuario.value.nome.trim(),perfil:novoUsuario.value.perfil,ativo:true})
  novoUsuario.value={nome:'',perfil:'Liderança'}
  mostrarAviso('Usuário adicionado à configuração local.')
}

function presente(id:string){ return presencas.value.some(p => p.jovemId===id && p.data===hoje && p.presente) }
function alternarPresenca(id:string){
  const idx=presencas.value.findIndex(p=>p.jovemId===id && p.data===hoje)
  if(idx>=0) presencas.value[idx].presente=!presencas.value[idx].presente
  else presencas.value.push({jovemId:id,data:hoje,presente:true})
}
function marcarTodosPresentes(){
  jovens.value.forEach(j=>{ const idx=presencas.value.findIndex(p=>p.jovemId===j.id && p.data===hoje); if(idx>=0) presencas.value[idx].presente=true; else presencas.value.push({jovemId:j.id,data:hoje,presente:true}) })
  mostrarAviso('Todos foram marcados como presentes.')
}

function recalcularRadar(){
  const base = new Date(hoje+'T12:00:00').getTime()
  jovens.value.forEach(j=>{
    const datas=presencas.value.filter(p=>p.jovemId===j.id && p.presente).map(p=>p.data).sort().reverse()
    if(!datas.length) return
    const dias=Math.floor((base-new Date(datas[0]+'T12:00:00').getTime())/86400000)
    j.status=dias>=configuracao.value.radarVermelho?'Acompanhamento':dias>=configuracao.value.radarAmarelo?'Atenção':'Ativo'
  })
  mostrarAviso('Radar recalculado conforme os limites configurados.')
}

function tituloTela(){ return nav.find(n=>n[0]===tela.value)?.[1] || 'SGJ' }
function statusClasse(status:StatusJovem){ return status==='Ativo'?'green':status==='Atenção'?'yellow':'red' }
function iniciais(nome:string){ return nome.split(' ').filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase() }
function mostrarAviso(texto:string){ aviso.value=texto; window.setTimeout(()=>{ if(aviso.value===texto) aviso.value='' },3000) }

function exportarBackup(){
  const payload={versao:'0.2.0',geradoEm:new Date().toISOString(),dados:{jovens:jovens.value,eventos:eventos.value,presencas:presencas.value,grupos:grupos.value,acompanhamentos:acompanhamentos.value,usuarios:usuarios.value,configuracao:configuracao.value}}
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`sgj-backup-${hoje}.json`; a.click(); URL.revokeObjectURL(url)
  mostrarAviso('Backup exportado.')
}
async function importarBackup(event:Event){
  const input=event.target as HTMLInputElement; const arquivo=input.files?.[0]; if(!arquivo) return
  try{
    const backup=JSON.parse(await arquivo.text()); const d=backup.dados
    if(!d || !Array.isArray(d.jovens)) throw new Error('inválido')
    jovens.value=d.jovens; eventos.value=d.eventos||[]; presencas.value=d.presencas||[]; grupos.value=d.grupos||[]; acompanhamentos.value=d.acompanhamentos||[]; usuarios.value=d.usuarios||[]; configuracao.value=d.configuracao||configuracao.value
    mostrarAviso('Backup importado com sucesso.')
  }catch{ mostrarAviso('Não foi possível importar: arquivo inválido.') }
  input.value=''
}
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brandmark">SGJ</div><div><strong>Gestor de Jovens</strong><small>Web + PC</small></div></div>
      <nav><button v-for="item in nav" :key="item[0]" :class="{active:tela===item[0]}" @click="tela=item[0]"><span class="dot"></span>{{ item[1] }}</button></nav>
      <div class="sync"><span class="online"></span><div><strong>Modo offline ativo</strong><small>Dados salvos neste dispositivo</small></div></div>
    </aside>

    <main>
      <header>
        <div><small>{{ configuracao.nomeGrupo }}<template v-if="configuracao.cidade"> · {{ configuracao.cidade }}</template></small><h1>{{ tituloTela() }}</h1></div>
        <div class="user"><div class="avatar">AM</div><div><strong>Administrador Master</strong><small>Acesso total</small></div></div>
      </header>
      <div v-if="aviso" class="toast">{{ aviso }}</div>

      <section v-if="tela==='dashboard'" class="page">
        <div class="hero"><div><span class="eyebrow">VISÃO GERAL</span><h2>Boa gestão começa por pessoas.</h2><p>Acompanhe integração, presença, equipes e quem precisa de atenção.</p></div><div class="heroactions"><button class="ghost" @click="recalcularRadar">Recalcular radar</button><button class="primary" @click="tela='jovens'">+ Cadastrar jovem</button></div></div>
        <div class="metrics">
          <article><small>Jovens cadastrados</small><strong>{{ jovens.length }}</strong><span>{{ visitantes }} visitantes</span></article>
          <article><small>Ativos</small><strong>{{ ativos }}</strong><span class="good">Participação regular</span></article>
          <article><small>Precisam de atenção</small><strong>{{ alertas }}</strong><span class="warn">{{ pendentes }} acompanhamentos pendentes</span></article>
          <article><small>Presentes hoje</small><strong>{{ presentesHoje }}</strong><span>{{ jovens.length ? Math.round(presentesHoje/jovens.length*100) : 0 }}% da base</span></article>
        </div>
        <div class="grid2">
          <article class="panel"><div class="panelhead"><div><small>RADAR</small><h3>Acompanhamento</h3></div><span class="badge">{{ alertas }} alertas</span></div>
            <div v-if="!alertas" class="quiet">Nenhum alerta no radar.</div>
            <div v-for="j in jovens.filter(x=>x.status!=='Ativo')" :key="j.id" class="person"><div class="avatar soft">{{ iniciais(j.nome) }}</div><div><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }} · {{ j.tipo || 'Participante' }}</small></div><span :class="['status',statusClasse(j.status)]">{{ j.status }}</span></div>
          </article>
          <article class="panel"><div class="panelhead"><div><small>AGENDA</small><h3>Próximos eventos</h3></div><button class="link" @click="tela='eventos'">Ver todos</button></div>
            <div v-for="e in eventos.slice(0,4)" :key="e.id" class="event"><div class="date"><strong>{{ e.data.slice(8,10) }}</strong><small>{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','') }}</small></div><div><strong>{{ e.titulo }}</strong><small>{{ e.local || 'Local a definir' }} · {{ e.inscritos }} inscritos</small></div></div>
          </article>
        </div>
        <article class="panel"><div class="panelhead"><div><small>BASE</small><h3>Resumo cadastral</h3></div></div><div class="summary"><div><strong>{{ menores }}</strong><small>menores de idade</small></div><div><strong>{{ jovens.length-menores }}</strong><small>maiores de idade</small></div><div><strong>{{ jovens.filter(j=>j.equipe).length }}</strong><small>em equipes</small></div><div><strong>{{ aniversariantesMes.length }}</strong><small>aniversários no mês</small></div></div></article>
      </section>

      <section v-else-if="tela==='jovens'" class="page">
        <div class="splithead"><p class="muted">Cadastro central de participantes, visitantes e lideranças.</p><input class="search" v-model="busca" placeholder="Buscar nome, telefone, e-mail ou equipe..." /></div>
        <form class="formcard formgrid" @submit.prevent="adicionarJovem">
          <input v-model="novo.nome" placeholder="Nome completo *"/><input v-model="novo.telefone" placeholder="Telefone"/><input v-model="novo.email" type="email" placeholder="E-mail"/><input v-model="novo.nascimento" type="date"/>
          <select v-model="novo.tipo"><option>Participante</option><option>Visitante</option><option>Liderança</option></select>
          <select v-model="novo.equipe"><option value="">Sem equipe</option><option v-for="g in grupos.filter(x=>x.ativo)" :key="g.id" :value="g.nome">{{ g.nome }}</option></select>
          <label class="check"><input v-model="novo.menor" type="checkbox"/> Menor de idade</label>
          <template v-if="novo.menor"><input v-model="novo.responsavel" placeholder="Responsável legal"/><input v-model="novo.telefoneResponsavel" placeholder="Telefone do responsável"/></template>
          <button class="primary">Adicionar jovem</button>
        </form>
        <article class="panel tablewrap"><table><thead><tr><th>Jovem</th><th>Contato</th><th>Equipe</th><th>Perfil</th><th>Status</th></tr></thead><tbody><tr v-for="j in filtrados" :key="j.id"><td><strong>{{ j.nome }}</strong><small>{{ j.nascimento || 'Nascimento não informado' }}<template v-if="j.menor"> · Resp.: {{ j.responsavel || 'não informado' }}</template></small></td><td>{{ j.telefone || '—' }}<small>{{ j.email || (j.menor ? j.telefoneResponsavel : '') || '—' }}</small></td><td>{{ j.equipe || 'Sem equipe' }}</td><td>{{ j.tipo || 'Participante' }}<small>{{ j.menor?'Menor':'Adulto' }}</small></td><td><select class="statusselect" v-model="j.status"><option>Ativo</option><option>Atenção</option><option>Acompanhamento</option></select></td></tr></tbody></table></article>
      </section>

      <section v-else-if="tela==='eventos'" class="page">
        <p class="muted">Encontros, formações, retiros, viagens e demais atividades.</p>
        <form class="formcard" @submit.prevent="adicionarEvento"><input v-model="novoEvento.titulo" placeholder="Nome do evento *"/><input v-model="novoEvento.data" type="date"/><input v-model="novoEvento.local" placeholder="Local"/><button class="primary">Criar evento</button></form>
        <div class="cards"><article class="panel" v-for="e in eventos" :key="e.id"><span class="eyebrow">{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR') }}</span><h3>{{ e.titulo }}</h3><p>{{ e.local || 'Local a definir' }}</p><div class="cardfoot"><span><strong>{{ e.inscritos }}</strong> inscritos</span><div class="stepper"><button @click="alterarInscritos(e.id,-1)">−</button><button @click="alterarInscritos(e.id,1)">+</button></div></div></article></div>
      </section>

      <section v-else-if="tela==='presenca'" class="page">
        <div class="hero compact"><div><span class="eyebrow">CHECK-IN · {{ new Date().toLocaleDateString('pt-BR') }}</span><h2>Presença do encontro</h2><p>As marcações ficam salvas localmente mesmo sem internet.</p></div><div class="heroactions"><div class="bigcount">{{ presentesHoje }}/{{ jovens.length }}</div><button class="ghost" @click="marcarTodosPresentes">Marcar todos</button></div></div>
        <article class="panel"><div v-for="j in jovens" :key="j.id" class="checkrow" @click="alternarPresenca(j.id)"><div class="avatar soft">{{ iniciais(j.nome) }}</div><div class="grow"><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }}</small></div><button :class="['presence', presente(j.id)?'yes':'']">{{ presente(j.id)?'✓ Presente':'Marcar presença' }}</button></div></article>
      </section>

      <section v-else-if="tela==='grupos'" class="page">
        <div class="splithead"><p class="muted">Equipes, ministérios e pequenos grupos com liderança definida.</p><span class="badge">{{ grupos.filter(g=>g.ativo).length }} ativos</span></div>
        <form class="formcard" @submit.prevent="adicionarGrupo"><input v-model="novoGrupo.nome" placeholder="Nome do grupo/equipe *"/><select v-model="novoGrupo.tipo"><option>Equipe</option><option>Grupo</option><option>Ministério</option></select><input v-model="novoGrupo.lider" placeholder="Líder responsável"/><button class="primary">Criar</button></form>
        <div class="cards"><article class="panel" v-for="g in distribuicaoEquipes" :key="g.id"><span class="eyebrow">{{ g.tipo.toUpperCase() }}</span><h3>{{ g.nome }}</h3><p>Liderança: <strong>{{ g.lider || 'não definida' }}</strong></p><div class="cardfoot"><span>{{ g.membros }} integrantes</span><button class="link" @click="g.ativo=false">Desativar</button></div></article></div>
      </section>

      <section v-else-if="tela==='acompanhamento'" class="page">
        <div class="splithead"><p class="muted">Registre contatos e tarefas de cuidado sem transformar o jovem em apenas uma estatística.</p><span class="badge">{{ pendentes }} pendentes</span></div>
        <form class="formcard formgrid" @submit.prevent="adicionarAcompanhamento"><select v-model="novoAcompanhamento.jovemId"><option value="">Selecione o jovem *</option><option v-for="j in jovens" :key="j.id" :value="j.id">{{ j.nome }}</option></select><input v-model="novoAcompanhamento.motivo" placeholder="Motivo / próxima ação *"/><input v-model="novoAcompanhamento.responsavel" placeholder="Responsável pelo contato"/><input v-model="novoAcompanhamento.prazo" type="date"/><button class="primary">Registrar</button></form>
        <article class="panel tablewrap"><table><thead><tr><th>Jovem</th><th>Motivo</th><th>Responsável</th><th>Prazo</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="a in acompanhamentos" :key="a.id"><td><strong>{{ nomeJovem(a.jovemId) }}</strong><small>Criado em {{ new Date(a.criadoEm+'T12:00:00').toLocaleDateString('pt-BR') }}</small></td><td>{{ a.motivo }}</td><td>{{ a.responsavel || '—' }}</td><td>{{ a.prazo ? new Date(a.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—' }}</td><td><span :class="['status',a.status==='Concluído'?'green':'yellow']">{{ a.status }}</span></td><td><button v-if="a.status==='Pendente'" class="link" @click="concluirAcompanhamento(a.id)">Concluir</button></td></tr></tbody></table></article>
      </section>

      <section v-else-if="tela==='relatorios'" class="page">
        <div class="reportgrid"><article class="panel reportcard"><small>PRESENÇA GERAL</small><strong>{{ taxaPresenca }}%</strong><p>Baseada em {{ diasComPresenca }} dia(s) com chamada registrada.</p></article><article class="panel reportcard"><small>INTEGRAÇÃO</small><strong>{{ visitantes }}</strong><p>Visitantes cadastrados para acompanhamento.</p></article><article class="panel reportcard"><small>PROTEÇÃO</small><strong>{{ menores }}</strong><p>Menores com necessidade de vínculo a responsável.</p></article><article class="panel reportcard"><small>FOLLOW-UP</small><strong>{{ pendentes }}</strong><p>Tarefas de acompanhamento em aberto.</p></article></div>
        <div class="grid2"><article class="panel"><div class="panelhead"><div><small>DISTRIBUIÇÃO</small><h3>Jovens por equipe</h3></div></div><div v-for="g in distribuicaoEquipes" :key="g.id" class="barrow"><span>{{ g.nome }}</span><div class="bar"><i :style="{width: jovens.length ? Math.max(4,g.membros/jovens.length*100)+'%' : '0%'}"></i></div><strong>{{ g.membros }}</strong></div><div class="barrow"><span>Sem equipe</span><div class="bar"><i :style="{width: jovens.length ? Math.max(4,jovens.filter(j=>!j.equipe).length/jovens.length*100)+'%' : '0%'}"></i></div><strong>{{ jovens.filter(j=>!j.equipe).length }}</strong></div></article><article class="panel"><div class="panelhead"><div><small>ANIVERSÁRIOS</small><h3>Neste mês</h3></div></div><div v-if="!aniversariantesMes.length" class="quiet">Nenhum aniversário cadastrado neste mês.</div><div v-for="j in aniversariantesMes" :key="j.id" class="person"><div class="avatar soft">{{ j.nascimento.slice(8,10) }}</div><div><strong>{{ j.nome }}</strong><small>{{ new Date(j.nascimento+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long'}) }}</small></div></div></article></div>
      </section>

      <section v-else-if="tela==='admin'" class="page">
        <div class="admin-grid">
          <article class="panel"><div class="panelhead"><div><small>ORGANIZAÇÃO</small><h3>Configuração</h3></div></div><div class="stack"><label>Nome do grupo<input v-model="configuracao.nomeGrupo"/></label><label>Cidade<input v-model="configuracao.cidade"/></label><div class="twocol"><label>Alerta amarelo (dias)<input v-model.number="configuracao.radarAmarelo" type="number" min="1"/></label><label>Alerta vermelho (dias)<input v-model.number="configuracao.radarVermelho" type="number" min="1"/></label></div><button class="secondary" @click="recalcularRadar">Aplicar regras ao radar</button></div></article>
          <article class="panel"><div class="panelhead"><div><small>DADOS</small><h3>Backup local</h3></div></div><p class="muted">Exporte todos os cadastros para um arquivo JSON ou restaure uma cópia anterior.</p><div class="actions"><button class="primary" @click="exportarBackup">Exportar backup</button><label class="filebtn">Importar backup<input type="file" accept="application/json,.json" @change="importarBackup"/></label></div><div class="notice">Enquanto o backend central não estiver habilitado, cada dispositivo mantém sua própria base local. O backup é indispensável.</div></article>
        </div>
        <article class="panel"><div class="panelhead"><div><small>ACESSOS</small><h3>Usuários e perfis</h3></div><span class="badge">{{ usuarios.filter(u=>u.ativo).length }} ativos</span></div><form class="inlineform" @submit.prevent="adicionarUsuario"><input v-model="novoUsuario.nome" placeholder="Nome do usuário"/><select v-model="novoUsuario.perfil"><option>Administrador Master</option><option>Coordenação</option><option>Liderança</option><option>Comunicação</option><option>Financeiro</option><option>Consulta</option></select><button class="primary">Adicionar</button></form><div class="userlist"><div v-for="u in usuarios" :key="u.id" class="person"><div class="avatar soft">{{ iniciais(u.nome) }}</div><div><strong>{{ u.nome }}</strong><small>{{ u.perfil }}</small></div><label class="switchlabel"><input type="checkbox" v-model="u.ativo"/> {{ u.ativo?'Ativo':'Inativo' }}</label></div></div><div class="notice">Os perfis já estão modelados na interface. Autenticação, senha e autorização efetiva serão aplicadas pelo backend central.</div></article>
      </section>
    </main>
  </div>
</template>
