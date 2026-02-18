import './globals.css'

export const metadata = {
  title: 'Antonio Intelligence Altar',
  description: 'AI personas, virtual rapping clones, and more',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
