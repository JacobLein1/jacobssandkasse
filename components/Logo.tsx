import Link from 'next/link'
import Image from 'next/image'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
      <Image
        src="/logo.png"
        alt="Hjem"
        width={size}
        height={size}
        className="rounded-full"
      />
    </Link>
  )
}
