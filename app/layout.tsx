import './globals.css'

export const metadata = {
  title: 'Balance Checker',
  description: 'Check a Farcaster user’s token or NFT balance.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="fc:frame"
          content='{"version":"next","imageUrl":"https://balance-check.xyz/banner.png","button":{"title":"Check Balance","action":{"type":"launch_frame","url":"https://balance-check.xyz"}}}'
        />
      </head>
      <body className="bg-[#0B0C1B] text-white">{children}</body>
    </html>
  )
}
