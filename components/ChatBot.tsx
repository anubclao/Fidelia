import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MessageCircle, X, Send, Sparkles, Loader2, Minimize2 } from 'lucide-react';
import { User } from '../types';

interface Props {
  user: User;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC<Props> = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `¡Hola ${user.name.split(' ')[0]}! 👋 Soy Fidelia, tu asistente virtual. Puedo ayudarte a consultar tu saldo, explicarte cómo ganar más puntos o darte información sobre tus beneficios nivel ${user.tier || 'Estándar'}. ¿En qué te ayudo hoy?` }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `
        Eres Fidelia, la asistente de inteligencia artificial amigable y entusiasta de "Fidelia App".
        
        CONTEXTO DEL USUARIO ACTUAL:
        - Nombre: ${user.name}
        - Puntos actuales: ${user.points}
        - Nivel de lealtad: ${user.tier || 'Estándar'}
        
        SOBRE LA APP:
        - Fidelia App premia la lealtad de los clientes.
        - Los usuarios ganan puntos registrando sus compras (subiendo foto del ticket o manual).
        - 1 punto se gana aproximadamente por cada $1,000 pesos de compra (depende de configuración).
        - Los puntos se canjean por premios en el catálogo.
        - Existen "Tarjetas de Sellos" digitales (ej: compra 10 cafés, lleva 1 gratis).
        
        TU PERSONALIDAD:
        - Eres útil, breve y usas emojis ocasionalmente.
        - Si te preguntan por saldo, usa el dato del contexto.
        - Si preguntan cómo ganar puntos, explica la opción "Registrar Compra".
        - Si preguntan por premios, invítalos a ver la pestaña "Premios".
        - Responde siempre en Español.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...messages.map(m => ({ 
                role: m.role, 
                parts: [{ text: m.text }] 
            })),
            { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const aiText = response.text || "Lo siento, tuve un problema pensando mi respuesta. ¿Podrías intentar de nuevo?";
      
      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (error) {
      console.error("Error generating response:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Tuve un pequeño error de conexión. Por favor intenta más tarde." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white w-full sm:w-96 h-[500px] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-[#0F172A] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-[#1E293B]">
                <Sparkles size={18} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Fidelia AI</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-xs text-blue-200">En línea</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                    <Minimize2 size={18} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition">
                    <X size={18} />
                </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center gap-2">
                   <Loader2 size={16} className="animate-spin text-blue-600" />
                   <span className="text-xs text-gray-400 font-medium">Fidelia está escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu duda aquí..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400"
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">Powered by Gemini 3 Pro</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${
            isOpen ? 'bg-gray-700 text-white rotate-90' : 'bg-gradient-to-r from-[#0F172A] to-blue-900 text-white'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>
    </div>
  );
};

export default ChatBot;
