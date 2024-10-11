CREATE OR REPLACE FUNCTION public.accounts_that_claim_about_account (address text, subject numeric(78, 0), predicate numeric(78, 0))
			RETURNS SETOF "Account"
			LANGUAGE sql
			STABLE
			AS $function$
	SELECT
		"public"."Account".*
	FROM
		"public"."Claim"
		JOIN "public"."Account" ON "public"."Account"."atomId" = "public"."Claim"."objectId"
	WHERE
		"public"."Claim"."subjectId" = subject
		AND "public"."Claim"."predicateId" = predicate
		AND "public"."Claim"."accountId" = "address";
$function$;

CREATE OR REPLACE FUNCTION public.following (address text)
	RETURNS SETOF "Account"
	LANGUAGE sql
	STABLE
	AS $function$
	SELECT
		*
	FROM
		accounts_that_claim_about_account (address,
			23,
			1);
$function$;

CREATE OR REPLACE FUNCTION public.claims_from_following (address text)
	RETURNS SETOF "Claim"
	LANGUAGE sql
	STABLE
	AS $function$
	SELECT
		*
	FROM "public"."Claim"
        WHERE "public"."Claim"."accountId" IN (SELECT "id" FROM following(address));
$function$;
