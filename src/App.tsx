/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Info, 
  Trash2, 
  PlusCircle, 
  ArrowRight,
  TrendingDown,
  Scale,
  Share2,
  Check,
  Search,
  Loader2,
  FileText,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateGrahamPrice, calculateBazinPrice, formatCurrency, formatNumber, cn } from './lib/utils';
import { fetchStockData } from './services/geminiService';

interface Calculation {
  id: string;
  ticker: string;
  lpa: number;
  vpa: number;
  currentPrice: number;
  dividend: number;
  growth: number;
  grahamPrice: number;
  revisedGrahamPrice: number | null;
  bazinPrice: number | null;
  marginOfSafety: number;
  date: number;
}

export default function App() {
  const [ticker, setTicker] = useState('');
  const [lpa, setLpa] = useState<string>('');
  const [vpa, setVpa] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [dividend, setDividend] = useState<string>('');
  const [growth, setGrowth] = useState<string>('');
  const [targetYield, setTargetYield] = useState<string>('6');
  const [history, setHistory] = useState<Calculation[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const parsedLpa = parseFloat(lpa) || 0;
  const parsedVpa = parseFloat(vpa) || 0;
  const parsedCurrentPrice = parseFloat(currentPrice) || 0;
  const parsedDividend = parseFloat(dividend) || 0;
  const parsedGrowth = parseFloat(growth) || 0;
  const parsedTargetYield = (parseFloat(targetYield) || 6) / 100;

  const grahamPrice = useMemo(() => {
    return calculateGrahamPrice(parsedLpa, parsedVpa);
  }, [parsedLpa, parsedVpa]);

  const bazinPrice = useMemo(() => {
    return calculateBazinPrice(parsedDividend, parsedTargetYield);
  }, [parsedDividend, parsedTargetYield]);

  const revisedGrahamPrice = useMemo(() => {
    // Revised formula can result in negative values if LPA is negative
    const val = (parsedLpa * (8.5 + 2 * parsedGrowth) * 4.4) / 4.4;
    return val < 0 ? 0 : val;
  }, [parsedLpa, parsedGrowth]);

  const plRatio = useMemo(() => {
    if (parsedLpa === 0 || parsedCurrentPrice <= 0) return null;
    return parsedCurrentPrice / parsedLpa;
  }, [parsedLpa, parsedCurrentPrice]);

  const dyRatio = useMemo(() => {
    if (parsedCurrentPrice <= 0 || parsedDividend <= 0) return null;
    return (parsedDividend / parsedCurrentPrice) * 100;
  }, [parsedCurrentPrice, parsedDividend]);

  const marginOfSafety = useMemo(() => {
    if (grahamPrice === null || grahamPrice === 0 || parsedCurrentPrice <= 0) return null;
    return ((grahamPrice - parsedCurrentPrice) / grahamPrice) * 100;
  }, [grahamPrice, parsedCurrentPrice]);

  const handleAutoFill = async () => {
    if (!ticker) return;
    setIsLoading(true);
    const data = await fetchStockData(ticker);
    if (data) {
      setLpa(data.lpa.toString());
      setVpa(data.vpa.toString());
      setCurrentPrice(data.price.toString());
      setDividend(data.dividend.toString());
      setGrowth(data.growth.toString());
    }
    setIsLoading(false);
  };

  const handleSave = () => {
    if (grahamPrice === null || !ticker) return;

    const newCalc: Calculation = {
      id: Math.random().toString(36).substr(2, 9),
      ticker: ticker.toUpperCase(),
      lpa: parsedLpa,
      vpa: parsedVpa,
      currentPrice: parsedCurrentPrice,
      dividend: parsedDividend,
      growth: parsedGrowth,
      grahamPrice,
      revisedGrahamPrice,
      bazinPrice,
      marginOfSafety: marginOfSafety || 0,
      date: Date.now(),
    };

    setHistory([newCalc, ...history]);
  };

  const removeHistory = (id: string) => {
    setHistory(history.filter(item => item.id !== id));
  };

  const handleShare = async (item: Calculation) => {
    const pl = item.lpa > 0 ? formatNumber(item.currentPrice / item.lpa) : '---';
    const dy = item.currentPrice > 0 ? `${formatNumber((item.dividend / item.currentPrice) * 100)}%` : '---';
    const text = `🔍 Análise de $${item.ticker}\n💎 Preço Justo (Graham): ${formatCurrency(item.grahamPrice)}\n💰 Preço Justo (Bazin): ${item.bazinPrice ? formatCurrency(item.bazinPrice) : '---'}\n📈 Margem: ${formatNumber(item.marginOfSafety, 1)}%\n📊 P/L: ${pl} | DY: ${dy}\n\nCalculado no Graham Analysis Hub. #Investimentos`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Análise: ${item.ticker}`,
          text: text,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(text);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      // Fallback if share is cancelled or fails
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleExportText = () => {
    if (history.length === 0) return;

    let text = "GRAHAM ANALYSIS HUB - RELATÓRIO DE VALUATION\n";
    text += "==============================================\n\n";

    history.forEach((item, index) => {
      text += `${index + 1}. ATIVO: ${item.ticker}\n`;
      text += `   Data do Cálculo: ${new Date(item.date).toLocaleString('pt-BR')}\n`;
      text += `   LPA: ${formatNumber(item.lpa)} | VPA: ${formatNumber(item.vpa)}\n`;
      text += `   Preço Graham: ${formatCurrency(item.grahamPrice)}\n`;
      text += `   Preço Bazin: ${item.bazinPrice ? formatCurrency(item.bazinPrice) : '---'}\n`;
      text += `   Preço Graham (Rev): ${item.revisedGrahamPrice ? formatCurrency(item.revisedGrahamPrice) : 'N/A'}\n`;
      text += `   Cotação Atual: ${formatCurrency(item.currentPrice)}\n`;
      text += `   Margem de Segurança: ${formatNumber(item.marginOfSafety, 1)}%\n`;
      text += `   DY: ${item.currentPrice > 0 ? formatNumber((item.dividend / item.currentPrice) * 100) : '0'}%\n`;
      text += `   P/L: ${item.lpa > 0 ? formatNumber(item.currentPrice / item.lpa) : '0'}\n`;
      text += "----------------------------------------------\n";
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Relatorio_Valuation_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-bg text-text-bright pb-20 font-sans selection:bg-accent/30">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-bg/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-12 h-24 flex items-end justify-between pb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-1 font-medium italic">Valuation Toolkit</p>
            <h1 className="font-display text-2xl text-accent tracking-wide italic">Graham Analysis Hub</h1>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-text-dim mb-1 font-medium">Ticker Selecionado</p>
            <p className="text-xl font-semibold tracking-tight uppercase font-mono">{ticker || '---'}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-12 pt-12 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
        
        {/* Left Side: Input Panel */}
        <section className="space-y-8 print:hidden">
          <div className="flex flex-col gap-6">
            <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50 relative">
              <label htmlFor="ticker" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Ticker da Ação
              </label>
              <div className="flex items-center gap-2 pr-3">
                <input
                  id="ticker"
                  type="text"
                  placeholder="EX: PETR4"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="flex-1 px-3 pb-3 bg-transparent border-none focus:ring-0 text-lg transition-all uppercase font-mono placeholder:text-text-dim/30"
                />
                <button
                  onClick={handleAutoFill}
                  disabled={!ticker || isLoading}
                  className={cn(
                    "p-2 rounded-md transition-all",
                    isLoading ? "bg-accent/20 text-accent animate-pulse" : "bg-accent/10 text-accent hover:bg-accent/20 active:scale-95 disabled:opacity-30"
                  )}
                  title="Auto-preencher dados"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
              <label htmlFor="lpa" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                LPA (Lucro por Ação)
              </label>
              <input
                id="lpa"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={lpa}
                onChange={(e) => setLpa(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))}
                className="w-full px-3 pb-3 bg-transparent border-none focus:ring-0 text-lg transition-all font-mono placeholder:text-text-dim/30"
              />
            </div>

            <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
              <label htmlFor="vpa" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                VPA (Patrimonial)
              </label>
              <input
                id="vpa"
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={vpa}
                onChange={(e) => setVpa(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))}
                className="w-full px-3 pb-3 bg-transparent border-none focus:ring-0 text-lg transition-all font-mono placeholder:text-text-dim/30"
              />
            </div>

            <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
              <label htmlFor="currentPrice" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Preço de Mercado
              </label>
              <input
                id="currentPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value)}
                className="w-full px-3 pb-3 bg-transparent border-none focus:ring-0 text-lg transition-all font-mono placeholder:text-text-dim/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
                <label htmlFor="dividend" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Divs. Anuais (12m/LTM)
                </label>
                <input
                  id="dividend"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={dividend}
                  onChange={(e) => setDividend(e.target.value)}
                  className="w-full px-3 pb-2 bg-transparent border-none focus:ring-0 text-sm transition-all font-mono placeholder:text-text-dim/30"
                />
              </div>
              <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
                <label htmlFor="growth" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                  Cresc. Est. (%)
                </label>
                <input
                  id="growth"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={growth}
                  onChange={(e) => setGrowth(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))}
                  className="w-full px-3 pb-2 bg-transparent border-none focus:ring-0 text-sm transition-all font-mono placeholder:text-text-dim/30"
                />
              </div>
            </div>

            <div className="space-y-1.5 ring-1 ring-border rounded-lg p-1 bg-card/50">
              <label htmlFor="targetYield" className="px-3 pt-2 block text-[10px] font-bold uppercase tracking-widest text-text-dim">
                Yield Alvo Bazin (%)
              </label>
              <input
                id="targetYield"
                type="text"
                inputMode="decimal"
                placeholder="6.00"
                value={targetYield}
                onChange={(e) => setTargetYield(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))}
                className="w-full px-3 pb-3 bg-transparent border-none focus:ring-0 text-lg transition-all font-mono placeholder:text-text-dim/30"
              />
            </div>

            <div className="h-px bg-border my-2" />

            <button
              onClick={handleSave}
              disabled={grahamPrice === null || !ticker}
              className="w-full bg-accent text-bg font-bold py-4 rounded uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-20 disabled:grayscale transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
            >
              <PlusCircle size={16} />
              Guardar Análise
            </button>
          </div>

          <div className="p-6 border border-border rounded bg-card/30">
            <p className="text-[10px] uppercase tracking-widest text-text-dim mb-4 font-bold border-b border-border pb-2">Constantes</p>
            <div className="flex justify-between items-center text-sm font-mono opacity-60">
              <span>Graham Factor</span>
              <span>22.5</span>
            </div>
          </div>
        </section>

        {/* Right Side: Results and History */}
        <section className="space-y-12">
          
          {/* Main Result Display */}
          <div className="bg-card border border-border p-12 rounded-sm flex flex-col items-center justify-center text-center relative min-h-[340px] shadow-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-text-dim font-medium mb-2">Preço Teto Estimado</p>
            {grahamPrice !== null ? (
              <>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "font-display text-[84px] leading-tight text-accent italic tracking-tight",
                    grahamPrice === 0 && "text-danger/40"
                  )}
                >
                  {formatCurrency(grahamPrice)}
                </motion.div>
                
                {marginOfSafety !== null && grahamPrice > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "text-xl font-medium tracking-tight mt-2 flex items-center gap-2",
                      marginOfSafety > 0 ? "text-success" : "text-danger"
                    )}
                  >
                    {marginOfSafety > 15 ? "Excelente Margem" : marginOfSafety > 0 ? "Ação Descontada" : "Sobrevalorizada"}
                    <span className="opacity-60 font-mono text-sm">({formatNumber(marginOfSafety, 1)}%)</span>
                  </motion.div>
                )}

                {grahamPrice === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-danger text-sm font-medium tracking-tight mt-2"
                  >
                    Ativo com indicadores negativos
                  </motion.div>
                )}

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full max-w-lg border-t border-border pt-8">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-1">Yield Anual</p>
                    <p className="font-mono text-accent">{dyRatio ? `${formatNumber(dyRatio)}%` : '---'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-1">Indicador P/L</p>
                    <p className="font-mono text-accent">{plRatio ? formatNumber(plRatio) : '---'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-1">Preço Justo (Rev)</p>
                    <p className="font-mono text-accent/60">{revisedGrahamPrice ? formatCurrency(revisedGrahamPrice) : '---'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-1">P/VP Atual</p>
                    <p className="font-mono text-accent">{parsedVpa !== 0 && parsedCurrentPrice > 0 ? formatNumber(parsedCurrentPrice / parsedVpa) : '---'}</p>
                  </div>
                  <div className="text-center border-l border-border pl-8 sm:border-none sm:pl-0">
                    <p className="text-[9px] uppercase tracking-widest text-text-dim font-bold mb-1">Preço Justo (Bazin)</p>
                    <p className="font-mono text-success">{bazinPrice ? formatCurrency(bazinPrice) : '---'}</p>
                  </div>
                </div>
                
                <p className="absolute bottom-8 right-10 font-display text-[10px] italic text-text-dim/40 tracking-widest">
                  V = √(22.5 × LPA × VPA)
                </p>
              </>
            ) : lpa || vpa ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="text-text-dim/40 italic text-sm font-display lowercase tracking-widest max-w-xs text-center">
                  aguardando parâmetros válidos...
                </div>
              </div>
            ) : (
              <div className="py-12 text-text-dim/30 italic text-sm font-display lowercase tracking-widest">
                aguardando parâmetros de entrada...
              </div>
            )}
          </div>

          {/* Simulations Table */}
          <div className="space-y-4 print:mt-0">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-dim">Registros Históricos</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 print:hidden">
                  <button 
                    onClick={handleExportText}
                    disabled={history.length === 0}
                    className="text-[10px] uppercase tracking-widest text-accent hover:underline flex items-center gap-1.5 disabled:opacity-30 disabled:no-underline"
                  >
                    Exportar TXT <FileText size={10} />
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="text-[10px] uppercase tracking-widest text-text-bright hover:underline flex items-center gap-1.5"
                  >
                    Imprimir <Printer size={10} />
                  </button>
                </div>
                <button 
                  onClick={() => document.getElementById('formula-info')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[10px] uppercase tracking-widest text-accent hover:underline flex items-center gap-1.5 print:hidden"
                >
                  Metodologia <Info size={10} />
                </button>
              </div>
            </div>

            <div className="border border-border rounded-sm bg-card/20 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card/40">
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold">Ativo</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold hidden sm:table-cell">LPA</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold hidden sm:table-cell">VPA</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold">P. Graham</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold hidden lg:table-cell">P. Bazin</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold hidden sm:table-cell">P/L</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold hidden md:table-cell">DY</th>
                    <th className="p-4 text-[9px] uppercase tracking-widest text-text-dim font-bold">Status</th>
                    <th className="p-4 w-24 text-[9px] uppercase tracking-widest text-text-dim font-bold text-right print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-text-dim/20 font-display italic text-sm">
                        nenhum registro encontrado
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence initial={false}>
                      {history.map((item) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-white/5 transition-colors"
                        >
                          <td className="p-4 font-mono font-bold text-accent tracking-tighter">{item.ticker}</td>
                          <td className="p-4 text-xs text-text-dim font-mono hidden sm:table-cell">{formatNumber(item.lpa)}</td>
                          <td className="p-4 text-xs text-text-dim font-mono hidden sm:table-cell">{formatNumber(item.vpa)}</td>
                          <td className="p-4 font-mono text-sm tracking-tight">{formatCurrency(item.grahamPrice)}</td>
                          <td className="p-4 font-mono text-sm tracking-tight text-success/80 hidden lg:table-cell">{item.bazinPrice ? formatCurrency(item.bazinPrice) : '---'}</td>
                          <td className="p-4 text-xs font-mono text-text-dim hidden sm:table-cell">
                            {item.lpa !== 0 ? formatNumber(item.currentPrice / item.lpa) : '---'}
                          </td>
                          <td className="p-4 text-xs font-mono text-text-dim hidden md:table-cell">
                            {item.currentPrice > 0 ? `${formatNumber((item.dividend / item.currentPrice) * 100)}%` : '---'}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded-sm font-bold tracking-widest border",
                              item.marginOfSafety > 15 ? "bg-success/10 text-success border-success/20" :
                              item.marginOfSafety > 0 ? "bg-accent/10 text-accent border-accent/20" :
                              "bg-danger/10 text-danger border-danger/20"
                            )}>
                              {item.marginOfSafety > 15 ? "COMPRA" : item.marginOfSafety > 0 ? "DESCONTADA" : "CARA"}
                            </span>
                          </td>
                          <td className="p-4 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleShare(item)}
                                className={cn(
                                  "p-1.5 transition-colors rounded hover:bg-white/5",
                                  copiedId === item.id ? "text-success" : "text-text-dim/40 hover:text-accent"
                                )}
                                title={copiedId === item.id ? "Copiado!" : "Compartilhar Análise"}
                              >
                                {copiedId === item.id ? <Check size={14} /> : <Share2 size={14} />}
                              </button>
                              <button 
                                onClick={() => removeHistory(item.id)}
                                className="p-1.5 text-text-dim/40 hover:text-danger hover:bg-white/5 transition-all rounded"
                                title="Excluir Registro"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Methodology Info */}
          <div id="formula-info" className="p-12 border-t border-border opacity-60">
            <h3 className="font-display italic text-lg text-accent mb-4">Sobre o Hub de Análise</h3>
            <p className="text-xs text-text-dim leading-relaxed max-w-2xl font-light tracking-wide mb-4">
              Este sistema implementa rigorosamente a abordagem de Benjamin Graham. 
              Ao cruzar o Valor Patrimonial (VPA) com o Lucro por Ação (LPA), estabelece-se um teto teórico fundamentado para empresas sólidas. 
            </p>
            <p className="text-xs text-text-dim leading-relaxed max-w-2xl font-light tracking-wide italic">
              <strong>Fórmula de Graham Revisada:</strong> Para empresas com expectativa de crescimento, exibimos o "Preço Justo (Rev)", que utiliza a fórmula v = lpa × (8.5 + 2g), onde 'g' é a taxa de crescimento anual estimada.
            </p>
            <p className="text-xs text-text-dim leading-relaxed max-w-2xl font-light tracking-wide italic mt-2">
              <strong>Método Bazin:</strong> Calcula o preço teto dividindo o dividendo total dos últimos 12 meses (LTM) pelo yield esperado (padrão 6%). Ideal para ações focadas em renda.
            </p>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-12 mt-12 py-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-text-dim">
        <p>Mercado: Em operação</p>
        <p>© 2026 Graham Analysis Center</p>
        <p>Análise Fundamentalista v1.0</p>
      </footer>
    </div>
  );
}
