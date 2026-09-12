<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type Jovem = { id: string; nome: string; telefone: string; nascimento: string; status: 'Ativo'|'Atenção'|'Acompanhamento'; equipe: string; menor: boolean }
type Evento = { id: string; titulo: string; data: string; local: string; inscritos: number }
type Presenca = { jovemId: string; data: string; presente: boolean }

const nav = [
  ['dashboard','Painel'], ['jovens','Jovens'], ['eventos','Eventos'], ['presenca','Presença'],
  ['grupos','Grupos e equipes'], ['acompanhamento','Acompanhamento'], ['relatorios','Relatórios'], ['admin','Administração']
] as const
const tela = ref<string>('dashboard')
const busca = ref('')
const hoje = new Date().toISOString().slice(0,10)

const jovens = ref<Jovem[]>(JSON.parse(localStorage.getItem('sgj_jovens') || 'null') || [
  {id:'1',nome:'Ana Clara',telefone:'(12) 99999-1001',nascimento:'2008-04-18',status:'Ativo',equipe:'Acolhida',menor:true},
  {id:'2',nome:'Gabriel Santos',telefone:'(12) 99999-1002',nascimento:'2005-11-03',status:'Ativo',equipe:'Música',menor:false},
  {id:'3',nome:'Laura Oliveira',telefone:'(12) 99999-1003',nascimento:'2009-09-12',status:'Atenção',equipe:'',menor:true},
  {id:'4',nome:'Lucas Almeida',telefone:'(12) 99999-1004',nascimento:'2006-02-22',status:'Acompanhamento',equipe:'Mídia',menor:false}
])
const eventos = ref<Evento[]>(JSON.parse(localStorage.getItem('sgj_eventos') || 'null') || [
  {id:'e1',titulo:'Encontro de sábado',data:hoje,local:'Salão paroquial',inscritos:42},
  {id:'e2',titulo:'Formação de lideranças',data:new Date(Date.now()+7*86400000).toISOString().slice(0,10),local:'Sala de formação',inscritos:18}
])
const presencas = ref<Presenca[]>(JSON.parse(localStorage.getItem('sgj_presencas') || '[]'))

watch(jovens, v => localStorage.setItem('sgj_jovens', JSON.stringify(v)), {deep:true})
watch(eventos, v => localStorage.setItem('sgj_eventos', JSON.stringify(v)), {deep:true})
watch(presencas, v => localStorage.setItem('sgj_presencas', JSON.stringify(v)), {deep:true})

const filtrados = computed(() => jovens.value.filter(j => j.nome.toLowerCase().includes(busca.value.toLowerCase())))
const ativos = computed(() => jovens.value.filter(j => j.status === 'Ativo').length)
const alertas = computed(() => jovens.value.filter(j => j.status !== 'Ativo').length)
const menores = computed(() => jovens.value.filter(j => j.menor).length)
const presentesHoje = computed(() => presencas.value.filter(p => p.data === hoje && p.presente).length)

const novo = ref({nome:'',telefone:'',nascimento:'',equipe:'',menor:false})
function adicionarJovem(){
  if(!novo.value.nome.trim()) return
  jovens.value.unshift({id:crypto.randomUUID(), nome:novo.value.nome.trim(), telefone:novo.value.telefone, nascimento:novo.value.nascimento, equipe:novo.value.equipe, menor:novo.value.menor, status:'Ativo'})
  novo.value={nome:'',telefone:'',nascimento:'',equipe:'',menor:false}
}
const novoEvento = ref({titulo:'',data:'',local:''})
function adicionarEvento(){
  if(!novoEvento.value.titulo || !novoEvento.value.data) return
  eventos.value.unshift({id:crypto.randomUUID(),...novoEvento.value,inscritos:0})
  novoEvento.value={titulo:'',data:'',local:''}
}
function presente(id:string){ return presencas.value.some(p => p.jovemId===id && p.data===hoje && p.presente) }
function alternarPresenca(id:string){
  const idx=presencas.value.findIndex(p=>p.jovemId===id && p.data===hoje)
  if(idx>=0) presencas.value[idx].presente=!presencas.value[idx].presente
  else presencas.value.push({jovemId:id,data:hoje,presente:true})
}
function tituloTela(){ return nav.find(n=>n[0]===tela.value)?.[1] || 'SGJ' }
</script>

<template>
  <div class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brandmark">SGJ</div><div><strong>Gestor de Jovens</strong><small>Web + PC</small></div></div>
      <nav>
        <button v-for="item in nav" :key="item[0]" :class="{active:tela===item[0]}" @click="tela=item[0]">
          <span class="dot"></span>{{ item[1] }}
        </button>
      </nav>
      <div class="sync"><span class="online"></span><div><strong>Dados locais ativos</strong><small>Pronto para sincronizar</small></div></div>
    </aside>

    <main>
      <header>
        <div><small>Sistema de Gestão de Grupo de Jovens</small><h1>{{ tituloTela() }}</h1></div>
        <div class="user"><div class="avatar">AM</div><div><strong>Administrador Master</strong><small>Acesso total</small></div></div>
      </header>

      <section v-if="tela==='dashboard'" class="page">
        <div class="hero"><div><span class="eyebrow">VISÃO GERAL</span><h2>Boa gestão começa por pessoas.</h2><p>Acompanhe participação, integração, eventos e sinais que precisam de atenção.</p></div><button class="primary" @click="tela='jovens'">+ Cadastrar jovem</button></div>
        <div class="metrics">
          <article><small>Jovens cadastrados</small><strong>{{ jovens.length }}</strong><span>Total da base</span></article>
          <article><small>Ativos</small><strong>{{ ativos }}</strong><span class="good">Participação regular</span></article>
          <article><small>Precisam de atenção</small><strong>{{ alertas }}</strong><span class="warn">Radar de relacionamento</span></article>
          <article><small>Presentes hoje</small><strong>{{ presentesHoje }}</strong><span>Check-in do dia</span></article>
        </div>
        <div class="grid2">
          <article class="panel"><div class="panelhead"><div><small>RADAR</small><h3>Acompanhamento</h3></div><span class="badge">{{ alertas }} alertas</span></div>
            <div v-for="j in jovens.filter(x=>x.status!=='Ativo')" :key="j.id" class="person"><div class="avatar soft">{{ j.nome.split(' ').map(x=>x[0]).slice(0,2).join('') }}</div><div><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }}</small></div><span :class="['status',j.status==='Atenção'?'yellow':'red']">{{ j.status }}</span></div>
          </article>
          <article class="panel"><div class="panelhead"><div><small>AGENDA</small><h3>Próximos eventos</h3></div><button class="link" @click="tela='eventos'">Ver todos</button></div>
            <div v-for="e in eventos.slice(0,4)" :key="e.id" class="event"><div class="date"><strong>{{ e.data.slice(8,10) }}</strong><small>{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','') }}</small></div><div><strong>{{ e.titulo }}</strong><small>{{ e.local }} · {{ e.inscritos }} inscritos</small></div></div>
          </article>
        </div>
        <article class="panel"><div class="panelhead"><div><small>BASE</small><h3>Resumo cadastral</h3></div></div><div class="summary"><div><strong>{{ menores }}</strong><small>menores de idade</small></div><div><strong>{{ jovens.length-menores }}</strong><small>maiores de idade</small></div><div><strong>{{ jovens.filter(j=>j.equipe).length }}</strong><small>em equipes</small></div><div><strong>{{ jovens.filter(j=>!j.equipe).length }}</strong><small>sem equipe</small></div></div></article>
      </section>

      <section v-else-if="tela==='jovens'" class="page">
        <div class="splithead"><div><p class="muted">Cadastro central de participantes, visitantes e lideranças.</p></div><input class="search" v-model="busca" placeholder="Buscar jovem..." /></div>
        <form class="formcard" @submit.prevent="adicionarJovem"><input v-model="novo.nome" placeholder="Nome completo *"/><input v-model="novo.telefone" placeholder="Telefone"/><input v-model="novo.nascimento" type="date"/><input v-model="novo.equipe" placeholder="Equipe"/><label class="check"><input v-model="novo.menor" type="checkbox"/> Menor de idade</label><button class="primary">Adicionar</button></form>
        <article class="panel tablewrap"><table><thead><tr><th>Jovem</th><th>Telefone</th><th>Equipe</th><th>Perfil</th><th>Status</th></tr></thead><tbody><tr v-for="j in filtrados" :key="j.id"><td><strong>{{ j.nome }}</strong><small>{{ j.nascimento || 'Nascimento não informado' }}</small></td><td>{{ j.telefone || '—' }}</td><td>{{ j.equipe || 'Sem equipe' }}</td><td>{{ j.menor?'Menor':'Adulto' }}</td><td><span :class="['status',j.status==='Ativo'?'green':j.status==='Atenção'?'yellow':'red']">{{ j.status }}</span></td></tr></tbody></table></article>
      </section>

      <section v-else-if="tela==='eventos'" class="page">
        <p class="muted">Encontros, formações, retiros, viagens e demais atividades.</p>
        <form class="formcard" @submit.prevent="adicionarEvento"><input v-model="novoEvento.titulo" placeholder="Nome do evento *"/><input v-model="novoEvento.data" type="date"/><input v-model="novoEvento.local" placeholder="Local"/><button class="primary">Criar evento</button></form>
        <div class="cards"><article class="panel" v-for="e in eventos" :key="e.id"><span class="eyebrow">{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR') }}</span><h3>{{ e.titulo }}</h3><p>{{ e.local || 'Local a definir' }}</p><div class="cardfoot"><span>{{ e.inscritos }} inscritos</span><button class="link">Gerenciar</button></div></article></div>
      </section>

      <section v-else-if="tela==='presenca'" class="page">
        <div class="hero compact"><div><span class="eyebrow">CHECK-IN · {{ new Date().toLocaleDateString('pt-BR') }}</span><h2>Presença do encontro</h2><p>Funciona localmente e fica pronta para sincronização quando o backend estiver conectado.</p></div><div class="bigcount">{{ presentesHoje }}/{{ jovens.length }}</div></div>
        <article class="panel"><div v-for="j in jovens" :key="j.id" class="checkrow" @click="alternarPresenca(j.id)"><div class="avatar soft">{{ j.nome.split(' ').map(x=>x[0]).slice(0,2).join('') }}</div><div class="grow"><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }}</small></div><button :class="['presence', presente(j.id)?'yes':'']">{{ presente(j.id)?'✓ Presente':'Marcar presença' }}</button></div></article>
      </section>

      <section v-else class="page">
        <article class="empty"><div class="emptyicon">✦</div><h2>{{ tituloTela() }}</h2><p>O núcleo deste módulo já está previsto na arquitetura do SGJ e será conectado às próximas entregas.</p><button class="primary" @click="tela='dashboard'">Voltar ao painel</button></article>
      </section>
    </main>
  </div>
</template>
