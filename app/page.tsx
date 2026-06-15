import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Shortcuts from "@/components/Shortcuts";
import CatalogosBrowser from "@/components/CatalogosBrowser";
import { getCatalogos } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalogos = await getCatalogos();
  return (
    <>
      <Header />
      <CatalogosBrowser catalogos={catalogos} />
      <Shortcuts />
      <Footer />
    </>
  );
}
