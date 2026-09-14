<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { addLocalDays, isMinor, localDateISO } from './lib/date'
import { presenceRate, radarStatus } from './lib/domain'
import { decryptBackup, encryptBackup, validateBackupPayload } from './lib/backup'
import { hashPassword, verifyPassword } from './lib/auth'
import { loadSecure, saveSecure } from './lib/storage'

type StatusJovem = 'Ativo' | 'Atenção' | 'Acompanhamento'
type TipoJovem = 'Participante' | 'Visitante' | 'Liderança'
type GrupoTipo = 'Equipe' | 'Grupo' | 'Ministério'
type PerfilUsuario = 'Administrador Master' | 'Coordenação' | 'Liderança' | 'Comunicação' | 'Financeiro' | 'Consulta'
type Jovem = {
  id: string; nome: string; telefone: string; email?: string; nascimento: string; status: StatusJovem;
  equipe: string; menor: boolean; tipo: TipoJovem; responsavel?: string; telefoneResponsavel?: string; cadastradoEm: string
}
type Evento = { id: string; titulo: string; data: string; local: string; inscritos: number }
type Presenca = { jovemId: string; data: string; presente: boolean }
type Grupo = { id: string; nome: string; tipo: GrupoTipo; lider: string; ativo: boolean }
type Acompanhamento = { id: string; jovemId: string; motivo: string; responsavel: string; prazo: string; status: 'Pendente'|'Concluído'; criadoEm: string }
type Usuario = {
  id: string; nome: string; login: string; perfil: PerfilUsuario; ativo: boolean;
  passwordSalt: string; passwordHash: string; passwordIterations: number; ultimoAcesso?: string
}
type Configuracao = { nomeGrupo: string; cidade: string; radarAmarelo: number; radarVermelho: number }
type Auditoria = { id: string; timestamp: string; usuario: string; acao: string; detalhes?: string }
type Permission = 'dashboard'|'jovens'|'eventos'|'presenca'|'grupos'|'acompanhamento'|'relatorios'|'admin'|'backup'|'usuarios'

const VERSION = '0.3.0'
const desktopMode = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
const hoje = localDateISO()
const navBase = [
  ['dashboard','Painel'], ['jovens','Jovens'], ['eventos','Eventos'], ['presenca','Presença'],
  ['grupos','Grupos e equipes'], ['acompanhamento','Acompanhamento'], ['relatorios','Relatórios'], ['admin','Administração']
] as const
const permissions: Record<PerfilUsuario, Permission[]> = {
  'Administrador Master': ['dashboard','jovens','eventos','presenca','grupos','acompanhamento','relatorios','admin','backup','usuarios'],
  'Coordenação': ['dashboard','jovens','eventos','presenca','grupos','acompanhamento','relatorios','backup'],
  'Liderança': ['dashboard','jovens','eventos','presenca','grupos','acompanhamento','relatorios'],
  'Comunicação': ['dashboard','jovens','eventos'],
  'Financeiro': ['dashboard','eventos','relatorios'],
  'Consulta': ['dashboard','relatorios'],
}

const carregando = ref(true)
const pronto = ref(false)
const tela = ref<string>('dashboard')
const busca = ref('')
const aviso = ref('')
const usuarioAtual = ref<Usuario | null>(null)
const jovens = ref<Jovem[]>([])
const eventos = ref<Evento[]>([])
const presencas = ref<Presenca[]>([])
const grupos = ref<Grupo[]>([])
const acompanhamentos = ref<Acompanhamento[]>([])
const usuarios = ref<Usuario[]>([])
const auditoria = ref<Auditoria[]>([])
const configuracao = ref<Configuracao>({nomeGrupo:'Meu Grupo de Jovens',cidade:'',radarAmarelo:14,radarVermelho:30})

const setupForm = ref({nome:'',login:'admin',senha:'',confirmacao:''})
const loginForm = ref({login:'',senha:''})
const novo = ref({nome:'',telefone:'',email:'',nascimento:'',equipe:'',tipo:'Participante' as TipoJovem,responsavel:'',telefoneResponsavel:''})
const novoEvento = ref({titulo:'',data:'',local:''})
const novoGrupo = ref({nome:'',tipo:'Equipe' as GrupoTipo,lider:''})
const novoAcompanhamento = ref({jovemId:'',motivo:'',responsavel:'',prazo:''})
const novoUsuario = ref({nome:'',login:'',perfil:'Liderança' as PerfilUsuario,senha:''})

function pode(permission: Permission): boolean {
  return !!usuarioAtual.value && permissions[usuarioAtual.value.perfil].includes(permission)
}
const nav = computed(() => navBase.filter(item => pode(item[0] as Permission)))
const precisaSetup = computed(() => !carregando.value && usuarios.value.length === 0)
const novoMenor = computed(() => isMinor(novo.value.nascimento))

onMounted(async () => {
  const [j, e, p, g, a, u, c, log] = await Promise.all([
    loadSecure<Jovem[]>('sgj_jovens', []),
    loadSecure<Evento[]>('sgj_eventos', []),
    loadSecure<Presenca[]>('sgj_presencas', []),
    loadSecure<Grupo[]>('sgj_grupos', []),
    loadSecure<Acompanhamento[]>('sgj_acompanhamentos', []),
    loadSecure<Usuario[]>('sgj_usuarios', []),
    loadSecure<Configuracao>('sgj_config', configuracao.value),
    loadSecure<Auditoria[]>('sgj_auditoria', []),
  ])
  jovens.value = j.map(item => ({
    ...item,
    tipo: item.tipo || 'Participante',
    menor: isMinor(item.nascimento),
    cadastradoEm: item.cadastradoEm || hoje,
  }))
  eventos.value = e
  presencas.value = p
  grupos.value = g
  acompanhamentos.value = a
  usuarios.value = u.filter(user => user.login && user.passwordHash && user.passwordSalt)
  configuracao.value = c
  auditoria.value = log
  pronto.value = true
  carregando.value = false
})

watch(jovens, v => { if(pronto.value) void saveSecure('sgj_jovens', v) }, {deep:true})
watch(eventos, v => { if(pronto.value) void saveSecure('sgj_eventos', v) }, {deep:true})
watch(presencas, v => { if(pronto.value) void saveSecure('sgj_presencas', v) }, {deep:true})
watch(grupos, v => { if(pronto.value) void saveSecure('sgj_grupos', v) }, {deep:true})
watch(acompanhamentos, v => { if(pronto.value) void saveSecure('sgj_acompanhamentos', v) }, {deep:true})
watch(usuarios, v => { if(pronto.value) void saveSecure('sgj_usuarios', v) }, {deep:true})
watch(configuracao, v => { if(pronto.value) void saveSecure('sgj_config', v) }, {deep:true})
watch(auditoria, v => { if(pronto.value) void saveSecure('sgj_auditoria', v.slice(0,5000)) }, {deep:true})

function registrarAcao(acao:string, detalhes='') {
  auditoria.value.unshift({
    id: crypto.randomUUID(), timestamp: new Date().toISOString(), usuario: usuarioAtual.value?.login || 'sistema', acao, detalhes
  })
  if (auditoria.value.length > 5000) auditoria.value.length = 5000
}

async function criarPrimeiroAdministrador() {
  if (!setupForm.value.nome.trim() || !setupForm.value.login.trim()) return mostrarAviso('Informe nome e login do administrador.')
  if (setupForm.value.senha !== setupForm.value.confirmacao) return mostrarAviso('As senhas não conferem.')
  try {
    const password = await hashPassword(setupForm.value.senha)
    const user: Usuario = {
      id: crypto.randomUUID(), nome: setupForm.value.nome.trim(), login: setupForm.value.login.trim().toLowerCase(),
      perfil: 'Administrador Master', ativo: true, passwordSalt: password.salt, passwordHash: password.hash,
      passwordIterations: password.iterations, ultimoAcesso: new Date().toISOString()
    }
    usuarios.value = [user]
    usuarioAtual.value = user
    registrarAcao('SEGURANÇA_ADMIN_CRIADO', 'Primeiro administrador local configurado.')
    setupForm.value = {nome:'',login:'admin',senha:'',confirmacao:''}
  } catch (error) { mostrarAviso(error instanceof Error ? error.message : 'Não foi possível criar o administrador.') }
}

async function entrar() {
  const login = loginForm.value.login.trim().toLowerCase()
  const user = usuarios.value.find(u => u.login.toLowerCase() === login && u.ativo)
  if (!user || !(await verifyPassword(loginForm.value.senha, user.passwordSalt, user.passwordHash, user.passwordIterations))) {
    registrarAcao('LOGIN_FALHA', `Tentativa para ${login || '(vazio)'}`)
    return mostrarAviso('Login ou senha inválidos.')
  }
  user.ultimoAcesso = new Date().toISOString()
  usuarioAtual.value = user
  loginForm.value = {login:'',senha:''}
  registrarAcao('LOGIN_SUCESSO')
}

function sair() {
  registrarAcao('LOGOUT')
  usuarioAtual.value = null
  tela.value = 'dashboard'
}

const filtrados = computed(() => jovens.value.filter(j => [j.nome,j.telefone,j.email,j.equipe].some(v => (v||'').toLowerCase().includes(busca.value.toLowerCase()))))
const ativos = computed(() => jovens.value.filter(j => j.status === 'Ativo').length)
const alertas = computed(() => jovens.value.filter(j => j.status !== 'Ativo').length)
const menores = computed(() => jovens.value.filter(j => j.menor).length)
const visitantes = computed(() => jovens.value.filter(j => j.tipo === 'Visitante').length)
const presentesHoje = computed(() => presencas.value.filter(p => p.data === hoje && p.presente).length)
const pendentes = computed(() => acompanhamentos.value.filter(a => a.status === 'Pendente').length)
const diasComPresenca = computed(() => new Set(presencas.value.map(p => p.data)).size)
const taxaPresenca = computed(() => presenceRate(jovens.value, presencas.value))
const aniversariantesMes = computed(() => {
  const mes = new Date().getMonth()+1
  return jovens.value.filter(j => j.nascimento && Number(j.nascimento.slice(5,7)) === mes)
})
const distribuicaoEquipes = computed(() => grupos.value.filter(g=>g.ativo).map(g => ({...g,membros:jovens.value.filter(j=>j.equipe===g.nome).length})))

function adicionarJovem(){
  if(!pode('jovens')) return
  if(!novo.value.nome.trim() || !novo.value.nascimento) return mostrarAviso('Nome e data de nascimento são obrigatórios.')
  if(novoMenor.value && (!novo.value.responsavel.trim() || !novo.value.telefoneResponsavel.trim())) return mostrarAviso('Para menor de idade, informe responsável legal e telefone.')
  jovens.value.unshift({
    id:crypto.randomUUID(), nome:novo.value.nome.trim(), telefone:novo.value.telefone.trim(), email:novo.value.email.trim(),
    nascimento:novo.value.nascimento, equipe:novo.value.equipe, menor:novoMenor.value, tipo:novo.value.tipo,
    responsavel:novoMenor.value?novo.value.responsavel.trim():'', telefoneResponsavel:novoMenor.value?novo.value.telefoneResponsavel.trim():'',
    status:'Ativo', cadastradoEm:hoje
  })
  registrarAcao('JOVEM_CADASTRADO', novo.value.nome.trim())
  novo.value={nome:'',telefone:'',email:'',nascimento:'',equipe:'',tipo:'Participante',responsavel:'',telefoneResponsavel:''}
  mostrarAviso('Jovem cadastrado com sucesso.')
}

function adicionarEvento(){
  if(!pode('eventos')) return
  if(!novoEvento.value.titulo.trim() || !novoEvento.value.data) return mostrarAviso('Informe nome e data do evento.')
  eventos.value.unshift({id:crypto.randomUUID(),titulo:novoEvento.value.titulo.trim(),data:novoEvento.value.data,local:novoEvento.value.local.trim(),inscritos:0})
  registrarAcao('EVENTO_CRIADO', novoEvento.value.titulo.trim())
  novoEvento.value={titulo:'',data:'',local:''}
  mostrarAviso('Evento criado.')
}
function alterarInscritos(id:string, delta:number){ if(!pode('eventos')) return; const e=eventos.value.find(x=>x.id===id); if(e) e.inscritos=Math.max(0,e.inscritos+delta) }

function adicionarGrupo(){
  if(!pode('grupos')) return
  if(!novoGrupo.value.nome.trim()) return mostrarAviso('Informe o nome do grupo ou equipe.')
  if(grupos.value.some(g=>g.nome.toLowerCase()===novoGrupo.value.nome.trim().toLowerCase() && g.ativo)) return mostrarAviso('Já existe um grupo ativo com esse nome.')
  grupos.value.push({id:crypto.randomUUID(),nome:novoGrupo.value.nome.trim(),tipo:novoGrupo.value.tipo,lider:novoGrupo.value.lider.trim(),ativo:true})
  registrarAcao('GRUPO_CRIADO', novoGrupo.value.nome.trim())
  novoGrupo.value={nome:'',tipo:'Equipe',lider:''}
  mostrarAviso('Grupo ou equipe criado.')
}
function desativarGrupo(id:string){
  if(!pode('grupos')) return
  const grupo=grupos.value.find(g=>g.id===id)
  if(grupo){ grupo.ativo=false; registrarAcao('GRUPO_DESATIVADO',grupo.nome); mostrarAviso('Grupo desativado.') }
}

function adicionarAcompanhamento(){
  if(!pode('acompanhamento')) return
  if(!novoAcompanhamento.value.jovemId || !novoAcompanhamento.value.motivo.trim()) return mostrarAviso('Selecione o jovem e informe o motivo.')
  acompanhamentos.value.unshift({id:crypto.randomUUID(),jovemId:novoAcompanhamento.value.jovemId,motivo:novoAcompanhamento.value.motivo.trim(),responsavel:novoAcompanhamento.value.responsavel.trim(),prazo:novoAcompanhamento.value.prazo,status:'Pendente',criadoEm:hoje})
  const jovem=jovens.value.find(j=>j.id===novoAcompanhamento.value.jovemId); if(jovem) jovem.status='Acompanhamento'
  registrarAcao('ACOMPANHAMENTO_REGISTRADO', nomeJovem(novoAcompanhamento.value.jovemId))
  novoAcompanhamento.value={jovemId:'',motivo:'',responsavel:'',prazo:''}
  mostrarAviso('Acompanhamento registrado.')
}
function concluirAcompanhamento(id:string){
  if(!pode('acompanhamento')) return
  const a=acompanhamentos.value.find(x=>x.id===id)
  if(a){a.status='Concluído'; registrarAcao('ACOMPANHAMENTO_CONCLUIDO',nomeJovem(a.jovemId)); mostrarAviso('Acompanhamento concluído.')}
}
function nomeJovem(id:string){ return jovens.value.find(j=>j.id===id)?.nome || 'Jovem não localizado' }

async function adicionarUsuario(){
  if(!pode('usuarios')) return
  const login=novoUsuario.value.login.trim().toLowerCase()
  if(!novoUsuario.value.nome.trim() || !login) return mostrarAviso('Informe nome e login.')
  if(usuarios.value.some(u=>u.login.toLowerCase()===login)) return mostrarAviso('Este login já está em uso.')
  try{
    const password=await hashPassword(novoUsuario.value.senha)
    usuarios.value.push({id:crypto.randomUUID(),nome:novoUsuario.value.nome.trim(),login,perfil:novoUsuario.value.perfil,ativo:true,passwordSalt:password.salt,passwordHash:password.hash,passwordIterations:password.iterations})
    registrarAcao('USUARIO_CRIADO',`${login} · ${novoUsuario.value.perfil}`)
    novoUsuario.value={nome:'',login:'',perfil:'Liderança',senha:''}
    mostrarAviso('Usuário criado.')
  }catch(error){ mostrarAviso(error instanceof Error?error.message:'Não foi possível criar o usuário.') }
}
function alternarUsuario(id:string){
  if(!pode('usuarios')) return
  const user=usuarios.value.find(u=>u.id===id)
  if(!user) return
  if(user.id===usuarioAtual.value?.id) return mostrarAviso('Você não pode desativar a própria sessão.')
  user.ativo=!user.ativo
  registrarAcao(user.ativo?'USUARIO_ATIVADO':'USUARIO_DESATIVADO',user.login)
}

function presente(id:string){ return presencas.value.some(p => p.jovemId===id && p.data===hoje && p.presente) }
function alternarPresenca(id:string){
  if(!pode('presenca')) return
  const idx=presencas.value.findIndex(p=>p.jovemId===id && p.data===hoje)
  if(idx>=0) presencas.value[idx].presente=!presencas.value[idx].presente
  else presencas.value.push({jovemId:id,data:hoje,presente:true})
  registrarAcao('PRESENCA_ALTERADA',`${nomeJovem(id)} · ${presente(id)?'presente':'ausente'}`)
}
function marcarTodosPresentes(){
  if(!pode('presenca')) return
  jovens.value.filter(j=>j.cadastradoEm<=hoje).forEach(j=>{ const idx=presencas.value.findIndex(p=>p.jovemId===j.id && p.data===hoje); if(idx>=0) presencas.value[idx].presente=true; else presencas.value.push({jovemId:j.id,data:hoje,presente:true}) })
  registrarAcao('PRESENCA_TODOS',hoje)
  mostrarAviso('Todos os elegíveis foram marcados como presentes.')
}

function recalcularRadar(){
  if(!pode('dashboard')) return
  jovens.value.forEach(j=>{
    const datas=presencas.value.filter(p=>p.jovemId===j.id && p.presente).map(p=>p.data).sort().reverse()
    j.status=radarStatus(datas[0]||null,j.cadastradoEm||hoje,hoje,configuracao.value.radarAmarelo,configuracao.value.radarVermelho)
  })
  registrarAcao('RADAR_RECALCULADO',`amarelo=${configuracao.value.radarAmarelo}; vermelho=${configuracao.value.radarVermelho}`)
  mostrarAviso('Radar recalculado conforme os limites configurados.')
}

function carregarDadosDemo(){
  if(!pode('admin')) return
  if(jovens.value.length && !window.confirm('Já existem cadastros. Deseja adicionar também os dados demonstrativos?')) return
  const demo: Jovem[]=[
    {id:crypto.randomUUID(),nome:'Jovem Exemplo 1',telefone:'(00) 90000-0001',email:'exemplo1@invalid.test',nascimento:'2008-04-18',status:'Ativo',equipe:'Acolhida',menor:isMinor('2008-04-18'),tipo:'Participante',responsavel:'Responsável Exemplo',telefoneResponsavel:'(00) 90000-1001',cadastradoEm:hoje},
    {id:crypto.randomUUID(),nome:'Jovem Exemplo 2',telefone:'(00) 90000-0002',email:'',nascimento:'2005-11-03',status:'Ativo',equipe:'Música',menor:false,tipo:'Liderança',cadastradoEm:hoje},
  ]
  jovens.value.unshift(...demo)
  if(!grupos.value.some(g=>g.nome==='Acolhida')) grupos.value.push({id:crypto.randomUUID(),nome:'Acolhida',tipo:'Equipe',lider:'',ativo:true})
  if(!grupos.value.some(g=>g.nome==='Música')) grupos.value.push({id:crypto.randomUUID(),nome:'Música',tipo:'Ministério',lider:'',ativo:true})
  if(!eventos.value.length) eventos.value.push({id:crypto.randomUUID(),titulo:'Encontro demonstrativo',data:addLocalDays(7),local:'Local de exemplo',inscritos:0})
  registrarAcao('DADOS_DEMO_CARREGADOS')
  mostrarAviso('Dados fictícios carregados para teste.')
}

function tituloTela(){ return navBase.find(n=>n[0]===tela.value)?.[1] || 'SGJ' }
function statusClasse(status:StatusJovem){ return status==='Ativo'?'green':status==='Atenção'?'yellow':'red' }
function iniciais(nome:string){ return nome.split(' ').filter(Boolean).map(x=>x[0]).slice(0,2).join('').toUpperCase() }
function mostrarAviso(texto:string){ aviso.value=texto; window.setTimeout(()=>{ if(aviso.value===texto) aviso.value='' },3500) }

async function exportarBackup(){
  if(!pode('backup')) return
  const senha=window.prompt('Defina uma senha forte (mínimo 8 caracteres) para criptografar o backup:')
  if(!senha) return
  const confirmacao=window.prompt('Repita a senha do backup:')
  if(senha!==confirmacao) return mostrarAviso('As senhas do backup não conferem.')
  try{
    const payload={versao:VERSION,geradoEm:new Date().toISOString(),dados:{jovens:jovens.value,eventos:eventos.value,presencas:presencas.value,grupos:grupos.value,acompanhamentos:acompanhamentos.value,usuarios:usuarios.value,auditoria:auditoria.value,configuracao:configuracao.value}}
    const encrypted=await encryptBackup(payload,senha)
    const blob=new Blob([encrypted],{type:'application/json'})
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`sgj-backup-${hoje}.sgjbackup`; a.click(); URL.revokeObjectURL(url)
    registrarAcao('BACKUP_EXPORTADO')
    mostrarAviso('Backup criptografado exportado.')
  }catch(error){ mostrarAviso(error instanceof Error?error.message:'Falha ao exportar backup.') }
}
async function importarBackup(event:Event){
  if(!pode('backup')) return
  const input=event.target as HTMLInputElement; const arquivo=input.files?.[0]; if(!arquivo) return
  const senha=window.prompt('Digite a senha usada para criptografar este backup:')
  if(!senha){ input.value=''; return }
  try{
    const backup=await decryptBackup(await arquivo.text(),senha)
    if(!validateBackupPayload(backup)) throw new Error('Estrutura do backup inválida.')
    const d=backup.dados as any
    jovens.value=d.jovens.map((j:Jovem)=>({...j,menor:isMinor(j.nascimento),cadastradoEm:j.cadastradoEm||hoje,tipo:j.tipo||'Participante'}))
    eventos.value=d.eventos; presencas.value=d.presencas; grupos.value=d.grupos; acompanhamentos.value=d.acompanhamentos
    usuarios.value=d.usuarios; auditoria.value=d.auditoria; configuracao.value=d.configuracao
    registrarAcao('BACKUP_IMPORTADO',arquivo.name)
    mostrarAviso('Backup validado, descriptografado e importado.')
  }catch(error){ mostrarAviso(error instanceof Error?error.message:'Não foi possível importar o backup.') }
  input.value=''
}
</script>

<template>
  <div v-if="carregando" class="authpage"><div class="authcard"><div class="brandmark">SGJ</div><h1>Carregando base segura…</h1><p>Preparando armazenamento protegido.</p></div></div>

  <div v-else-if="precisaSetup" class="authpage">
    <form class="authcard" @submit.prevent="criarPrimeiroAdministrador">
      <div class="brandmark">SGJ</div><h1>Configuração inicial</h1><p>Crie o primeiro Administrador Master. Não existe senha padrão.</p>
      <label class="field"><span>Nome completo</span><input v-model="setupForm.nome" autocomplete="name" required /></label>
      <label class="field"><span>Login</span><input v-model="setupForm.login" autocomplete="username" required /></label>
      <label class="field"><span>Senha (mínimo 8 caracteres)</span><input v-model="setupForm.senha" type="password" minlength="8" autocomplete="new-password" required /></label>
      <label class="field"><span>Confirmar senha</span><input v-model="setupForm.confirmacao" type="password" minlength="8" autocomplete="new-password" required /></label>
      <button class="primary">Criar administrador e entrar</button>
    </form>
  </div>

  <div v-else-if="!usuarioAtual" class="authpage">
    <form class="authcard" @submit.prevent="entrar">
      <div class="brandmark">SGJ</div><h1>Acesso ao SGJ</h1><p>Entre com um usuário ativo deste dispositivo.</p>
      <label class="field"><span>Login</span><input v-model="loginForm.login" autocomplete="username" required /></label>
      <label class="field"><span>Senha</span><input v-model="loginForm.senha" type="password" autocomplete="current-password" required /></label>
      <button class="primary">Entrar</button>
    </form>
    <div v-if="aviso" class="toast">{{ aviso }}</div>
  </div>

  <div v-else class="shell">
    <aside class="sidebar">
      <div class="brand"><div class="brandmark">SGJ</div><div><strong>Gestor de Jovens</strong><small>v{{ VERSION }} · Web + PC</small></div></div>
      <nav><button v-for="item in nav" :key="item[0]" :class="{active:tela===item[0]}" @click="tela=item[0]"><span class="dot"></span>{{ item[1] }}</button></nav>
      <div class="sync"><span class="online"></span><div><strong>Base local protegida</strong><small>{{ desktopMode ? 'SQLite + criptografia' : 'IndexedDB + criptografia' }}</small></div></div>
    </aside>

    <main>
      <header>
        <div><small>{{ configuracao.nomeGrupo }}<template v-if="configuracao.cidade"> · {{ configuracao.cidade }}</template></small><h1>{{ tituloTela() }}</h1></div>
        <div class="user"><div class="avatar">{{ iniciais(usuarioAtual.nome) }}</div><div><strong>{{ usuarioAtual.nome }}</strong><small>{{ usuarioAtual.perfil }} · <button class="link inline" @click="sair">Sair</button></small></div></div>
      </header>
      <div v-if="aviso" class="toast">{{ aviso }}</div>

      <section v-if="tela==='dashboard'" class="page">
        <div class="hero"><div><span class="eyebrow">VISÃO GERAL</span><h2>Boa gestão começa por pessoas.</h2><p>Acompanhe integração, presença, equipes e quem precisa de atenção.</p></div><div class="heroactions"><button class="ghost" @click="recalcularRadar">Recalcular radar</button><button v-if="pode('jovens')" class="primary" @click="tela='jovens'">+ Cadastrar jovem</button></div></div>
        <div class="metrics">
          <article><small>Jovens cadastrados</small><strong>{{ jovens.length }}</strong><span>{{ visitantes }} visitantes</span></article>
          <article><small>Ativos</small><strong>{{ ativos }}</strong><span class="good">Participação regular</span></article>
          <article><small>Precisam de atenção</small><strong>{{ alertas }}</strong><span class="warn">{{ pendentes }} acompanhamentos pendentes</span></article>
          <article><small>Presentes hoje</small><strong>{{ presentesHoje }}</strong><span>{{ jovens.length ? Math.round(presentesHoje/jovens.length*100) : 0 }}% da base</span></article>
        </div>
        <div class="grid2">
          <article class="panel"><div class="panelhead"><div><small>RADAR</small><h3>Acompanhamento</h3></div><span class="badge">{{ alertas }} alertas</span></div>
            <div v-if="!alertas" class="quiet">Nenhum alerta no radar.</div>
            <div v-for="j in jovens.filter(x=>x.status!=='Ativo')" :key="j.id" class="person"><div class="avatar soft">{{ iniciais(j.nome) }}</div><div><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }} · {{ j.tipo }}</small></div><span :class="['status',statusClasse(j.status)]">{{ j.status }}</span></div>
          </article>
          <article class="panel"><div class="panelhead"><div><small>AGENDA</small><h3>Próximos eventos</h3></div><button v-if="pode('eventos')" class="link" @click="tela='eventos'">Ver todos</button></div>
            <div v-if="!eventos.length" class="quiet">Nenhum evento cadastrado.</div>
            <div v-for="e in eventos.slice(0,4)" :key="e.id" class="event"><div class="date"><strong>{{ e.data.slice(8,10) }}</strong><small>{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','') }}</small></div><div><strong>{{ e.titulo }}</strong><small>{{ e.local || 'Local a definir' }} · {{ e.inscritos }} inscritos</small></div></div>
          </article>
        </div>
        <article class="panel"><div class="panelhead"><div><small>BASE</small><h3>Resumo cadastral</h3></div></div><div class="summary"><div><strong>{{ menores }}</strong><small>menores de idade</small></div><div><strong>{{ jovens.length-menores }}</strong><small>maiores de idade</small></div><div><strong>{{ jovens.filter(j=>j.equipe).length }}</strong><small>em equipes</small></div><div><strong>{{ aniversariantesMes.length }}</strong><small>aniversários no mês</small></div></div></article>
      </section>

      <section v-else-if="tela==='jovens' && pode('jovens')" class="page">
        <div class="splithead"><p class="muted">Cadastro central de participantes, visitantes e lideranças.</p><label class="sr-field"><span class="sr-only">Buscar jovens</span><input class="search" v-model="busca" placeholder="Buscar nome, telefone, e-mail ou equipe..." /></label></div>
        <form class="formcard formgrid" @submit.prevent="adicionarJovem">
          <label class="field"><span>Nome completo *</span><input v-model="novo.nome" required /></label>
          <label class="field"><span>Telefone</span><input v-model="novo.telefone" inputmode="tel" /></label>
          <label class="field"><span>E-mail</span><input v-model="novo.email" type="email" /></label>
          <label class="field"><span>Data de nascimento *</span><input v-model="novo.nascimento" type="date" required /></label>
          <label class="field"><span>Perfil</span><select v-model="novo.tipo"><option>Participante</option><option>Visitante</option><option>Liderança</option></select></label>
          <label class="field"><span>Equipe</span><select v-model="novo.equipe"><option value="">Sem equipe</option><option v-for="g in grupos.filter(x=>x.ativo)" :key="g.id" :value="g.nome">{{ g.nome }}</option></select></label>
          <div class="minor-info"><strong>{{ novo.nascimento ? (novoMenor?'Menor de idade':'Maior de idade') : 'Informe o nascimento' }}</strong><small>A situação é calculada automaticamente.</small></div>
          <template v-if="novoMenor"><label class="field"><span>Responsável legal *</span><input v-model="novo.responsavel" required /></label><label class="field"><span>Telefone do responsável *</span><input v-model="novo.telefoneResponsavel" inputmode="tel" required /></label></template>
          <button class="primary">Adicionar jovem</button>
        </form>
        <article class="panel tablewrap"><table><thead><tr><th>Jovem</th><th>Contato</th><th>Equipe</th><th>Perfil</th><th>Status</th></tr></thead><tbody><tr v-for="j in filtrados" :key="j.id"><td><strong>{{ j.nome }}</strong><small>{{ j.nascimento }}<template v-if="j.menor"> · Resp.: {{ j.responsavel }}</template></small></td><td>{{ j.telefone || '—' }}<small>{{ j.email || (j.menor ? j.telefoneResponsavel : '') || '—' }}</small></td><td>{{ j.equipe || 'Sem equipe' }}</td><td>{{ j.tipo }}<small>{{ j.menor?'Menor':'Adulto' }}</small></td><td><label class="sr-field"><span class="sr-only">Status de {{ j.nome }}</span><select class="statusselect" v-model="j.status"><option>Ativo</option><option>Atenção</option><option>Acompanhamento</option></select></label></td></tr></tbody></table></article>
      </section>

      <section v-else-if="tela==='eventos' && pode('eventos')" class="page">
        <p class="muted">Encontros, formações, retiros, viagens e demais atividades.</p>
        <form class="formcard" @submit.prevent="adicionarEvento"><label class="field"><span>Nome do evento *</span><input v-model="novoEvento.titulo" required /></label><label class="field"><span>Data *</span><input v-model="novoEvento.data" type="date" required /></label><label class="field"><span>Local</span><input v-model="novoEvento.local" /></label><button class="primary">Criar evento</button></form>
        <div class="cards"><article class="panel" v-for="e in eventos" :key="e.id"><span class="eyebrow">{{ new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR') }}</span><h3>{{ e.titulo }}</h3><p>{{ e.local || 'Local a definir' }}</p><div class="cardfoot"><span><strong>{{ e.inscritos }}</strong> inscritos</span><div class="stepper"><button type="button" :aria-label="`Diminuir inscritos de ${e.titulo}`" @click="alterarInscritos(e.id,-1)">−</button><button type="button" :aria-label="`Aumentar inscritos de ${e.titulo}`" @click="alterarInscritos(e.id,1)">+</button></div></div></article></div>
      </section>

      <section v-else-if="tela==='presenca' && pode('presenca')" class="page">
        <div class="hero compact"><div><span class="eyebrow">CHECK-IN · {{ new Date().toLocaleDateString('pt-BR') }}</span><h2>Presença do encontro</h2><p>Marcações protegidas na base local e disponíveis mesmo sem internet.</p></div><div class="heroactions"><div class="bigcount">{{ presentesHoje }}/{{ jovens.length }}</div><button class="ghost" @click="marcarTodosPresentes">Marcar todos</button></div></div>
        <article class="panel"><div v-for="j in jovens" :key="j.id" class="checkrow"><div class="avatar soft">{{ iniciais(j.nome) }}</div><div class="grow"><strong>{{ j.nome }}</strong><small>{{ j.equipe || 'Sem equipe' }}</small></div><button type="button" :aria-pressed="presente(j.id)" :aria-label="`${presente(j.id)?'Desmarcar':'Marcar'} presença de ${j.nome}`" :class="['presence', presente(j.id)?'yes':'']" @click="alternarPresenca(j.id)">{{ presente(j.id)?'✓ Presente':'Marcar presença' }}</button></div></article>
      </section>

      <section v-else-if="tela==='grupos' && pode('grupos')" class="page">
        <div class="splithead"><p class="muted">Equipes, ministérios e pequenos grupos com liderança definida.</p><span class="badge">{{ grupos.filter(g=>g.ativo).length }} ativos</span></div>
        <form class="formcard" @submit.prevent="adicionarGrupo"><label class="field"><span>Nome do grupo/equipe *</span><input v-model="novoGrupo.nome" required /></label><label class="field"><span>Tipo</span><select v-model="novoGrupo.tipo"><option>Equipe</option><option>Grupo</option><option>Ministério</option></select></label><label class="field"><span>Líder responsável</span><input v-model="novoGrupo.lider" /></label><button class="primary">Criar</button></form>
        <div class="cards"><article class="panel" v-for="g in distribuicaoEquipes" :key="g.id"><span class="eyebrow">{{ g.tipo.toUpperCase() }}</span><h3>{{ g.nome }}</h3><p>Liderança: <strong>{{ g.lider || 'não definida' }}</strong></p><div class="cardfoot"><span>{{ g.membros }} integrantes</span><button class="link" @click="desativarGrupo(g.id)">Desativar</button></div></article></div>
      </section>

      <section v-else-if="tela==='acompanhamento' && pode('acompanhamento')" class="page">
        <div class="splithead"><p class="muted">Registre contatos e tarefas de cuidado com acesso restrito aos perfis autorizados.</p><span class="badge">{{ pendentes }} pendentes</span></div>
        <form class="formcard formgrid" @submit.prevent="adicionarAcompanhamento"><label class="field"><span>Jovem *</span><select v-model="novoAcompanhamento.jovemId" required><option value="">Selecione</option><option v-for="j in jovens" :key="j.id" :value="j.id">{{ j.nome }}</option></select></label><label class="field"><span>Motivo / próxima ação *</span><input v-model="novoAcompanhamento.motivo" required /></label><label class="field"><span>Responsável pelo contato</span><input v-model="novoAcompanhamento.responsavel" /></label><label class="field"><span>Prazo</span><input v-model="novoAcompanhamento.prazo" type="date" /></label><button class="primary">Registrar</button></form>
        <article class="panel tablewrap"><table><thead><tr><th>Jovem</th><th>Motivo</th><th>Responsável</th><th>Prazo</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="a in acompanhamentos" :key="a.id"><td><strong>{{ nomeJovem(a.jovemId) }}</strong><small>Criado em {{ new Date(a.criadoEm+'T12:00:00').toLocaleDateString('pt-BR') }}</small></td><td>{{ a.motivo }}</td><td>{{ a.responsavel || '—' }}</td><td>{{ a.prazo ? new Date(a.prazo+'T12:00:00').toLocaleDateString('pt-BR') : '—' }}</td><td><span :class="['status',a.status==='Concluído'?'green':'yellow']">{{ a.status }}</span></td><td><button v-if="a.status==='Pendente'" class="link" @click="concluirAcompanhamento(a.id)">Concluir</button></td></tr></tbody></table></article>
      </section>

      <section v-else-if="tela==='relatorios' && pode('relatorios')" class="page">
        <div class="reportgrid"><article class="panel reportcard"><small>PRESENÇA GERAL</small><strong>{{ taxaPresenca }}%</strong><p>Considera somente quem já estava cadastrado em cada data.</p></article><article class="panel reportcard"><small>INTEGRAÇÃO</small><strong>{{ visitantes }}</strong><p>Visitantes cadastrados para acompanhamento.</p></article><article class="panel reportcard"><small>PROTEÇÃO</small><strong>{{ menores }}</strong><p>Menores vinculados a responsável.</p></article><article class="panel reportcard"><small>FOLLOW-UP</small><strong>{{ pendentes }}</strong><p>Tarefas de acompanhamento em aberto.</p></article></div>
        <div class="grid2"><article class="panel"><div class="panelhead"><div><small>DISTRIBUIÇÃO</small><h3>Jovens por equipe</h3></div></div><div v-for="g in distribuicaoEquipes" :key="g.id" class="barrow"><span>{{ g.nome }}</span><div class="bar"><i :style="{width: jovens.length ? Math.max(4,g.membros/jovens.length*100)+'%' : '0%'}"></i></div><strong>{{ g.membros }}</strong></div><div class="barrow"><span>Sem equipe</span><div class="bar"><i :style="{width: jovens.length ? Math.max(4,jovens.filter(j=>!j.equipe).length/jovens.length*100)+'%' : '0%'}"></i></div><strong>{{ jovens.filter(j=>!j.equipe).length }}</strong></div></article><article class="panel"><div class="panelhead"><div><small>ANIVERSÁRIOS</small><h3>Neste mês</h3></div></div><div v-if="!aniversariantesMes.length" class="quiet">Nenhum aniversário cadastrado neste mês.</div><div v-for="j in aniversariantesMes" :key="j.id" class="person"><div class="avatar soft">{{ j.nascimento.slice(8,10) }}</div><div><strong>{{ j.nome }}</strong><small>{{ new Date(j.nascimento+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long'}) }}</small></div></div></article></div>
      </section>

      <section v-else-if="tela==='admin' && pode('admin')" class="page">
        <div class="admin-grid">
          <article class="panel"><div class="panelhead"><div><small>ORGANIZAÇÃO</small><h3>Configuração</h3></div></div><div class="stack"><label>Nome do grupo<input v-model="configuracao.nomeGrupo"/></label><label>Cidade<input v-model="configuracao.cidade"/></label><div class="twocol"><label>Alerta amarelo (dias)<input v-model.number="configuracao.radarAmarelo" type="number" min="1"/></label><label>Alerta vermelho (dias)<input v-model.number="configuracao.radarVermelho" type="number" :min="configuracao.radarAmarelo+1"/></label></div><button class="secondary" @click="recalcularRadar">Aplicar regras ao radar</button><button class="secondary" @click="carregarDadosDemo">Carregar dados fictícios para teste</button></div></article>
          <article v-if="pode('backup')" class="panel"><div class="panelhead"><div><small>DADOS</small><h3>Backup criptografado</h3></div></div><p class="muted">O arquivo é protegido por AES-GCM e senha definida no momento da exportação.</p><div class="actions"><button class="primary" @click="exportarBackup">Exportar backup seguro</button><label class="filebtn">Importar backup<input type="file" accept=".sgjbackup,application/json" @change="importarBackup"/></label></div><div class="notice">Guarde a senha do backup em local seguro. Sem ela, o arquivo não pode ser restaurado.</div></article>
        </div>
        <article v-if="pode('usuarios')" class="panel"><div class="panelhead"><div><small>ACESSOS</small><h3>Usuários e perfis</h3></div><span class="badge">{{ usuarios.filter(u=>u.ativo).length }} ativos</span></div><form class="inlineform" @submit.prevent="adicionarUsuario"><label class="field"><span>Nome</span><input v-model="novoUsuario.nome" required /></label><label class="field"><span>Login</span><input v-model="novoUsuario.login" autocomplete="off" required /></label><label class="field"><span>Perfil</span><select v-model="novoUsuario.perfil"><option>Administrador Master</option><option>Coordenação</option><option>Liderança</option><option>Comunicação</option><option>Financeiro</option><option>Consulta</option></select></label><label class="field"><span>Senha inicial</span><input v-model="novoUsuario.senha" type="password" minlength="8" autocomplete="new-password" required /></label><button class="primary">Criar usuário</button></form><div class="userlist"><div v-for="u in usuarios" :key="u.id" class="person"><div class="avatar soft">{{ iniciais(u.nome) }}</div><div><strong>{{ u.nome }}</strong><small>{{ u.login }} · {{ u.perfil }}</small></div><button class="link" :disabled="u.id===usuarioAtual.id" @click="alternarUsuario(u.id)">{{ u.ativo?'Desativar':'Ativar' }}</button></div></div></article>
        <article class="panel audit-panel"><div class="panelhead"><div><small>AUDITORIA</small><h3>Últimas ações</h3></div><span class="badge">{{ auditoria.length }} registros</span></div><div v-if="!auditoria.length" class="quiet">Ainda não há ações registradas.</div><div v-for="log in auditoria.slice(0,30)" :key="log.id" class="auditrow"><time>{{ new Date(log.timestamp).toLocaleString('pt-BR') }}</time><strong>{{ log.acao }}</strong><span>{{ log.usuario }}<template v-if="log.detalhes"> · {{ log.detalhes }}</template></span></div></article>
      </section>

      <section v-else class="page"><article class="panel"><h3>Acesso não autorizado</h3><p class="muted">Seu perfil não possui permissão para esta área.</p></article></section>
    </main>
  </div>
</template>
