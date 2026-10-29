# Mal's Pies & Pastries - kit completo

## Direção aprovada

Modelo 2, **The First Bite**, identificado pela imagem que você escolheu: **HOT. FLAKY. LOCAL.** Hero com uma pie aberta em uma mão, detalhe da massa na segunda seção, menu vermelho em diagonal, doces e fechamento com as fotos da fachada e do Smoko Truck.

O ZIP reúne o site editável, as imagens, a logo PNG transparente, fontes locais com licenças, roteiro de animação, conteúdo, referências e verificação. O site público está em inglês australiano. As instruções do kit estão em português.

## Abrir

1. Extraia o ZIP inteiro.
2. Abra `site/index.html` no navegador. Não é necessário instalar dependências, ter conta, usar um servidor ou conectar uma API.
3. Para ver a direção visual e os movimentos, abra `docs/GUIA-VISUAL.html`.
4. O filme `animation/hero-movement-HD.mp4` é uma prévia independente de câmera e transições. A animação do site está implementada em CSS e JavaScript, sem depender desse vídeo.

Não abra o HTML sem extrair as pastas do ZIP. As imagens e fontes precisam continuar nos caminhos relativos.

## Pastas

| Pasta | Conteúdo |
| --- | --- |
| `site/` | HTML, CSS, JavaScript e assets prontos para hospedagem estática |
| `brand/` | Logo em PNG RGBA com fundo transparente |
| `images/master/` | Três imagens de campanha originais: papel, pie/mão em recorte e detalhe da massa |
| `images/originals/` | Demais capturas fornecidas, intactas; as três fotos usadas no site ficam em `site/assets/` também com os bytes originais |
| `references/` | Conceito do cliente, modelo 2 e imagem da escolha |
| `roteiros/` | Implementação, sequência de movimento e uso de imagens/logo |
| `animation/` | Filme demonstrativo, timeline, fontes TTF e código para reproduzir o filme |
| `docs/` | Guia visual, textos, fontes da informação, origem dos assets, aprovação e QA |
| `tools/` | Verificações e mapa de arquivos |

## O que foi mantido

- As cinco cenas e a ordem do modelo escolhido.
- Vermelho `#D81920`, preto `#151311`, branco quente `#FFF7ED`.
- A única seção principal com fundo sólido é o menu vermelho.
- O hero usa papel fotografado e uma pie/mão em primeiro plano. Os textos, a navegação e as indicações são elementos HTML editáveis.
- O detalhe da massa é uma fotografia de campanha. A seção de doces usa a foto original dos doces de custard. O fechamento usa as fotos originais da fachada e do Smoko Truck.
- A logo é a recriação do selo vermelho existente, com cupcake e as inscrições da marca. Não foi substituída por outra identidade.

## Comportamento implementado

Abertura de 1,8 s, aproximação do primeiro plano ao rolar, passagem circular com dissolve para o detalhe da pie e movimento discreto nas fotos seguintes. O menu em diagonal abre as categorias; os detalhes têm controles de teclado, fechamento por Escape e retorno de foco. A consulta ao Smoko Truck abre um contato por telefone. Endereço, telefone, Instagram, Facebook e direções têm links reais.

O controle **Pause motion** desliga o movimento e guarda apenas essa preferência no dispositivo. A preferência de movimento reduzido do sistema e economia de dados são respeitadas. O site funciona sem bibliotecas remotas, trackers ou cookies de análise. O filme de apresentação não é baixado na navegação do site.

## Limites da entrega e validação

- A animação é uma composição **2.5D de fotografias** com recorte, escala, deslocamento e transições. Não é filmagem da equipe, animação 3D da pie ou simulação física de massa.
- O site e o filme usam a mesma direção e os mesmos assets; a timeline do filme tem uma montagem própria para avaliação.
- As fotos fornecidas não foram retocadas. O enquadramento no site usa CSS e viewports SVG para afastar a interface das capturas, sem mudar os produtos, a fachada ou o caminhão.
- As imagens de pie e papel são de campanha geradas com ImageGen. Não são fotos documentais dos produtos vendidos naquele dia. Isso está registrado no mapa de origem.
- Não há checkout, backend, envio automático, reservas ou confirmação de disponibilidade. O contato é feito diretamente com a padaria.
- Não foram publicados horários, preços, notas ou posições em premiações sem confirmação suficiente.
- Os testes de estrutura, arquivos, JavaScript, transparência e filme estão em `docs/qa-results.json`. **A inspeção interativa em navegador ficou pendente**, porque o serviço de prévia deste ambiente não estava disponível. Não há alegação de teste de performance, responsividade ou interação em navegador real.
- O pacote é local; nenhum domínio foi registrado e o site não foi publicado.

## Alterar ou publicar

Textos principais e links: `site/index.html`. Lista de produtos: `site/content.js`. Cores, espaçamento e enquadramentos: `site/styles.css`. Movimento e diálogos: `site/app.js`.

Para publicar, envie **o conteúdo de `site/`** para uma hospedagem estática. Diretório de saída: `site`; comando de build: nenhum. Antes da publicação, confira os enquadramentos no desktop e celular conforme `roteiros/01-implementacao.md`. Preserve os arquivos de licença junto às fontes.

Para verificação local opcional: Python 3 com Pillow e Node.js. Rode `python3 tools/check_kit.py`. Para recriar o filme, é necessário FFmpeg com `drawtext`: `python3 animation/render_hero.py`. Esses programas não são necessários para abrir o site.
