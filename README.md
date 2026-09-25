# Ponte · Inteligência operacional para inclusão social

**Ponte** é um protótipo interativo de analytics para ajudar equipes de atendimento social a enxergar gargalos na jornada, acompanhar a qualidade dos registros e escolher onde investigar primeiro.

> Projeto de portfólio criado por João Luis Feitosa Leite. Todos os dados deste protótipo são sintéticos e determinísticos. Não representam Uruburetama, qualquer outro município ou pessoas reais.

## Demonstração

**[Abrir o dashboard ao vivo](https://joao-luisz.github.io/ponte-inclusao-social/)** · **[Ver o código no GitHub](https://github.com/joao-luisz/ponte-inclusao-social)**

O projeto não exige instalação, banco de dados, conta ou serviço externo. O gráfico e os indicadores são calculados localmente a partir dos registros demonstrativos em `app.js`.

## O problema

Uma planilha pode guardar centenas de atendimentos e ainda deixar a equipe sem respostas rápidas para perguntas operacionais:

- Em qual etapa o acompanhamento está acumulando pendências?
- A documentação está completa antes do próximo encaminhamento?
- Onde a cobertura difere entre regiões e quais hipóteses precisam ser verificadas?
- Que verificações simples podem melhorar a confiança na base?

Ponte organiza essas perguntas em um painel único. O objetivo é reduzir o tempo entre localizar um sinal, validar sua causa com a equipe e definir uma ação responsável.

## Como usar o painel

1. Filtre por período e região para comparar os recortes.
2. Leia a jornada mensal e compare famílias acompanhadas, registros completos e encaminhamentos.
3. Use cobertura regional e demanda por serviço como sinais para investigação.
4. Confira completude, duplicidade e tempo de retorno na seção de qualidade.
5. Revise a fila agregada de atenção e exporte o recorte em CSV.

Os indicadores da fila são **grupos agregados para demonstração**. O painel não classifica indivíduos nem decide elegibilidade a benefícios.

## Decisões de produto e análise

- **Ação antes de volume:** cada gráfico vem acompanhado de uma pergunta ou próximo passo investigável.
- **Contexto antes de comparação:** diferenças regionais aparecem como sinais, não como nota de desempenho. Cobertura baixa pode ter várias causas e requer conversa com a equipe local.
- **Privacidade por padrão:** não existem nomes, CPFs, endereços ou registros individuais. Os dados demonstrativos são agregados por mês, região e tipo de serviço.
- **Sem decisões automatizadas:** sugestões apoiam profissionais e não substituem análise humana.
- **Exportação simples:** CSV permite conferir e reutilizar o recorte sem depender do painel.

## Dados e limitações

O conjunto é sintético e gerado em `app.js` com uma regra determinística. Cada combinação de mês e região guarda contagens de acompanhamento, completude e pendências; cada tipo de serviço acrescenta volumes de solicitações em acompanhamento e aguardando retorno. Os números variam de forma controlada para permitir filtros, comparações e testes visuais reproduzíveis.

Este protótipo **não deve ser usado para gestão real**, não é uma avaliação de política pública e não contém estimativas oficiais. Os dados não foram extraídos do CadÚnico nem de sistemas governamentais. Para uso real, seriam necessários autorização institucional, definição de finalidade, validação por profissionais, documentação da origem, controle de acesso, minimização de dados, avaliação de risco e revisão jurídica e de privacidade.

## Tecnologias

- HTML semântico e acessível
- CSS responsivo, sem framework
- JavaScript puro para filtros, agregações, gráficos SVG e exportação CSV
- Dados locais sintéticos; sem dependências ou chamadas de API

## Rodar localmente

Como é uma página estática, basta abrir `index.html`. Para servir por HTTP:

```bash
python3 -m http.server 8000
```

Depois, acesse `http://localhost:8000` e abra a pasta do projeto.

## Estrutura

```text
ponte-inclusao-social/
├── index.html    # interface e estrutura semântica
├── styles.css    # identidade visual e comportamento responsivo
├── app.js        # dados sintéticos e lógica analítica
└── README.md     # contexto, método e limitações
```

## Próximos passos para uma versão real

1. Validar as perguntas de gestão em entrevistas com equipes de atendimento.
2. Definir dicionário de dados, periodicidade e responsáveis pela atualização.
3. Adicionar testes de consistência e reconciliação com a fonte autorizada.
4. Construir uma camada de dados com acesso por perfil e trilha de auditoria.
5. Avaliar acessibilidade com usuários e testar em telas pequenas.
6. Revisar métricas e alertas com profissionais antes de colocá-los em produção.

## Sobre o autor

**João Luis Feitosa Leite** trabalha na interseção entre dados, operação e produto. Este case demonstra como transformar uma necessidade operacional em indicadores compreensíveis, escolhas de interface e próximos passos que preservam o julgamento humano.

**Competências demonstradas:** analytics de produto, definição de métricas, qualidade de dados, visualização, UX de dashboards, comunicação de insights e atenção à privacidade.
