import { Thing, WithContext } from 'schema-dts'
import { getIntuition, getOrCreateAtom, getOrCreateAtomWithJson, getCreateOrDepositOnTriple } from './utils'
import { parseEther } from 'viem';

async function main() {

  // System predicates
  const admin = await getIntuition(0)

  const follow = await getOrCreateAtom(
    admin.multivault,
    'https://schema.org/FollowAction',
  )

  const i = await getOrCreateAtomWithJson(
    admin.multivault,
    {
      "@context": "https://schema.org",
      "@type": "Thing",
      name: "I",
      description: "A first-person singular pronoun used by a speaker to refer to themselves. For example, \"I am studying for a test\". \"I\" can also be used to refer to the narrator of a first-person singular literary work."
    } as WithContext<Thing>
  )

  // Alice
  const alice = await getIntuition(1)
  const aliceAccount = await getOrCreateAtom(alice.multivault, alice.account.address)

  // Bob
  const bob = await getIntuition(2)
  const bobAccount = await getOrCreateAtom(bob.multivault, bob.account.address)

  // Carol
  const carol = await getIntuition(3)
  const carolAccount = await getOrCreateAtom(carol.multivault, carol.account.address)

  // Alice follows Bob
  await getCreateOrDepositOnTriple(alice.multivault, i, follow, bobAccount, parseEther('0.00042'))

  // Alice follows Carol
  await getCreateOrDepositOnTriple(alice.multivault, i, follow, carolAccount, parseEther('0.00042'))

  // Bob follows Alice
  await getCreateOrDepositOnTriple(bob.multivault, i, follow, aliceAccount, parseEther('0.00042'))

  // Carol follows Bob
  await getCreateOrDepositOnTriple(carol.multivault, i, follow, bobAccount, parseEther('0.00042'))

}

main()
  .catch(console.error)
  .finally(() => console.log('done'))
