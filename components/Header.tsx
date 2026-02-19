"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { IMAGES } from '@/lib/constants';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      isScrolled ? "bg-forest-green shadow-lg py-2" : "bg-transparent py-4"
    )}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#hero" className="flex items-center">
          <Image
            src={IMAGES.LOGO}
            alt="Святобор"
            width={50}
            height={50}
            className="mr-2"
          />
          <span className={cn(
            "font-correiria text-xl md:text-2xl transition-colors duration-300",
            isScrolled ? "text-white" : "text-warm-beige"
          )}>Святобор</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          {['Главная', 'Услуги', 'Преимущества', 'Процесс', 'Отзывы', 'Контакты'].map((item, index) => (
            <a
              key={index}
              href={`#${item.toLowerCase()}`}
              className={cn(
                "transition-colors duration-300 hover:text-accent",
                isScrolled ? "text-white" : "text-warm-beige"
              )}
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Phone */}
        <a
          href="tel:+79951693888"
          className={cn(
            "hidden md:flex items-center transition-colors duration-300 hover:text-accent",
            isScrolled ? "text-white" : "text-warm-beige"
          )}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          +7 (995) 169-38-88
        </a>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white"
          onClick={toggleMobileMenu}
          aria-label="Меню"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "h-6 w-6 transition-colors duration-300",
              isScrolled ? "text-white" : "text-warm-beige"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "fixed inset-0 bg-forest-green bg-opacity-95 z-50 transition-all duration-300 transform flex flex-col md:hidden",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex justify-between items-center p-4 border-b border-moss-green">
          <a href="#hero" className="flex items-center">
            <Image
              src={IMAGES.LOGO}
              alt="Святобор"
              width={40}
              height={40}
              className="mr-2"
            />
            <span className="font-correiria text-xl text-white">Святобор</span>
          </a>
          <button onClick={toggleMobileMenu} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col p-4 space-y-4">
          {['Главная', 'Услуги', 'Преимущества', 'Процесс', 'Отзывы', 'Контакты'].map((item, index) => (
            <a
              key={index}
              href={`#${item.toLowerCase()}`}
              className="text-white text-lg hover:text-accent transition-colors"
              onClick={toggleMobileMenu}
            >
              {item}
            </a>
          ))}
          <a href="tel:+79951693888" className="flex items-center text-white text-lg hover:text-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            +7 (995) 169-38-88
          </a>
          <a href="https://wa.me/79883398963" className="flex items-center text-white text-lg hover:text-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}