# Movimento - The First Bite

## Ideia e execução entregue

A câmera sai de um detalhe da massa, revela a pie em uma mão e as três palavras do hero. Ao rolar, aproxima-se da pie novamente e passa para a segunda fotografia. A textura é o elo entre as cenas.

É movimento de câmera em camadas 2.5D, implementado com fotografias e transformações. O recorte da pie/mão se move como uma única camada. Não há animação independente dos dedos, vapor sintético, ingredientes explodidos ou deformação da comida. O papel não é uma simulação 3D.

## Abertura no site

| Tempo | Ação |
| --- | --- |
| 0-0,35 s | O macro fotográfico preenche a área do hero. Navegação e controle permanecem disponíveis |
| 0,35-1,25 s | O macro se afasta e sai pela direita; produto em primeiro plano entra com deslocamento curto e rotação de 2 graus |
| 0,55-1,75 s | As três linhas do título se assentam com 80 ms de intervalo, sem mudar o conteúdo |
| 1,8 s | Estado aprovado: texto à esquerda, produto à direita, papel ao fundo |
| 2,05 s | A classe de entrada é removida. A página já pode estar sendo rolada desde o início |

Rolar interrompe a entrada. Não há tela de carregamento que impeça navegação. Replay intro repete somente perto do topo; não muda o scroll do visitante para forçar a cena.

## Scroll do hero

No desktop, a área do hero tem 174 svh e o palco fixa por 100 svh; no celular, 148 svh, com altura mínima para legibilidade. O progresso usa a altura efetiva do palco, não um número fixo de pixels.

| Progresso | Comportamento |
| --- | --- |
| 0-38% | Produto com aproximação discreta; câmera responde ao mouse no desktop em até 9 px |
| 38-82% | Texto e indicações saem gradualmente; produto continua aproximando |
| 72-100% | Uma janela circular cresce perto do recheio com dissolve para a imagem de detalhe |
| 100% | O macro do destino ocupa o palco; a segunda seção assume a narrativa com seu título |

A camada da pie cresce no máximo 23%, desloca até 28 px e gira até -1,4 grau. O macro de chegada usa o mesmo arquivo da segunda seção. O efeito é um raccord fotográfico; não deve ser descrito como uma câmera 3D atravessando a comida.

## Demais conexões

As fotos têm deslocamento sutil, menor no celular. O menu conserva sua inclinação; o movimento de chegada é curto e não dificulta ler os nomes. A foto original de custard leva ao fechamento documental com a fachada e o caminhão. Essas fotos não são deformadas, substituídas por cenários fictícios ou animadas como pessoas.

## Acessibilidade e custo

- A animação não depende de um vídeo pesado. O MP4 do kit é uma prévia de apresentação, fora da navegação pública.
- O botão Pause motion, movimento reduzido do sistema e economia de dados desligam os movimentos e mostram o conteúdo estático.
- A abertura espera a fonte e a imagem do produto; se a página já estiver rolada, não repete.
- O loop de atualização só é solicitado em eventos de rolagem/redimensionamento. O site não faz renderização contínua de frames quando parado.
- Nenhum áudio inicia automaticamente.

## Filme demonstrativo incluído

`animation/hero-movement-HD.mp4`: 1920 x 1080, 24 fps, sem áudio. O roteiro do filme é macro -> hero completo -> macro com THE INSIDE STORY. Ele usa as imagens do pacote e câmera 2.5D. A montagem em segundos não é uma gravação de navegador nem um teste do comportamento do site.

Para reproduzir: `python3 animation/render_hero.py`. O código e a timeline acompanham a entrega. As fontes TTF ficam ao lado do script; é necessário FFmpeg com drawtext, zoompan e xfade.
