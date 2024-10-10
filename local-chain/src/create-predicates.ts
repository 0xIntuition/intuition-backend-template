import { getIntuition, getOrCreateAtom, getOrCreateAtomWithJson } from './utils'
import { Organization, WithContext } from 'schema-dts'

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
  const organizationPredicate = await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Organization',
  )
  await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Person',
  )

  const adminAccount = await getOrCreateAtom(admin.multivault, admin.account.address)

  const adminOrganization = await getOrCreateAtomWithJson(
    admin.multivault,
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Intuition Systems',
      image: 'https://avatars.githubusercontent.com/u/94311139?s=200&v=4',
      email: 'info@intuition.systems',
      url: 'https://intuition.systems',
    } as WithContext<Organization>)

  await admin.multivault.createTriple({
    subjectId: adminAccount,
    predicateId: organizationPredicate,
    objectId: adminOrganization,
    initialDeposit: 100n,
  })

}

main()
  .catch(console.error)
  .finally(() => console.log('done'))
