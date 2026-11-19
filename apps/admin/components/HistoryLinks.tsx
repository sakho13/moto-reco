import Link from 'next/link'

export function UserLink({ id, name }: { id: string; name: string }) {
  return <Link href={`/users/${id}`}>{name}</Link>
}

export function MyBikeLink({ id, label }: { id: string; label: string }) {
  return <Link href={`/my-bikes/${id}`}>{label}</Link>
}
