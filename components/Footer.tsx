export default function Footer() {
  return (
    <footer className="bg-forest-green text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-correiria mb-4">Святобор</h3>
            <p className="mb-4">
              Профессиональная расчистка участков от деревьев, кустов и травы. 
              Работаем в Новороссийске и Краснодарском крае.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://wa.me/79883398963" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white hover:text-warm-beige transition-colors"
                aria-label="WhatsApp"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a 
                href="tel:+79951693888"
                className="text-white hover:text-warm-beige transition-colors"
                aria-label="Телефон"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xl font-correiria mb-4">Услуги</h3>
            <ul className="space-y-2">
              <li>
                <a href="#услуги" className="hover:text-warm-beige transition-colors">
                  Удаление деревьев и кустарников
                </a>
              </li>
              <li>
                <a href="#услуги" className="hover:text-warm-beige transition-colors">
                  Покос травы
                </a>
              </li>
              <li>
                <a href="#услуги" className="hover:text-warm-beige transition-colors">
                  Обработка растений от вредителей
                </a>
              </li>
              <li>
                <a href="#услуги" className="hover:text-warm-beige transition-colors">
                  Вывоз и утилизация растительных остатков
                </a>
              </li>
              <li>
                <a href="#услуги" className="hover:text-warm-beige transition-colors">
                  Подготовка участка под строительство
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-correiria mb-4">Контакты</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+79951693888" className="hover:text-warm-beige transition-colors">
                  +7 (995) 169-38-88
                </a>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:берест@святобор.online" className="hover:text-warm-beige transition-colors">
                  берест@святобор.online
                </a>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Новороссийск и Краснодарский край</span>
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Пн-Пт: 8:00 - 20:00, Сб-Вс: 9:00 - 18:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-moss-green text-center">
          <p>© {new Date().getFullYear()} Святобор. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
}
