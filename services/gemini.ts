import { GoogleGenAI } from "@google/genai";

// Inicialización centralizada del cliente
// La configuración en vite.config.js inyectará el valor de la variable de entorno aquí
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const sendMessageToGemini = async (
  history: ChatMessage[], 
  newMessage: string, 
  userContext: { name: string; points: number; tier: string }
) => {
  try {
    const systemInstruction = `
      Eres Fidelia, la asistente de inteligencia artificial amigable y entusiasta de "Fidelia App".
      
      CONTEXTO DEL USUARIO ACTUAL:
      - Nombre: ${userContext.name}
      - Puntos actuales: ${userContext.points}
      - Nivel de lealtad: ${userContext.tier}
      
      SOBRE LA APP:
      - Fidelia App premia la lealtad de los clientes.
      - Los usuarios ganan puntos registrando sus compras.
      - Los puntos se canjean por premios en el catálogo.
      - Responde siempre en Español, sé breve y usa emojis.
    `;

    // Transform history to Gemini format
    const contents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // Add new user message
    contents.push({
      role: 'user',
      parts: [{ text: newMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Modelo rápido y eficiente
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "Lo siento, no pude procesar tu solicitud.";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Tuve un problema de conexión. Por favor intenta de nuevo.";
  }
};
