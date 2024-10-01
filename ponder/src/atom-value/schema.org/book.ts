import { Context, Schema } from "@/generated";

export async function createBook(
  context: Context,
  atom: Schema["Atom"],
  obj: any,
) {
  const { Atom, AtomValue, Book } = context.db;

  const book = await Book.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      name: obj.name,
      description: obj.description,
      genre: obj.genre,
      url: obj.url,
    },
  });

  const value = await AtomValue.create({
    id: atom.id,
    data: {
      atomId: atom.id,
      bookId: book.id,
    },
  });

  await Atom.update({
    id: atom.id,
    data: {
      emoji: '📚',
      type: 'Book',
      valueId: value.id,
      label: book.name,
    },
  });

}
