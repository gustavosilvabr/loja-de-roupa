import { Hero } from '../components/Hero';
import { CountdownBar } from '../components/CountdownBar';
import { ProductCarousel } from '../components/ProductCarousel';
import {
  CollectionBanners,
  FeatureBannerGrid,
  PromoBanner,
  TeamSelector,
} from '../components/HomeBanners';
import { Faq } from '../components/Faq';
import { useSettings } from '../admin/store/AdminProvider';
import { useCatalog } from '../admin/store/useResolvedCatalog';
import { productsOf } from '../lib/catalog';
import { marcarSecao } from '../lib/modoEditor';
import type { HomeSection } from '../admin/types';

/** A ordem e o conteúdo das seções vêm do painel (Loja online → Seções da home). */
export default function Home() {
  const sections = useSettings().home;
  const { collectionByHandle, productByHandle } = useCatalog();

  const conteudo = (section: HomeSection) => {
    switch (section.type) {
      case 'hero':
        return <Hero />;

      case 'countdown':
        return <CountdownBar title={section.title} subtitle={section.subtitle} />;

      case 'carousel':
        return (
          <ProductCarousel
            title={section.title}
            subtitle={section.subtitle}
            products={productsOf(collectionByHandle.get(section.collection), productByHandle)}
            viewAllTo={section.viewAllTo || undefined}
          />
        );

      case 'promoBanner':
        return <PromoBanner />;

      case 'bannerGrid':
        return <FeatureBannerGrid />;

      case 'teams':
        return <TeamSelector title={section.title} />;

      case 'collectionBanners':
        return <CollectionBanners title={section.title} />;

      case 'faq':
        return <Faq title={section.title} />;

      default:
        return null;
    }
  };

  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((section) => (
          // O <div> é neutro no fluxo (bloco envolvendo bloco) e serve de
          // âncora para o editor destacar e rolar até a seção.
          <div key={section.id} {...marcarSecao(section.id)}>
            {conteudo(section)}
          </div>
        ))}
    </>
  );
}
