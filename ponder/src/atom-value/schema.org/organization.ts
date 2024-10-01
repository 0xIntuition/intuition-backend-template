import { Context, Schema } from "@/generated";

export async function createOrganization(
  context: Context,
  atom: Schema["Atom"],
  obj: any,
) {
  const { Atom, AtomValue, Organization } = context.db;

  const organization = await Organization.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      name: obj.name,
      description: obj.description,
      image: obj.image,
      url: obj.url,
    },
  });

  const value = await AtomValue.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      organizationId: organization.id,
    },
  });

  await Atom.update({
    id: atom.id,
    data: {
      emoji: '🏢',
      type: 'Organization',
      valueId: value.id,
      label: organization.name,
      image: organization.image,
    },
  });

}
