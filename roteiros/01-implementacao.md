# Implementação - somente modelo 2

## Referência que governa o projeto

`references/escolha-do-cliente.png` é a seleção exata enviada pelo cliente. O nome interno é The First Bite. Nenhum hero ou seção dos modelos 1 e 3 deve entrar nesta entrega.

| Ordem | ID no HTML | Composição que deve permanecer |
| --- | --- | --- |
| 1 | `start` | Papel claro fotografado; logo central; palavras HOT / FLAKY / LOCAL à esquerda; pie aberta e mão à direita; duas indicações finas; ação Find your favourite |
| 2 | `the-good-stuff` | Detalhe fotográfico da pie e massa; THE INSIDE STORY em branco; legenda curta no canto inferior direito |
| 3 | `the-range` | Única cena de cor sólida, vermelha; categorias em diagonal crescente; selo grande cortado à direita |
| 4 | `sweet-treats` | Foto original dos doces com custard; SWEET em vermelho; Worth making room for em serifada branca |
| 5 | `find-us` | Fachada real à esquerda e Smoko Truck real à direita; contato e rodapé sobre as fotos |

## Instalação e edição

O projeto é HTML/CSS/JS sem build. O único diretório de publicação é `site/`; as outras pastas são material do kit. Não existe dependência de React, NPM, CDN, plataforma de geração ou conta externa para navegar.

Os quatro itens diagonais são botões: abrem o catálogo nativo com tabs. O catálogo descreve produtos, não monta um pedido. O usuário telefona para confirmar a seleção e disponibilidade. A consulta ao caminhão também encaminha para o telefone da padaria. Não converter esses controles em checkout fictício.

## Desktop

O cabeçalho tem a marca no centro, dois links à esquerda e dois à direita. O título é texto, condensado horizontalmente para respeitar a largura da referência. O produto atravessa parte da tipografia. No final, preservar aproximadamente 61/39 entre fachada e caminhão. O rodapé segue nas fotografias, sem criar uma sexta seção sólida.

## Mobile

O menu vira um disclosure nativo. O título aparece acima e parcialmente atrás do produto; as indicações reduzem de escala. As categorias mantêm a diagonal, com tipografia ajustada. O fechamento passa a fachada/caminhão empilhados para preservar legibilidade e fotografias. Essa adaptação não altera os conteúdos nem acrescenta blocos.

## Verificação em navegador antes de publicar

1. Conferir 1440 x 900, 1920 x 1080, 390 x 844 e 360 x 800.
2. Verificar que nenhuma palavra do título e nenhuma categoria perde informação no corte. As mãos e a embalagem podem ultrapassar a borda conforme o layout; o recheio da pie deve continuar visível.
3. Conferir os pontos HOT/FLAKY/LOCAL, pontuação e margens da marca.
4. Ler THE INSIDE STORY, as legendas, SWEET e o contato em todas as fotos. Ajustar somente scrim, contraste e enquadramento se necessário.
5. Confirmar que a fachada e o caminhão não mostram setas/nomes da interface da captura. As fotos originais continuam intactas.
6. Abrir cada categoria, alternar as tabs com setas/Home/End, fechar com Escape e conferir retorno de foco.
7. Verificar links do Maps, telefone, Instagram e Facebook. Não telefonar ou enviar mensagens durante a verificação.
8. Ativar movimento reduzido do sistema e Pause motion. Conferir que os textos continuam acessíveis sem animação.
9. Testar zoom de texto e 200% de zoom no navegador, ausência de overflow horizontal e uso só por teclado.
10. Verificar desempenho e tamanho das imagens na hospedagem escolhida. Esses resultados ainda não foram medidos neste ambiente.

O serviço de prévia gerenciado não estava disponível nesta execução. A indisponibilidade foi registrada, sem substituir por uma captura inventada ou apresentar o estudo gerado como screenshot do site.
