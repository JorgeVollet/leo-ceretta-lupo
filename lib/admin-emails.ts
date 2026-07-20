/**
 * E-mails que também podem acessar o catálogo de compra usando o MESMO login
 * do painel admin (sem precisar ser um cliente cadastrado).
 *
 * Padrão: o e-mail do Leonardo. Pra trocar/adicionar (sem mexer no código),
 * defina a env NEXT_PUBLIC_ADMIN_EMAILS = "a@x.com, b@y.com".
 */
export const ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "leonardocerettasilveira@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function ehAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
