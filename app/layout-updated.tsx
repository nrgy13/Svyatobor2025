import './globals.css';
import type { Metadata } from 'next';
import { correiria, montserrat } from '@/lib/fonts';
import { Toaster } from '@/components/ui/sonner';
import LoadingScreen from '@/components/LoadingScreen';
import { ScrollThrottleProvider } from '@/contexts/ScrollThrottleContext';
import { ScrollThrottleIndicator } from '@/components/ScrollThrottleIndicator';

export const metadata: Metadata = {
  title: 'Святобор | Расчистка участков от деревьев, кустов, травы',
  description: 'Профессиональная расчистка участков от деревьев, кустов и травы. Быстро, качественно, с гарантией. Собственная техника и опытные специалисты.',
  keywords: 'расчистка участков, вырубка деревьев, покос травы, удаление кустарников, подготовка участка',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link
          rel="icon"
          href="/favicon.ico"
          sizes="any"
        />
      </head>
      <body className={`${montserrat.variable} ${correiria.variable}`}>
        <ScrollThrottleProvider
          maxSpeed={3000}
          safeSpeed={1500}
          smoothingFactor={0.8}
          enabled={true}
        >
          <LoadingScreen />
          {children}
          <Toaster position="top-center" />
          <ScrollThrottleIndicator />
        </ScrollThrottleProvider>
      </body>
    </html>
  );
}