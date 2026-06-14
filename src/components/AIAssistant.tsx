'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Stethoscope, AlertTriangle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  actions?: Array<{ label: string; action: string }>;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hello! I am your NovaCare AI Health Assistant. How can I help you today? You can ask me medical questions, inquire about our clinical departments, or learn how to book an appointment.",
      timestamp: new Date(),
      actions: [
        { label: 'Suggest a Department', action: 'dept' },
        { label: 'How to Book Appointment', action: 'book' },
        { label: 'Explain Blood Test', action: 'blood_test' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleActionClick = (action: string) => {
    let userText = '';
    if (action === 'dept') userText = 'Which department should I consult for constant headache and dizziness?';
    if (action === 'book') userText = 'How do I book an appointment with a specialist?';
    if (action === 'blood_test') userText = 'Can you explain what high WBC count on a blood test means?';
    
    if (userText) {
      handleSendMessage(userText);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI thinking and replying
    setTimeout(() => {
      let aiText = '';
      let actions: Array<{ label: string; action: string }> | undefined;

      const lowerText = text.toLowerCase();

      if (lowerText.includes('headache') || lowerText.includes('dizz') || lowerText.includes('brain') || lowerText.includes('neurolog')) {
        aiText = "For chronic headaches, dizziness, or sensory issues, I recommend consulting our **Neurology Department** led by **Dr. Rohan Gupta**. You can book a consultation under the Patient Dashboard.";
        actions = [{ label: 'Book with Dr. Rohan Gupta', action: 'book' }];
      } else if (lowerText.includes('heart') || lowerText.includes('chest') || lowerText.includes('cardio') || lowerText.includes('breath')) {
        aiText = "🚨 **Important:** If you are experiencing sudden, severe chest pain radiating to your arm or jaw, please call emergency services immediately. For general chest discomfort, palpitations, or cardiac checkups, we recommend our **Cardiology Department** led by **Dr. Sarah Jenkins**.";
        actions = [{ label: 'Book with Dr. Sarah Jenkins', action: 'book' }];
      } else if (lowerText.includes('child') || lowerText.includes('baby') || lowerText.includes('fever') || lowerText.includes('pediatr')) {
        aiText = "For child-related health concerns, immunizations, and pediatric fevers, please visit our **Pediatrics Department** led by **Dr. Emily Chen**.";
        actions = [{ label: 'Book with Dr. Emily Chen', action: 'book' }];
      } else if (lowerText.includes('bone') || lowerText.includes('joint') || lowerText.includes('fracture') || lowerText.includes('ortho') || lowerText.includes('pain')) {
        aiText = "For musculoskeletal issues, joint pain, sports injuries, or fracture reviews, we recommend our **Orthopedics Department** led by **Dr. Marcus Vance**.";
        actions = [{ label: 'Book with Dr. Marcus Vance', action: 'book' }];
      } else if (lowerText.includes('book') || lowerText.includes('appointment') || lowerText.includes('schedule')) {
        aiText = "To book an appointment:\n1. Log into your account as a **Patient** (use email `patient@healthcare.com` and password `patient123` to test).\n2. Navigate to the **Dashboard**.\n3. Scroll to the **Book Appointment** wizard.\n4. Select a specialty, choose a doctor, pick an available slot, and click 'Confirm Booking'.";
      } else if (lowerText.includes('wbc') || lowerText.includes('blood test') || lowerText.includes('report')) {
        aiText = "A high White Blood Cell (WBC) count (known as leukocytosis) usually indicates that your body is fighting off an infection, inflammation, or responding to physical stress. It is very common and usually temporary. I suggest uploading your report in the **Reports** section of the Patient Dashboard and sharing it with one of our general specialists for a formal review.";
      } else if (lowerText.includes('hello') || lowerText.includes('hi ') || lowerText.includes('hey')) {
        aiText = "Hello! I'm here to help. What symptoms are you experiencing, or what healthcare questions do you have?";
      } else {
        aiText = "Thank you for sharing. Based on your input, I suggest consulting a primary care physician in our General Medicine department to get an accurate evaluation. You can log in to the portal to schedule an appointment or upload existing reports for sharing.";
        actions = [
          { label: 'Show departments', action: 'dept' },
          { label: 'Booking instructions', action: 'book' }
        ];
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiText,
        timestamp: new Date(),
        actions
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="w-[360px] md:w-[400px] h-[550px] rounded-2xl glass-panel shadow-2xl flex flex-col overflow-hidden border border-white/10 mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base flex items-center gap-1.5">
                    NovaCare AI
                    <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                  </h3>
                  <p className="text-xs text-white/70">Online medical guide</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-white/15 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/10 px-4 py-2 text-[10px] text-amber-600 dark:text-amber-500 flex items-start gap-1.5 leading-relaxed font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>For demo & informational support. Do not use for emergency conditions. If in danger, consult a real doctor immediately.</span>
            </div>

            {/* Messages body */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-background/40">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.sender === 'ai' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                    {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'ai' 
                        ? 'bg-card border border-border text-foreground rounded-tl-none' 
                        : 'bg-gradient-to-tr from-primary to-secondary text-white rounded-tr-none'
                    }`}>
                      <p className="whitespace-pre-line">
                        {/* Simplistic bold renderer */}
                        {msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part)}
                      </p>
                    </div>

                    {/* Action buttons inside chat */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.actions.map((act, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleActionClick(act.action)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition"
                          >
                            {act.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-2.5 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className="p-3 border-t border-border bg-card flex gap-2 items-center"
            >
              <input 
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask symptoms or booking help..."
                className="flex-grow px-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:border-primary transition"
              />
              <button 
                type="submit"
                className="p-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 shadow-md transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-4 py-3.5 rounded-full bg-gradient-to-r from-primary to-secondary text-white shadow-xl shadow-primary/25 border border-white/10 hover:shadow-2xl hover:shadow-primary/35 transition duration-300"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
        <span className="font-bold text-sm tracking-wide">AI Assistant</span>
      </motion.button>
    </div>
  );
}
