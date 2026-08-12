import { afterEach, describe, expect, it } from 'vitest';
import {
  PREFIXO,
  TAMANHO_MAXIMO_ENTRADA,
  ehLocal,
  formatarBytes,
  idDe,
  refDe,
  validarArquivo,
} from '../admin/store/imagens';
import { img, PREFIXO_LOCAL } from '../lib/format';
import { limparUrls, registrarUrl, urlDe, esquecerUrl } from '../lib/imagensLocais';

/** Cria um File sem depender de disco. */
function arquivoFalso(nome, tipo, bytes) {
  return new File([new Uint8Array(bytes)], nome, { type: tipo });
}

afterEach(() => {
  limparUrls();
});

describe('referências de imagem local', () => {
  it('o prefixo é o mesmo nos dois módulos', () => {
    expect(PREFIXO).toBe(PREFIXO_LOCAL);
  });

  it('reconhece o que é local e o que é URL da internet', () => {
    expect(ehLocal('local:img_abc')).toBe(true);
    expect(ehLocal('https://cdn.shopify.com/foto.png')).toBe(false);
  });

  it('converte id em referência e de volta', () => {
    expect(refDe('img_abc')).toBe('local:img_abc');
    expect(idDe('local:img_abc')).toBe('img_abc');
    expect(idDe(refDe('img_xyz'))).toBe('img_xyz');
  });
});

describe('validação do arquivo enviado', () => {
  it('aceita JPG, PNG e WebP', () => {
    expect(validarArquivo(arquivoFalso('foto.jpg', 'image/jpeg', 1000))).toBeNull();
    expect(validarArquivo(arquivoFalso('foto.png', 'image/png', 1000))).toBeNull();
    expect(validarArquivo(arquivoFalso('foto.webp', 'image/webp', 1000))).toBeNull();
  });

  it('recusa quem não é imagem', () => {
    const erro = validarArquivo(arquivoFalso('planilha.pdf', 'application/pdf', 1000));
    expect(erro).toMatch(/não é uma imagem/i);
  });

  it('recusa formato de imagem não suportado', () => {
    const erro = validarArquivo(arquivoFalso('antiga.bmp', 'image/bmp', 1000));
    expect(erro).toMatch(/não suportado/i);
  });

  it('recusa arquivo acima do limite e diz o tamanho', () => {
    const erro = validarArquivo(
      arquivoFalso('enorme.jpg', 'image/jpeg', TAMANHO_MAXIMO_ENTRADA + 1)
    );
    expect(erro).toMatch(/25 MB/);
  });
});

describe('resolução da imagem na hora de exibir', () => {
  it('devolve a URL de objeto quando a imagem local já carregou', () => {
    registrarUrl('local:img_1', 'blob:fake-url');
    expect(img('local:img_1', 300)).toBe('blob:fake-url');
  });

  it('devolve vazio enquanto a imagem local não carregou', () => {
    expect(img('local:ainda_nao_existe', 300)).toBe('');
  });

  it('não mexe em URL de fora e ainda redimensiona a do CDN', () => {
    expect(img('https://exemplo.com/foto.png', 300)).toBe('https://exemplo.com/foto.png');
    expect(img('https://cdn.shopify.com/x/foto.png', 300)).toContain('width=300');
  });

  it('esquecer a referência faz a imagem sumir do mapa', () => {
    registrarUrl('local:img_2', 'blob:outra');
    expect(urlDe('local:img_2')).toBe('blob:outra');
    esquecerUrl('local:img_2');
    expect(urlDe('local:img_2')).toBeUndefined();
    expect(img('local:img_2')).toBe('');
  });

  it('registrar de novo substitui a URL antiga', () => {
    registrarUrl('local:img_3', 'blob:v1');
    registrarUrl('local:img_3', 'blob:v2');
    expect(img('local:img_3')).toBe('blob:v2');
  });
});

describe('formatação de tamanho', () => {
  it('mostra a unidade adequada', () => {
    expect(formatarBytes(512)).toBe('512 B');
    expect(formatarBytes(2048)).toBe('2 KB');
    expect(formatarBytes(3 * 1024 * 1024)).toBe('3.0 MB');
  });
});
