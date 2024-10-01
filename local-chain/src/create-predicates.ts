import { getIntuition, getOrCreateAtom } from './utils'

async function main() {
  const admin = await getIntuition(0)

  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/FollowAction',
  )
  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/keywords',
  )
  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Thing',
  )
  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Organization',
  )
  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Person',
  )

}

main()
  .catch(console.error)
  .finally(() => console.log('done'))
