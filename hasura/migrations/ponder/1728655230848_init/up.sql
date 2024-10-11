SET check_function_bodies = false;

CREATE FUNCTION public.accounts_that_claim_about_account(address text, subject numeric, predicate numeric) RETURNS SETOF public."Account"
    LANGUAGE sql STABLE
    AS $$
SELECT "public"."Account".*
FROM "public"."Claim"
JOIN "public"."Account" ON "public"."Account"."atomId" = "public"."Claim"."objectId"
WHERE 
 "public"."Claim"."subjectId" = subject
AND "public"."Claim"."predicateId" = predicate
AND "public"."Claim"."accountId" = "address";
$$;

CREATE FUNCTION public.claims_from_following(address text) RETURNS SETOF public."Claim"
    LANGUAGE sql STABLE
    AS $$
	SELECT
		*
	FROM "public"."Claim"
        WHERE "public"."Claim"."accountId" IN (SELECT "id" FROM following(address));
$$;

CREATE FUNCTION public.following(address text) RETURNS SETOF public."Account"
    LANGUAGE sql STABLE
    AS $$
SELECT *
FROM accounts_that_claim_about_account( address, 23, 1);
$$;
