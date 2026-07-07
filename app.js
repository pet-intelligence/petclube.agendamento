const STORAGE_KEY = "petclub_agendamentos_v1";
const API_BASE_URL = (window.PETCLUB_API_URL || "").replace(/\/$/, "");

const servicos = [
  { nome: "Banho", valor: 80 },
  { nome: "Consulta veterinária", valor: 160 },
  { nome: "Tosa higiênica", valor: 70 },
  { nome: "Tosa completa", valor: 120 },
  { nome: "Corte de unhas", valor: 35 },
  { nome: "Hidratação", valor: 55 },
  { nome: "Escovação", valor: 45 },
  { nome: "Pacote completo", valor: 210 },
  { nome: "Outro", valor: 90 }
];

const statusFluxo = [
  "Agendamento recebido",
  "Pagamento confirmado",
  "Motorista a caminho",
  "Pet chegou ao Pet Club",
  "Serviço iniciado",
  "Banho concluído",
  "Consulta veterinária concluída",
  "Corte de unhas concluído",
  "Tosa concluída",
  "Serviço finalizado",
  "Pet pronto para retirada",
  "Pet saiu para entrega",
  "Atendimento concluído"
];

const statusBotoes = [
  { texto: "Pet chegou", status: "Pet chegou ao Pet Club" },
  { texto: "Iniciar serviço", status: "Serviço iniciado" },
  { texto: "Banho concluído", status: "Banho concluído" },
  { texto: "Consulta veterinária concluída", status: "Consulta veterinária concluída" },
  { texto: "Tosa concluída", status: "Tosa concluída" },
  { texto: "Corte de unhas concluído", status: "Corte de unhas concluído" },
  { texto: "Finalizar atendimento", status: "Serviço finalizado" },
  { texto: "Marcar como entregue", status: "Atendimento concluído" },
  { texto: "Marcar como cancelado", status: "Cancelado", extra: { cancelado: true } },
  { texto: "Marcar como no-show", status: "No-show", extra: { no_show: true } }
];

let agendamentos = [];
let backendOnline = false;
let etapaAtual = 0;
let servicoSelecionado = servicos[0];
let bookingSelecionado = "";

const form = document.querySelector("#booking-form");
const hojeISO = new Date().toISOString().slice(0, 10);

iniciar();

async function iniciar() {
  montarServicos();
  form.data_agendamento.value = hojeISO;
  form.hora_agendamento.value = "10:00";
  configurarNavegacao();
  configurarFormulario();
  configurarAdmin();
  await sincronizarAgendamentos();
  renderizarTudo();
}

async function sincronizarAgendamentos() {
  try {
    agendamentos = await apiRequest("/api/bookings");
    backendOnline = true;
    bookingSelecionado = agendamentos[0]?.booking_id || "";
    atualizarAvisoAPI();
  } catch (erro) {
    backendOnline = false;
    agendamentos = carregarAgendamentosLocais();
    bookingSelecionado = agendamentos[0]?.booking_id || "";
    atualizarAvisoAPI("Backend indisponível. O MVP continua funcionando em modo de teste com dados salvos neste navegador.");
  }
}

function atualizarAvisoAPI(mensagem = "") {
  const aviso = document.querySelector("#aviso-api");
  aviso.textContent = mensagem;
  aviso.classList.toggle("escondido", !mensagem);
}

async function apiRequest(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    headers: { "Content-Type": "application/json", ...(opcoes.headers || {}) },
    ...opcoes
  });
  if (!resposta.ok) throw new Error(`Erro na API: ${resposta.status}`);
  return resposta.json();
}

function carregarAgendamentosLocais() {
  const salvos = localStorage.getItem(STORAGE_KEY);
  if (salvos) return JSON.parse(salvos);

  const hoje = new Date().toISOString().slice(0, 10);
  const exemplos = [
    criarAgendamentoExemplo({
      nome_tutor: "Mariana Lima",
      whatsapp_tutor: "(11) 98888-1010",
      email_tutor: "mariana@email.com",
      cliente_recorrente: "Sim",
      nome_pet: "Jack",
      especie: "Cachorro",
      raca: "Golden Retriever",
      porte: "Grande",
      idade_pet: "5 anos",
      observacoes_pet: "Tem medo de secador forte.",
      servico_principal: "Pacote completo",
      servicos_adicionais: "Corte de unhas",
      valor_estimado: 245,
      valor_final: 245,
      forma_pagamento: "Pix",
      status_pagamento: "Confirmado",
      sinal_pago: true,
      precisa_transporte: true,
      tipo_transporte: "Sim, buscar e entregar",
      endereco: "Rua das Flores, 120",
      bairro: "Centro",
      ponto_referencia: "Ao lado da farmácia",
      status_atendimento: "Banho concluído",
      responsavel: "Paula",
      data_agendamento: hoje,
      hora_agendamento: "09:00",
      avaliacao_cliente: 5
    }),
    criarAgendamentoExemplo({
      nome_tutor: "Carlos Mendes",
      whatsapp_tutor: "(21) 97777-2020",
      email_tutor: "",
      cliente_recorrente: "Não",
      nome_pet: "Luna",
      especie: "Gato",
      raca: "SRD",
      porte: "Pequeno",
      idade_pet: "2 anos",
      observacoes_pet: "Usa medicação diária.",
      servico_principal: "Consulta veterinária",
      valor_estimado: 160,
      valor_final: 160,
      forma_pagamento: "Cartão",
      status_pagamento: "Pendente",
      precisa_transporte: false,
      tipo_transporte: "Não, vou levar até a loja",
      status_atendimento: "Agendamento recebido",
      responsavel: "Dra. Renata",
      data_agendamento: hoje,
      hora_agendamento: "11:30"
    }),
    criarAgendamentoExemplo({
      nome_tutor: "Beatriz Rocha",
      whatsapp_tutor: "(31) 96666-3030",
      email_tutor: "bia@email.com",
      cliente_recorrente: "Sim",
      nome_pet: "Thor",
      especie: "Cachorro",
      raca: "Spitz Alemão",
      porte: "Pequeno",
      idade_pet: "3 anos",
      observacoes_pet: "Alergia a shampoo perfumado.",
      servico_principal: "Tosa completa",
      valor_estimado: 120,
      valor_final: 120,
      forma_pagamento: "Pagar na loja",
      status_pagamento: "Pago na loja",
      precisa_transporte: true,
      tipo_transporte: "Sim, buscar meu pet",
      endereco: "Av. Brasil, 900",
      bairro: "Jardins",
      ponto_referencia: "Portaria azul",
      status_atendimento: "Serviço finalizado",
      responsavel: "Rafael",
      data_agendamento: hoje,
      hora_agendamento: "14:00",
      avaliacao_cliente: 4
    })
  ];
  salvarAgendamentosLocais(exemplos);
  return exemplos;
}

function criarAgendamentoExemplo(dados) {
  return {
    booking_id: gerarId(),
    data_criacao: new Date().toISOString(),
    data_agendamento: dados.data_agendamento,
    hora_agendamento: dados.hora_agendamento,
    canal_origem: "Link WhatsApp",
    nome_tutor: dados.nome_tutor,
    whatsapp_tutor: dados.whatsapp_tutor,
    email_tutor: dados.email_tutor || "",
    cliente_recorrente: dados.cliente_recorrente,
    nome_pet: dados.nome_pet,
    especie: dados.especie,
    raca: dados.raca,
    porte: dados.porte,
    idade_pet: dados.idade_pet,
    observacoes_pet: dados.observacoes_pet || "",
    servico_principal: dados.servico_principal,
    servicos_adicionais: dados.servicos_adicionais || "",
    valor_estimado: dados.valor_estimado,
    valor_final: dados.valor_final,
    forma_pagamento: dados.forma_pagamento,
    status_pagamento: dados.status_pagamento,
    sinal_pago: Boolean(dados.sinal_pago),
    precisa_transporte: Boolean(dados.precisa_transporte),
    tipo_transporte: dados.tipo_transporte,
    endereco: dados.endereco || "",
    complemento: dados.complemento || "",
    bairro: dados.bairro || "",
    ponto_referencia: dados.ponto_referencia || "",
    link_localizacao: dados.link_localizacao || "",
    melhor_horario_busca: dados.melhor_horario_busca || "",
    status_atendimento: dados.status_atendimento,
    responsavel: dados.responsavel || "Equipe Pet Club",
    cancelado: false,
    no_show: false,
    avaliacao_cliente: dados.avaliacao_cliente || "",
    observacoes_internas: dados.observacoes_internas || ""
  };
}

function salvarAgendamentosLocais(lista = agendamentos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function configurarNavegacao() {
  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", () => {
      document.querySelectorAll(".aba, .view").forEach((el) => el.classList.remove("ativa"));
      aba.classList.add("ativa");
      document.querySelector(`#view-${aba.dataset.view}`).classList.add("ativa");
      renderizarTudo();
    });
  });

  document.querySelectorAll(".passo").forEach((passo) => {
    passo.addEventListener("click", () => irParaEtapa(Number(passo.dataset.step)));
  });
}

function configurarFormulario() {
  document.querySelector("#tipo-transporte").addEventListener("change", atualizarCamposTransporte);
  document.querySelector("#btn-proximo").addEventListener("click", () => {
    if (!validarEtapa()) return;
    irParaEtapa(Math.min(etapaAtual + 1, 5));
  });
  document.querySelector("#btn-voltar").addEventListener("click", () => irParaEtapa(Math.max(etapaAtual - 1, 0)));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const novo = montarAgendamentoDoFormulario();

    try {
      const salvo = await apiRequest("/api/bookings", { method: "POST", body: JSON.stringify(novo) });
      agendamentos.unshift(salvo);
      backendOnline = true;
      atualizarAvisoAPI();
      bookingSelecionado = salvo.booking_id;
    } catch (erro) {
      backendOnline = false;
      agendamentos.unshift(novo);
      salvarAgendamentosLocais();
      bookingSelecionado = novo.booking_id;
      atualizarAvisoAPI("Backend indisponível. Agendamento salvo apenas neste navegador para teste.");
    }

    document.querySelector("#confirmacao-final").classList.remove("escondido");
    form.reset();
    form.data_agendamento.value = hojeISO;
    form.hora_agendamento.value = "10:00";
    servicoSelecionado = servicos[0];
    renderizarTudo();
    setTimeout(() => irParaEtapa(0), 900);
  });
}

function configurarAdmin() {
  document.querySelector("#status-booking-select").addEventListener("change", (event) => {
    bookingSelecionado = event.target.value;
    renderizarStatusCliente();
  });
  document.querySelector("#btn-export-bookings").addEventListener("click", () => exportarBookings());
  document.querySelector("#btn-export-metrics").addEventListener("click", () => exportarMetricas());
}

function montarServicos() {
  const container = document.querySelector("#service-options");
  container.innerHTML = servicos.map((servico, index) => `
    <button type="button" class="servico-card ${index === 0 ? "ativo" : ""}" data-servico="${servico.nome}">
      <strong>${servico.nome}</strong>
      <small>Estimativa: ${formatarMoeda(servico.valor)}</small>
    </button>
  `).join("");

  container.querySelectorAll(".servico-card").forEach((botao) => {
    botao.addEventListener("click", () => {
      servicoSelecionado = servicos.find((servico) => servico.nome === botao.dataset.servico);
      container.querySelectorAll(".servico-card").forEach((card) => card.classList.remove("ativo"));
      botao.classList.add("ativo");
      montarResumo();
    });
  });
}

function validarEtapa() {
  const campos = [...document.querySelector(`[data-step-panel="${etapaAtual}"]`).querySelectorAll("input, select, textarea")];
  return campos.every((campo) => campo.reportValidity());
}

function irParaEtapa(etapa) {
  etapaAtual = etapa;
  document.querySelectorAll(".passo, .form-step").forEach((el) => el.classList.remove("ativa"));
  document.querySelector(`.passo[data-step="${etapa}"]`).classList.add("ativa");
  document.querySelector(`[data-step-panel="${etapa}"]`).classList.add("ativa");
  document.querySelector("#btn-confirmar").classList.toggle("escondido", etapa !== 5);
  document.querySelector("#btn-proximo").classList.toggle("escondido", etapa === 5);
  document.querySelector("#btn-voltar").disabled = etapa === 0;
  document.querySelector("#confirmacao-final").classList.add("escondido");
  if (etapa === 5) montarResumo();
}

function atualizarCamposTransporte() {
  const precisa = form.tipo_transporte.value !== "Não, vou levar até a loja";
  document.querySelector("#campos-transporte").classList.toggle("escondido", !precisa);
}

function montarAgendamentoDoFormulario() {
  const dados = new FormData(form);
  const tipoTransporte = dados.get("tipo_transporte");
  const precisaTransporte = tipoTransporte !== "Não, vou levar até a loja";
  const valor = calcularValor(servicoSelecionado.nome, dados.get("servicos_adicionais"), precisaTransporte);

  return {
    booking_id: gerarId(),
    data_criacao: new Date().toISOString(),
    data_agendamento: dados.get("data_agendamento"),
    hora_agendamento: dados.get("hora_agendamento"),
    canal_origem: "Link WhatsApp",
    nome_tutor: dados.get("nome_tutor"),
    whatsapp_tutor: dados.get("whatsapp_tutor"),
    email_tutor: dados.get("email_tutor"),
    cliente_recorrente: dados.get("cliente_recorrente"),
    nome_pet: dados.get("nome_pet"),
    especie: dados.get("especie"),
    raca: dados.get("raca"),
    porte: dados.get("porte"),
    idade_pet: dados.get("idade_pet"),
    observacoes_pet: dados.get("observacoes_pet"),
    servico_principal: servicoSelecionado.nome,
    servicos_adicionais: dados.get("servicos_adicionais"),
    valor_estimado: valor,
    valor_final: valor,
    forma_pagamento: dados.get("forma_pagamento"),
    status_pagamento: dados.get("status_pagamento"),
    sinal_pago: dados.get("forma_pagamento") === "Sinal para reservar horário" && dados.get("status_pagamento") !== "Pendente",
    precisa_transporte: precisaTransporte,
    tipo_transporte: tipoTransporte,
    endereco: dados.get("endereco"),
    complemento: dados.get("complemento"),
    bairro: dados.get("bairro"),
    ponto_referencia: dados.get("ponto_referencia"),
    link_localizacao: dados.get("link_localizacao"),
    melhor_horario_busca: dados.get("melhor_horario_busca"),
    status_atendimento: dados.get("status_pagamento") === "Confirmado" ? "Pagamento confirmado" : "Agendamento recebido",
    responsavel: "Equipe Pet Club",
    cancelado: false,
    no_show: false,
    avaliacao_cliente: "",
    observacoes_internas: ""
  };
}

function montarResumo() {
  const dados = new FormData(form);
  const precisaTransporte = dados.get("tipo_transporte") !== "Não, vou levar até a loja";
  const valor = calcularValor(servicoSelecionado.nome, dados.get("servicos_adicionais"), precisaTransporte);
  const itens = [
    ["Tutor", dados.get("nome_tutor") || "Não informado"],
    ["Pet", dados.get("nome_pet") || "Não informado"],
    ["Serviço", servicoSelecionado.nome],
    ["Data", formatarData(dados.get("data_agendamento"))],
    ["Horário", dados.get("hora_agendamento") || "Não informado"],
    ["Leva e traz", dados.get("tipo_transporte") || "Não informado"],
    ["Valor estimado", formatarMoeda(valor)],
    ["Status do pagamento", dados.get("status_pagamento") || "Pendente"]
  ];
  document.querySelector("#resumo-agendamento").innerHTML = itens.map(([label, valorItem]) => `
    <div class="resumo-item"><span>${label}</span><strong>${valorItem}</strong></div>
  `).join("");
}

function calcularValor(servico, adicionais, transporte) {
  const base = servicos.find((item) => item.nome === servico)?.valor || 90;
  const extraAdicional = adicionais?.trim() ? 25 : 0;
  const extraTransporte = transporte ? 30 : 0;
  return base + extraAdicional + extraTransporte;
}

function renderizarTudo() {
  document.querySelector("#hero-total").textContent = agendamentos.length;
  renderizarStatusSelect();
  renderizarStatusCliente();
  renderizarAdmin();
}

function renderizarStatusSelect() {
  const select = document.querySelector("#status-booking-select");
  if (!agendamentos.some((item) => item.booking_id === bookingSelecionado)) {
    bookingSelecionado = agendamentos[0]?.booking_id || "";
  }
  select.innerHTML = agendamentos.map((item) => `
    <option value="${item.booking_id}" ${item.booking_id === bookingSelecionado ? "selected" : ""}>
      ${item.nome_pet} - ${item.nome_tutor}
    </option>
  `).join("");
}

function renderizarStatusCliente() {
  const item = buscarSelecionado();
  const container = document.querySelector("#status-cliente");
  const lista = document.querySelector("#linha-status");
  if (!item) {
    container.innerHTML = "<p>Nenhum agendamento encontrado.</p>";
    lista.innerHTML = "";
    return;
  }
  const indice = Math.max(statusFluxo.indexOf(item.status_atendimento), 0);
  const proxima = statusFluxo[indice + 1] || "Atendimento concluído";
  container.innerHTML = `
    <h2>${item.nome_pet} está na etapa: ${item.status_atendimento}.</h2>
    <p>Próxima etapa: ${proxima}.</p>
    <p><strong>Serviço:</strong> ${item.servico_principal} | <strong>Pagamento:</strong> ${item.status_pagamento}</p>
  `;
  lista.innerHTML = statusFluxo.map((status, index) => `
    <li class="${index < indice ? "concluido" : ""} ${index === indice ? "atual" : ""}">${status}</li>
  `).join("");
}

function renderizarAdmin() {
  renderizarCardsDia();
  renderizarAgenda();
  renderizarDetalhe();
  renderizarFinanceiro();
  renderizarOperacional();
}

function renderizarCardsDia() {
  const dia = agendamentos.filter((item) => item.data_agendamento === hojeISO);
  const cards = [
    ["Agendamentos confirmados", dia.filter((item) => !item.cancelado && !item.no_show).length],
    ["Pets em atendimento", dia.filter((item) => ["Pet chegou ao Pet Club", "Serviço iniciado", "Banho concluído", "Consulta veterinária concluída", "Corte de unhas concluído", "Tosa concluída"].includes(item.status_atendimento)).length],
    ["Serviços concluídos", dia.filter((item) => ["Serviço finalizado", "Pet pronto para retirada", "Pet saiu para entrega", "Atendimento concluído"].includes(item.status_atendimento)).length],
    ["Receita prevista", formatarMoeda(somar(dia, "valor_final"))],
    ["Pagamentos confirmados", dia.filter((item) => item.status_pagamento !== "Pendente").length],
    ["Pagamentos pendentes", dia.filter((item) => item.status_pagamento === "Pendente").length],
    ["Solicitações de leva e traz", dia.filter((item) => item.precisa_transporte).length]
  ];
  document.querySelector("#cards-dia").innerHTML = cards.map(([label, valor]) => `
    <div class="card"><span>${label}</span><strong>${valor}</strong></div>
  `).join("");
}

function renderizarAgenda() {
  const body = document.querySelector("#agenda-body");
  const dia = [...agendamentos].filter((item) => item.data_agendamento === hojeISO).sort((a, b) => a.hora_agendamento.localeCompare(b.hora_agendamento));
  body.innerHTML = dia.map((item) => `
    <tr class="${item.booking_id === bookingSelecionado ? "ativo" : ""}" data-id="${item.booking_id}">
      <td>${item.hora_agendamento}</td>
      <td><strong>${item.nome_pet}</strong><br><small>${item.especie}</small></td>
      <td>${item.nome_tutor}</td>
      <td>${item.servico_principal}</td>
      <td><span class="pill azul">${item.status_atendimento}</span></td>
      <td><span class="pill ${item.status_pagamento === "Pendente" ? "alerta" : ""}">${item.status_pagamento}</span></td>
      <td>${item.precisa_transporte ? item.tipo_transporte : "Sem transporte"}</td>
      <td>${item.responsavel}</td>
    </tr>
  `).join("");
  body.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      bookingSelecionado = row.dataset.id;
      renderizarTudo();
    });
  });
}

function renderizarDetalhe() {
  const item = buscarSelecionado();
  const detalhe = document.querySelector("#detalhe-atendimento");
  const botoes = document.querySelector("#botoes-status");
  if (!item) {
    detalhe.innerHTML = "<p>Nenhum agendamento selecionado.</p>";
    botoes.innerHTML = "";
    return;
  }
  const dados = [
    ["Nome do pet", item.nome_pet],
    ["Nome do tutor", item.nome_tutor],
    ["Serviço escolhido", item.servico_principal],
    ["Porte", item.porte],
    ["Observações importantes", item.observacoes_pet || "Sem observações"],
    ["Endereço", item.precisa_transporte ? `${item.endereco} ${item.complemento || ""} - ${item.bairro}` : "Sem leva e traz"],
    ["Status atual", item.status_atendimento],
    ["Status do pagamento", item.status_pagamento]
  ];
  detalhe.innerHTML = dados.map(([label, valor]) => `
    <div class="detalhe-item"><span>${label}</span><strong>${valor}</strong></div>
  `).join("");

  botoes.innerHTML = statusBotoes.map((acao) => `
    <button class="botao ${acao.extra ? "perigo" : "secundario"}" data-status="${acao.status}">${acao.texto}</button>
  `).join("");
  botoes.querySelectorAll("button").forEach((botao) => {
    botao.addEventListener("click", () => alterarStatus(botao.dataset.status));
  });
}

async function alterarStatus(status) {
  const itemAtual = buscarSelecionado();
  if (!itemAtual) return;

  const acao = statusBotoes.find((botao) => botao.status === status);
  const atualizacao = {
    status_atendimento: status,
    status_pagamento: status === "Pagamento confirmado" ? "Confirmado" : itemAtual.status_pagamento,
    ...(acao?.extra || {})
  };

  try {
    const atualizado = await apiRequest(`/api/bookings/${bookingSelecionado}`, { method: "PATCH", body: JSON.stringify(atualizacao) });
    agendamentos = agendamentos.map((item) => item.booking_id === bookingSelecionado ? atualizado : item);
    backendOnline = true;
    atualizarAvisoAPI();
  } catch (erro) {
    backendOnline = false;
    agendamentos = agendamentos.map((item) => item.booking_id === bookingSelecionado ? { ...item, ...atualizacao } : item);
    salvarAgendamentosLocais();
    atualizarAvisoAPI("Backend indisponível. Status atualizado apenas neste navegador para teste.");
  }

  renderizarTudo();
}

function renderizarFinanceiro() {
  const receitaDia = somar(agendamentos.filter((item) => item.data_agendamento === hojeISO), "valor_final");
  const receitaSemana = somar(agendamentos, "valor_final");
  const ticketMedio = agendamentos.length ? receitaSemana / agendamentos.length : 0;
  const porServico = agruparSoma(agendamentos, "servico_principal", "valor_final");
  const itens = [
    ["Receita do dia", formatarMoeda(receitaDia)],
    ["Receita da semana", formatarMoeda(receitaSemana)],
    ["Receita por tipo de serviço", Object.entries(porServico).map(([k, v]) => `${k}: ${formatarMoeda(v)}`).join(" | ")],
    ["Ticket médio", formatarMoeda(ticketMedio)],
    ["Pagamentos via Pix", contarPor("forma_pagamento", "Pix")],
    ["Pagamentos via cartão", contarPor("forma_pagamento", "Cartão")],
    ["Pagamentos na loja", contarPor("forma_pagamento", "Pagar na loja")],
    ["Pagamentos pendentes", contarPor("status_pagamento", "Pendente")]
  ];
  document.querySelector("#painel-financeiro").innerHTML = itens.map(([label, valor]) => `
    <div class="metrica"><span>${label}</span><strong>${valor}</strong></div>
  `).join("");
}

function renderizarOperacional() {
  const itens = [
    ["Serviços mais pedidos", ranking("servico_principal")],
    ["Horários mais ocupados", ranking("hora_agendamento")],
    ["Bairros com mais leva e traz", ranking("bairro", agendamentos.filter((item) => item.precisa_transporte))],
    ["Clientes novos", contarPor("cliente_recorrente", "Não")],
    ["Clientes recorrentes", contarPor("cliente_recorrente", "Sim")],
    ["Cancelamentos", agendamentos.filter((item) => item.cancelado).length],
    ["No-shows", agendamentos.filter((item) => item.no_show).length]
  ];
  document.querySelector("#painel-operacional").innerHTML = itens.map(([label, valor]) => `
    <div class="metrica"><span>${label}</span><strong>${valor || "Sem dados"}</strong></div>
  `).join("");
}

function gerarMetricasDiarias() {
  const datas = [...new Set(agendamentos.map((item) => item.data_agendamento))].sort();
  return datas.map((data) => {
    const dia = agendamentos.filter((item) => item.data_agendamento === data);
    const receitaTotal = somar(dia, "valor_final");
    const pagamentosOnline = dia.filter((item) => ["Pix", "Cartão", "Sinal para reservar horário"].includes(item.forma_pagamento) && item.status_pagamento !== "Pendente").length;
    return {
      data,
      total_agendamentos: dia.length,
      agendamentos_online: dia.filter((item) => item.canal_origem === "Link WhatsApp").length,
      agendamentos_confirmados: dia.filter((item) => !item.cancelado && !item.no_show).length,
      agendamentos_cancelados: dia.filter((item) => item.cancelado).length,
      no_shows: dia.filter((item) => item.no_show).length,
      receita_banho: receitaPorTexto(dia, "Banho"),
      receita_tosa: receitaPorTexto(dia, "Tosa"),
      receita_consulta_veterinaria: receitaPorTexto(dia, "Consulta veterinária"),
      receita_unhas: receitaPorTexto(dia, "unhas"),
      receita_total: receitaTotal,
      ticket_medio: dia.length ? Number((receitaTotal / dia.length).toFixed(2)) : 0,
      clientes_novos: dia.filter((item) => item.cliente_recorrente === "Não").length,
      clientes_recorrentes: dia.filter((item) => item.cliente_recorrente === "Sim").length,
      pagamentos_online: pagamentosOnline,
      percentual_pagamento_online: dia.length ? Number(((pagamentosOnline / dia.length) * 100).toFixed(1)) : 0,
      pedidos_leva_traz: dia.filter((item) => item.precisa_transporte).length,
      tempo_medio_atendimento: 75,
      avaliacao_media_cliente: media(dia.map((item) => Number(item.avaliacao_cliente)).filter(Boolean))
    };
  });
}

function exportarBookings() {
  if (backendOnline) {
    window.location.href = `${API_BASE_URL}/api/export/bookings.csv`;
    return;
  }
  exportarCSV("petclub_agendamentos.csv", agendamentos);
}

function exportarMetricas() {
  if (backendOnline) {
    window.location.href = `${API_BASE_URL}/api/export/daily-metrics.csv`;
    return;
  }
  exportarCSV("petclub_metricas_diarias.csv", gerarMetricasDiarias());
}

function exportarCSV(nomeArquivo, linhas) {
  if (!linhas.length) return;
  const colunas = Object.keys(linhas[0]);
  const csv = [
    colunas.join(","),
    ...linhas.map((linha) => colunas.map((coluna) => escaparCSV(linha[coluna])).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

function escaparCSV(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replaceAll('"', '""')}"`;
}

function buscarSelecionado() {
  return agendamentos.find((item) => item.booking_id === bookingSelecionado);
}

function gerarId() {
  return `PC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data) {
  if (!data) return "Não informada";
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function somar(lista, campo) {
  return lista.reduce((total, item) => total + Number(item[campo] || 0), 0);
}

function contarPor(campo, valor) {
  return agendamentos.filter((item) => item[campo] === valor).length;
}

function agruparSoma(lista, chave, valor) {
  return lista.reduce((acc, item) => {
    acc[item[chave]] = (acc[item[chave]] || 0) + Number(item[valor] || 0);
    return acc;
  }, {});
}

function ranking(campo, lista = agendamentos) {
  const contagem = lista.reduce((acc, item) => {
    const chave = item[campo] || "Não informado";
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([nome, total]) => `${nome} (${total})`)
    .join(" | ");
}

function receitaPorTexto(lista, texto) {
  return somar(lista.filter((item) => `${item.servico_principal} ${item.servicos_adicionais}`.toLowerCase().includes(texto.toLowerCase())), "valor_final");
}

function media(valores) {
  if (!valores.length) return 0;
  return Number((valores.reduce((total, valor) => total + valor, 0) / valores.length).toFixed(2));
}
