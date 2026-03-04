import './globals.css';
import { AuthProvider }     from '../context/AuthContext';
import { SettingsProvider } from '../context/SettingsContext';
import { Toaster }          from 'react-hot-toast';

export const metadata = {
  title:       'Jackot',
  description: 'Your business, your way',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <SettingsProvider>
            {children}
            <Toaster position="top-right" />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
