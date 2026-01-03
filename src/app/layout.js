import './globals.css';
import Header from '@/components/Header';

export const metadata = {
  title: 'Whisked Away',
  description: 'Baking tools, ingredients, and supplies.',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
