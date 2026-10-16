// Validação e máscara de CNPJ e telefone do cadastro de cliente.
// A mesma regra roda no banco (cnpj_valido / criar_conta_cliente) — aqui é só
// pra avisar o cliente antes de enviar. Quem manda é o banco.

/** Só os caracteres que contam, em maiúsculo. O CNPJ novo da Receita (jul/2026) tem letras. */
export function limparCnpj(v: string) {
  return (v || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
}

/** Dígitos verificadores. Cada caractere vale (código ASCII − 48): 0–9 = 0–9, A = 17... */
export function cnpjValido(v: string) {
  const d = limparCnpj(v);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(d)) return false;
  if (d === d[0].repeat(14)) return false;
  const dv = (base: string, pesos: number[]) => {
    const s = pesos.reduce((acc, p, i) => acc + (base.charCodeAt(i) - 48) * p, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = dv(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(d[12]) && d2 === Number(d[13]);
}

/** 12345678000190 → 12.345.678/0001-90 (vai formatando enquanto digita). */
export function mascaraCnpj(v: string) {
  const d = limparCnpj(v);
  const [a, b, c, e, f] = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 8), d.slice(8, 12), d.slice(12, 14)];
  return a + (b && "." + b) + (c && "." + c) + (e && "/" + e) + (f && "-" + f);
}

/** Telefone só com dígitos, sem o 55 do Brasil. */
export function limparTelefone(v: string) {
  let d = (v || "").replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

export function telefoneValido(v: string) {
  const d = limparTelefone(v);
  return d.length === 10 || d.length === 11;
}

/** 55999998888 → (55) 99999-8888 */
export function mascaraTelefone(v: string) {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Mesma lista que o banco aceita em criar_conta_cliente. */
export const CARGOS = ["Sócio(a)", "Proprietário(a)", "Gerente", "Comprador(a)", "Funcionário(a)", "Outro"] as const;
