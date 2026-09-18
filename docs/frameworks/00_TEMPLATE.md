# Framework card, `<tool>` (TEMPLATE)

Copy to `docs/frameworks/<NN>_<tool>/<tool>.md` for **every** research-chosen engine/library. The deep research is
**binding**: each engine used by the pipeline gets a card here AND an exact pin in the requirements or lock file
that installs it (`data-pipeline/requirements.txt`, `frontend/package-lock.json`,
`data-pipeline/tools/package-lock.json`). No toy substitute for a SOTA engine the research prescribed.

## What & why
What it is; why it was chosen over the alternatives (cite the research).

## Install (exact, verified)
The exact version + install steps you verified; note OS constraints (e.g. Linux/WSL only). Pin it in the matching
`requirements-*.txt`.

## Usage
A minimal runnable snippet.

## Applying it here
Which pipeline step or app feature uses it, its inputs/outputs, and which contract it satisfies.

## Caveats / license
Numerical caveats, performance, and redistribution terms.
