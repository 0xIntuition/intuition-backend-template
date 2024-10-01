import { ponder } from "@/generated";

ponder.get("/followers/:account", async (c) => {
  const account = c.req.param("account");
  return c.json(
    // TODO: Implement this
    [account, "1", "2", "3", "4", "5"]
  );
});

