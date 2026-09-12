# Requisitos e módulos do SGJ

## 1. Perfis de usuário

O sistema deverá suportar, inicialmente:

- Administrador Master
- Administrador
- Coordenação geral
- Liderança
- Secretaria
- Financeiro
- Comunicação
- Voluntário
- Jovem/participante
- Responsável legal

As permissões devem ser granulares por módulo e ação: visualizar, criar, editar, excluir, exportar, aprovar e administrar.

## 2. Dashboard

Indicadores principais:

- jovens ativos
- visitantes recentes
- novos cadastros
- aniversariantes
- presença média
- ausentes consecutivos
- pessoas em acompanhamento
- próximos eventos
- inscrições pendentes
- escalas abertas
- documentos/autorizações pendentes

## 3. Pessoas

Cadastro completo com:

- foto
- nome completo
- apelido/nome preferencial
- data de nascimento
- telefones
- e-mail
- endereço
- contatos de emergência
- situação no grupo
- data de entrada
- grupos/equipes
- histórico de participação
- observações com controle de acesso
- campos personalizados

## 4. Menores e responsáveis

- vínculo com pai, mãe ou responsável
- contatos de emergência
- pessoas autorizadas para retirada
- autorizações por evento
- consentimento de uso de imagem
- documentos e termos
- restrições e informações necessárias ao evento

## 5. Presença e check-in

- chamada manual
- busca rápida
- QR Code
- check-in/check-out
- visitante sem cadastro prévio
- presença por evento, grupo ou atividade
- horário de entrada e saída
- operação offline com sincronização posterior

## 6. Radar de relacionamento

Regras configuráveis para sinalizar redução de participação:

- verde: participação regular
- amarelo: atenção
- vermelho: acompanhamento

Exemplos configuráveis:

- X dias sem participação
- X faltas consecutivas
- novo visitante sem contato
- participante sem grupo/equipe
- tarefa de acompanhamento vencida

O indicador não substitui avaliação humana; serve como ferramenta de apoio à liderança.

## 7. Jornada do jovem

Fluxo configurável, por exemplo:

Visitante → Participante → Integrado → Equipe → Formação → Liderança

Cada organização poderá renomear e reorganizar as etapas.

## 8. Grupos e equipes

- grupos, ministérios, equipes e comissões
- líder e vice-líder
- membros
- limite de participantes
- grupo público ou privado
- histórico de participação

## 9. Eventos

- evento único ou recorrente
- data, horário e local
- capacidade
- responsáveis
- programação
- inscrições
- lista de espera
- confirmação/cancelamento
- QR Code
- formulários personalizados

## 10. Retiros e viagens

- participantes
- transporte
- veículos/ônibus
- quartos/alojamentos
- equipes de serviço
- alimentação e restrições relevantes
- responsáveis
- autorizações
- documentos
- check-in/check-out

## 11. Escalas e voluntariado

- funções configuráveis
- disponibilidade
- escala por evento
- aceitar/recusar
- substituição
- conflitos de agenda
- lembretes
- histórico de serviço

## 12. Comunicação

- comunicados gerais e segmentados
- e-mail
- notificações push
- preparação para integração oficial com WhatsApp
- mensagens por grupo/equipe/evento
- agendamento
- histórico

## 13. Acompanhamento

- tarefas de acompanhamento
- responsável pela ação
- linha do tempo
- data prevista
- status
- observações restritas

Dados sensíveis devem possuir acesso especialmente restrito.

## 14. Formação

- trilhas
- encontros formativos
- materiais
- presença
- progresso
- certificados quando aplicável

## 15. Pedidos de oração/intenção

- público, privado ou restrito
- acompanhamento
- status
- histórico

## 16. Documentos

- termos
- autorizações
- consentimentos
- certificados
- anexos
- controle de validade
- assinatura/aceite digital quando implementado

## 17. Financeiro de atividades

Escopo operacional, sem pretensão de substituir contabilidade formal:

- receitas por evento
- inscrições
- despesas
- formas de pagamento
- PIX
- pendências
- prestação de contas
- relatórios

## 18. Patrimônio

- equipamentos
- instrumentos
- materiais
- camisetas/crachás
- retirada
- responsável
- devolução
- estado do item

## 19. Galeria e mídia

- álbuns por evento
- fotos e vídeos
- controle de publicação conforme consentimentos

## 20. Relatórios

- frequência por período
- frequência individual
- crescimento
- retenção
- visitantes
- afastamentos
- participação em eventos
- aniversariantes
- voluntariado
- financeiro
- exportação

## 21. Segurança e auditoria

- autenticação segura
- opção de 2FA
- logs administrativos
- trilha de alterações
- controle de acesso por função
- proteção de dados pessoais
- políticas de retenção
- exportação/anonimização quando juridicamente cabível

## 22. Requisitos não funcionais

- responsivo
- PWA
- boa experiência em celular
- acessibilidade
- baixo consumo de dados
- backup automatizado
- preparação para escalabilidade
- API estruturada para integrações futuras
