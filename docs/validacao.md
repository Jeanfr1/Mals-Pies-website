# Validação da entrega

## Concluído

- Seleção do modelo 2 comparada à imagem escolhida pelo cliente.
- Cinco cenas, na ordem aprovada, e uma única cena principal de fundo sólido.
- Site público em inglês australiano; documentação em português.
- Sintaxe dos dois arquivos JavaScript verificada por Node.js.
- IDs, âncoras locais, referências ARIA e arquivos vinculados conferidos.
- Menu com quatro categorias, 18 opções de pies e oito opções salgadas transcritas da vitrine; não há preços inventados.
- PNGs, WebPs e JPEGs decodificados; SVGs inline e JSONs analisados.
- Logo RGBA de 1254 x 1254 px; alpha de 0 a 255; 62,976% dos pixels totalmente transparentes; nenhum pixel preto visível no fundo. As cópias em brand/ e site/assets/ são idênticas.
- As oito capturas da empresa incluídas preservam os bytes dos anexos; as três usadas no site são os PNGs originais em site/assets/.
- Fontes locais e licenças presentes.
- Filme verificado com ffprobe: 1920 x 1080, 24 fps, 10 s, sem áudio. Os seis frames do storyboard foram revisados visualmente.
- Os hashes do pacote são registrados em MANIFEST.sha256. O ZIP tem teste de integridade CRC na preparação final.

## Não verificado em navegador

O comando de prévia e seu diagnóstico retornaram `sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests: No such file or directory (os error 2)`.

Por isso, não foi possível inspecionar o site num navegador real, executar os fluxos por clique/teclado ou medir desempenho neste ambiente. A inspeção do filme não substitui esse teste. A lista de revisão está no roteiro 01. Não foi criada uma captura falsa do site para contornar essa limitação.

## Não incluído no escopo

Publicação, domínio, backend, checkout, envio de mensagens e reserva de caminhão. Os contatos são links para o próprio visitante falar com a empresa.
