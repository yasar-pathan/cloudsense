import './globals.css';

export const metadata = {
  title: 'CloudSense — AI Cost Monitor & AWS Intelligence Platform',
  description:
    'Continuous AWS cloud cost monitoring, 10-pattern heuristic anomaly detection, budget governance, and proactive Twilio voice alerts.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-zinc-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
