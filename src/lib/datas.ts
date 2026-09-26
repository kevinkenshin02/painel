/**
 * Datas de calendário (dataVenda, dataEntrada, prazoPrometido...) vêm de <input type="date">
 * e são guardadas como meia-noite UTC do dia escolhido. Para comparar com "hoje" é preciso usar
 * a mesma convenção — meia-noite UTC do dia de hoje em São Paulo — senão uma venda de hoje
 * fica antes de "hoje" e uma OS com prazo hoje aparece como atrasada.
 */
const FUSO = "America/Sao_Paulo";

function partesDeHoje() {
  const [ano, mes, dia] = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return { ano, mes: mes - 1, dia };
}

/** Hoje (em São Paulo) no formato das datas de calendário. */
export function hojeCalendario() {
  const { ano, mes, dia } = partesDeHoje();
  return new Date(Date.UTC(ano, mes, dia));
}

/** Primeiro dia do mês atual e do próximo, no formato das datas de calendário. */
export function mesAtualCalendario() {
  const { ano, mes } = partesDeHoje();
  return {
    inicio: new Date(Date.UTC(ano, mes, 1)),
    fim: new Date(Date.UTC(ano, mes + 1, 1)),
    dias: new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate(),
    nome: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
      new Date(Date.UTC(ano, mes, 1))
    ),
  };
}

/** Valor para <input type="date"> com o dia de hoje em São Paulo (toISOString pula para amanhã depois das 21h). */
export function hojeInput() {
  return hojeCalendario().toISOString().slice(0, 10);
}
