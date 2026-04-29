# Graham & Bazin Valuation Toolkit

Calculadora de valuation baseada nas fórmulas de Benjamin Graham e Décio Bazin para análise de ações.

## Funcionalidades

- **Fórmula de Graham:** Cálculo do valor intrínseco baseado em LPA (Lucro Por Ação) e VPA (Valor Patrimonial por Ação).
- **Graham Revisado:** Variante que considera a taxa de crescimento anual esperada (g).
- **Método Bazin:** Cálculo do preço teto baseado em dividendos anuais (LTM) e yield esperado.
- **Auto-preenchimento:** Integração com IA (Gemini) para buscar dados de tickers (simulação dependente de chave de API).
- **Histórico:** Salve suas análises localmente.
- **Exportação:** Gere relatórios em texto ou compartilhe suas análises.

## Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone <url-do-repositorio>
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` baseado no `.env.example` e adicione sua `GEMINI_API_KEY`.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Tecnologias Utilizadas

- React 19
- TypeScript
- Tailwind CSS
- Lucide React (Ícones)
- Framer Motion (Animações)
- Gemini API (IA)

## Disclaimer

Este toolkit é apenas para fins educacionais e informativos. Não constitui recomendação de compra ou venda de ativos. Investir em ações envolve riscos.
