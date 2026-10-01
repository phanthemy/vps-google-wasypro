import React, { useState, useEffect } from 'react';
import { FAQ } from '../types/schema';
import { api } from '../services/api';
import { ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>('faq-01');

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const data = await api.getFAQs();
        setFaqs(data);
      } catch (err) {
        console.error('Error fetching FAQs:', err);
      }
    };
    loadFaqs();
  }, []);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-12 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center mb-10">
          <h2 className="text-[24px] sm:text-[28px] font-heading font-bold text-gray-800 tracking-tight uppercase">
            CÂU HỎI THƯỜNG GẶP
          </h2>
          <div className="w-16 h-1 bg-primary mx-auto mt-4 mb-4"></div>
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-md border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-sky-50 border-primary shadow-sm'
                    : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-gray-900 text-sm sm:text-base"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'text-primary' : 'text-gray-400'}`} />
                    <span>{faq.question}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-[13px] sm:text-sm text-gray-600 leading-relaxed border-t border-primary-light/30 animate-in fade-in duration-200">
                    <p className="pl-8">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
