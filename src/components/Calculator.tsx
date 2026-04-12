
import React, { useState, useEffect } from 'react';
import {
  Calculator,
  History,
  Trash2,
  Delete,
  Hash,
  Percent,
  Divide,
  X,
  Minus,
  Plus,
  Equal,
  ChevronRight
} from 'lucide-react';

interface CalculationHistory {
  formula: string;
  result: string;
  timestamp: Date;
}

const CalculatorComponent: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setDisplay('0');
  };

  const calculate = () => {
    try {
      const fullEquation = equation + display;
      // Using Function constructor as a safer alternative to eval for simple math
      // In a production app, use a math library
      const result = Function('"use strict";return (' + fullEquation.replace(/x/g, '*').replace(/÷/g, '/') + ')')();

      const newHistory: CalculationHistory = {
        formula: fullEquation,
        result: result.toString(),
        timestamp: new Date()
      };

      setHistory([newHistory, ...history].slice(0, 10));
      setDisplay(result.toString());
      setEquation('');
    } catch (error) {
      setDisplay('Error');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/[0-9]/.test(e.key)) handleNumber(e.key);
      if (['+', '-', '*', '/'].includes(e.key)) {
        let op = e.key;
        if (op === '*') op = 'x';
        if (op === '/') op = '÷';
        handleOperator(op);
      }
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculate();
      }
      if (e.key === 'Backspace') backspace();
      if (e.key === 'Escape') clear();
      if (e.key === '.') handleNumber('.');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation]);

  const clear = () => {
    setDisplay('0');
    setEquation('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            Outils de Calcul
          </h2>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-3 ml-1">Assistante arithmétique haute précision</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showHistory ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
        >
          <History className="w-4 h-4" />
          Historique
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Calculator */}
        <div className="lg:col-span-2 glass rounded-[3rem] p-8 border-white/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full -translate-y-32 translate-x-32" />

          {/* Display Environment */}
          <div className="bg-gray-900 rounded-[2rem] p-8 mb-8 shadow-inner relative overflow-hidden">
            <div className="text-blue-400/50 text-right text-xs font-black uppercase tracking-widest mb-2 h-4">
              {equation}
            </div>
            <div className="text-white text-right text-6xl font-black tracking-tighter truncate leading-none">
              {parseFloat(display).toLocaleString(undefined, { maximumFractionDigits: 8 })}
            </div>
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300" style={{ width: (display.length * 5) + '%' }} />
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-4 gap-4">
            {/* Row 1 */}
            <button onClick={clear} className="p-6 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all shadow-sm">AC</button>
            <button onClick={backspace} className="p-6 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-200 transition-all shadow-sm flex items-center justify-center"><Delete className="w-5 h-5" /></button>
            <button onClick={() => handleOperator('%')} className="p-6 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs hover:bg-gray-200 transition-all shadow-sm flex items-center justify-center"><Percent className="w-5 h-5" /></button>
            <button onClick={() => handleOperator('÷')} className="p-6 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"><Divide className="w-5 h-5" /></button>

            {/* Row 2 */}
            <button onClick={() => handleNumber('7')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">7</button>
            <button onClick={() => handleNumber('8')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">8</button>
            <button onClick={() => handleNumber('9')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">9</button>
            <button onClick={() => handleOperator('x')} className="p-8 bg-blue-50 text-blue-600 rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"><X className="w-6 h-6" /></button>

            {/* Row 3 */}
            <button onClick={() => handleNumber('4')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">4</button>
            <button onClick={() => handleNumber('5')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">5</button>
            <button onClick={() => handleNumber('6')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">6</button>
            <button onClick={() => handleOperator('-')} className="p-8 bg-blue-50 text-blue-600 rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"><Minus className="w-6 h-6" /></button>

            {/* Row 4 */}
            <button onClick={() => handleNumber('1')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">1</button>
            <button onClick={() => handleNumber('2')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">2</button>
            <button onClick={() => handleNumber('3')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">3</button>
            <button onClick={() => handleOperator('+')} className="p-8 bg-blue-50 text-blue-600 rounded-3xl font-black text-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center"><Plus className="w-6 h-6" /></button>

            {/* Row 5 */}
            <button onClick={() => handleNumber('0')} className="col-span-2 p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50 text-left px-12">0</button>
            <button onClick={() => handleNumber('.')} className="p-8 bg-white text-gray-800 rounded-3xl font-black text-2xl hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-gray-50">.</button>
            <button onClick={calculate} className="p-8 bg-blue-600 text-white rounded-3xl font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-200 flex items-center justify-center"><Equal className="w-8 h-8" /></button>
          </div>
        </div>

        {/* Info & Side */}
        <div className="space-y-6">
          <div className="glass p-8 rounded-[3rem] border-white/50 shadow-xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-800 italic flex items-center gap-3">
              <Hash className="w-4 h-4" /> Formules rapides
            </h3>
            <div className="space-y-3">
              {[
                { label: 'TVA 20%', formula: 'x 1.2' },
                { label: 'TVA 14%', formula: 'x 1.14' },
                { label: 'Conversion TTC > HT', formula: '/ 1.2' },
                { label: 'Marge 30%', formula: '/ 0.7' }
              ].map((tool, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const val = parseFloat(display);
                    if (tool.formula.startsWith('x')) {
                      setDisplay((val * parseFloat(tool.formula.split(' ')[1])).toString());
                    } else {
                      setDisplay((val / parseFloat(tool.formula.split(' ')[1])).toString());
                    }
                  }}
                  className="w-full p-4 bg-blue-50/30 rounded-2xl flex justify-between items-center group hover:bg-blue-600 transition-all"
                >
                  <span className="text-[10px] font-black text-blue-900 group-hover:text-white uppercase tracking-wider">{tool.label}</span>
                  <ChevronRight className="w-4 h-4 text-blue-300 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          {showHistory && (
            <div className="glass p-8 rounded-[3rem] border-white/50 shadow-xl space-y-6 animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 italic">Historique</h3>
                <button onClick={() => setHistory([])} className="text-red-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {history.length === 0 ? (
                  <p className="text-[10px] font-bold text-gray-300 uppercase italic text-center py-10 tracking-[0.2em]">Aucune donnée</p>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{item.formula}</p>
                      <p className="text-lg font-black text-blue-600 tracking-tighter">= {parseFloat(item.result).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorComponent;
