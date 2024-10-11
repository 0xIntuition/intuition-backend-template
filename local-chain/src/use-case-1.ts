import { Person, Thing, WithContext } from 'schema-dts'
import { getIntuition, getOrCreateAtom, getOrCreateAtomWithJson } from './utils'
import { faker } from '@faker-js/faker';
import { parseEther } from 'viem';

async function main() {

  // System predicates
  const admin = await getIntuition(0)

  const personPredicate = await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/Person',
  )

  const tagPredicate = await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/keywords',
  )


  // Alice profile
  const alice = await getIntuition(1)

  const aliceAccount = await getOrCreateAtom(alice.multivault, alice.account.address)

  const alicePerson = await getOrCreateAtomWithJson(
    alice.multivault,
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Alice Smith',
      image: faker.image.avatar(),
      url: 'https://alice.example.com',
    } as WithContext<Person>)

  await alice.multivault.createTriple({
    subjectId: aliceAccount,
    predicateId: personPredicate,
    objectId: alicePerson,
    initialDeposit: 100n,
  })


  // Bob profile
  const bob = await getIntuition(2)

  const bobAccount = await getOrCreateAtom(bob.multivault, bob.account.address)

  const bobPerson = await getOrCreateAtomWithJson(
    bob.multivault,
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Bob Johnson',
      image: faker.image.avatar(),
      url: 'https://bob.example.com',
    } as WithContext<Person>)

  await bob.multivault.createTriple({
    subjectId: bobAccount,
    predicateId: personPredicate,
    objectId: bobPerson,
    initialDeposit: 100n,
  })

  // Carol profile
  const carol = await getIntuition(3)

  const carolAccount = await getOrCreateAtom(carol.multivault, carol.account.address)

  const carolPerson = await getOrCreateAtomWithJson(
    carol.multivault,
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Carol Brown',
      image: faker.image.avatar(),
      url: 'https://carol.example.com',
    } as WithContext<Person>)

  await carol.multivault.createTriple({
    subjectId: carolAccount,
    predicateId: personPredicate,
    objectId: carolPerson,
    initialDeposit: 100n,
  })


  // Metamask thing

  const metamask = await getOrCreateAtomWithJson(
    alice.multivault,
    {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "MetaMask",
      description: "A free, digital cryptocurrency wallet that allows users to store and manage their cryptocurrencies, interact with decentralized applications (dApps), and execute transactions on blockchain networks. ",
      image: "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1724268592/remix/nf6a4idlnylba2n11awa.png",
      url: "https://metamask.io/"
    }
  )

  // Web3 tooling thing
  const web3Tooling = await getOrCreateAtomWithJson(
    alice.multivault,
    {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "Top Web3 Developer Tooling",
      description: "Big brain toolbox",
      image: "https://res.cloudinary.com/dfpwy9nyv/image/upload/v1724255696/remix/hqhkfavh5xvbh1w5wfep.png"
    }
  )

  const metamaskWeb3ToolingTriple = await alice.multivault.createTriple({
    subjectId: metamask,
    predicateId: tagPredicate,
    objectId: web3Tooling,
    initialDeposit: parseEther('0.00042'),
  })

  // Bob disagrees with Alice
  const counterVault = await bob.multivault.getCounterIdFromTriple(
    metamaskWeb3ToolingTriple.vaultId,
  )

  // const downvote = await bob.multivault.depositTriple(
  //   counterVault,
  //   parseEther('0.00042'),
  // )

  // Tally thing

  const tally = await getOrCreateAtomWithJson(
    bob.multivault,
    {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "Tally",
      description: "Web3 wallet",
    }
  )

  const tallyWeb3ToolingTriple = await bob.multivault.createTriple({
    subjectId: tally,
    predicateId: tagPredicate,
    objectId: web3Tooling,
    initialDeposit: parseEther('0.00042'),
  })

  const anonymous = await getIntuition(4)
  await anonymous.multivault.depositTriple(
    tallyWeb3ToolingTriple.vaultId,
    parseEther('0.00042'),
  )



}

main()
  .catch(console.error)
  .finally(() => console.log('done'))
