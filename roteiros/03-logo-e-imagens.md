# Logo e imagens

## Logo da marca

Arquivo de uso: `brand/Logo-Mals-Bakery-Transparente.png`. Cópia idêntica usada no site: `site/assets/logo.png`. Tamanho de origem 1254 x 1254 px, PNG RGBA. O fundo e os vazios do selo têm transparência. O arquivo não contém uma placa preta ou branca.

A logo recria o selo existente: cupcake central, anéis, banner MAL'S BAKERY e textos FRESH DAILY / BAKERY. É uma recriação raster para web; não é um vetor SVG nem um arquivo de marca original fornecido pela empresa.

No menu, a marca ampliada usa filtro CSS branco com baixa opacidade. O arquivo PNG continua o mesmo. A logo impressa na embalagem da pie é parte da fotografia de campanha e está sujeita à textura/perspectiva dessa imagem; a marca vetorial não foi prometida.

Preservar proporção quadrada, margem livre e desenho do selo. Não esticar, trocar por ícone genérico ou criar data de fundação. A tonalidade da marca no layout é definida pelo token CSS vermelho; o raster e a fotografia podem apresentar variações naturais.

## Arquivos fotográficos

| Asset no site | Origem | Tratamento |
| --- | --- | --- |
| `paper.webp` | ImageGen, imagem independente | Conversão web do PNG master |
| `hero-pie-hand.webp` | ImageGen, recorte com transparência | Conversão web do PNG master; movimento de uma única camada |
| `inside-pie.webp` | ImageGen, fotografia de campanha | Conversão web do PNG master |
| `doces-custard-original.png` | Captura fornecida 15.34.57 | Bytes originais; só enquadramento CSS |
| `smoko-truck-original.png` | Captura fornecida 15.35.11 | Bytes originais; viewport SVG no site |
| `fachada-original.png` | Captura fornecida 15.35.58 | Bytes originais; viewport SVG no site |

As demais capturas fornecidas estão em `images/originals/`. As três já presentes em `site/assets/` não foram duplicadas nessa pasta para manter o ZIP leve, mas são os arquivos originais, não versões comprimidas.

O site não apresenta as fotos de campanha como documentação da cozinha ou da equipe. Não acrescentar depoimentos, funcionários ou prémios fictícios. O review fornecido serve de contexto e fica no material original; seu preço e pontuação não entraram na página.

## Enquadramentos

O hero precisa manter visíveis o recheio, a mão e o selo da embalagem. As palavras são HTML. Não substituí-lo pelo screenshot inteiro da proposta, pois isso impediria editar textos, adaptar ao celular e animar camadas.

A seção SWEET usa os doces com custard do modelo 2. Não colocar as caramel tarts como fundo dominante dessa seção: essa imagem pertence às outras explorações, não à seleção aprovada.

As fotos da fachada e do caminhão entram como imagens reais dentro de viewports SVG. Isso afasta a interface das capturas sem fabricar um novo local. Se o proprietário fornecer arquivos fotográficos limpos depois, substituir os respectivos arquivos e recalibrar apenas seus enquadramentos.

## Arquivos de origem e prompts

Os três PNGs de campanha em `images/master/` são os arquivos de geração completos. Os prompts usados estão em `docs/prompts-imagens.json`. A geração usou ImageGen integrado; não depende de uma API para executar o site. O mapa de origem e hashes fica em `docs/asset-manifest.json`.
