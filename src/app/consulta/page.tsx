import { redirect } from "next/navigation";

// A consulta de OS dos clientes agora fica no site (com a cópia das OS na nuvem, ver consulta-relay).
export default function ConsultaPage() {
  redirect("https://tanakaotica.com.br/consulta-os");
}
