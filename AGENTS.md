# Repository Instructions

## Vercel Preview Builds

- Don't forget to trigger preview build on vercel if needed, the automated trigger has been turn off. Use your judgement if that's absolutely necessary, most of time not.

## Documentation Maintenance

- For any project folder in the tracked source tree that has `5` or more files, maintain a `README.md` in that folder.
- When updating any file, also review and update the related folder `README.md` if the change affects usage, structure, responsibilities, behavior, or data flow.
- Also review parent-folder `README.md` files and update them when the change affects their documented overview or navigation.
- For folders with fewer than `3` files, prefer not to keep a standalone `README.md`. Move the relevant introductory or usage notes into the files themselves when practical.
- Apply these rules to the project’s maintained source/documentation folders such as `app/`, `components/`, `config/`, `docs/`, and `lib/`.
- Do not treat generated or vendor folders such as `.git/`, `.next/`, or `node_modules/` as requiring `README.md` maintenance under this rule.
