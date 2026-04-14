# private/products/

Binary product assets served by `/api/products/downloads/[purchaseId]`.
These files live OUTSIDE `public/` and can only be accessed through the
download route handler, which verifies the requesting user owns a matching
`purchases` row.

Filenames are referenced from `src/content/products/*.mdx` via the
`assetFilename` field and resolved under this directory by
`src/app/api/products/downloads/[purchaseId]/route.ts`.

## Shipping real product content

1. Build the real product zip (or tar.gz) somewhere outside the repo.
2. Copy it into this directory with the canonical filename.
3. Update the matching `src/content/products/{slug}.mdx` `meta.assetFilename`
   if the filename changed.
4. Commit the new file. The placeholder stubs currently committed are ~200
   bytes — real product files may be large; check `git lfs` or revisit the
   strategy if a single asset exceeds a few MB.

Real product content decisions (license terms, pricing) are out of scope
for the `storefront-auth` job.
