import './globals.css'

export const metadata = {
  title: 'Blooment - Florería Online',
  description: 'Las flores más hermosas para cada ocasión',
  icons: {
    icon: [
      { url: '/blooment-logo-final.png?v=3', type: 'image/png' }
    ],
    shortcut: '/blooment-logo-final.png?v=3',
    apple: '/blooment-logo-final.png?v=3',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" href="/blooment-logo-final.png?v=3" />
        <link rel="apple-touch-icon" href="/blooment-logo-final.png?v=3" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="antialiased font-nunito">
        {children}
      </body>
    </html>
  )
}