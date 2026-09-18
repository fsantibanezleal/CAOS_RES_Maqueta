# Guide 02, bring your own area: add a place

Maqueta is applied to new data by adding a place: any area of interest the open sources cover.

1. **Register it** in `data-pipeline/maquetalab/places.py`:

   ```python
   Place("my_town", "My Town", "B", -70.60, -33.40, 1200, "South America", "Chile", "My Town",
         "why this place; what to look for"),
   ```

   The fields are slug, display name, tier, longitude, latitude, half-size in metres (the area is a square
   twice that size), continent, country, city and a note. Tier C skips the building and road fetch;
   choose A only where open LoD2 or lidar exists.
2. **Bake it**: `./scripts/precompute.sh my_town --fetched <today>` ([guide 01](01_precompute-pipeline.md)).
   The index then lists it next to the existing places.
3. **Sub-areas**: if it has buildings and its country is in `gen_admin.ISO3`, run
   `python -m maquetalab.gen_admin` to add its `admin.json`.
4. **Check**: `./scripts/smoke.sh` and `pytest`. `test_registry_matches_baked_index` fails until the place
   is both registered and baked, so neither half can be committed alone.
5. **Commit** `places.py` together with `data/derived/my_town/`, `index.json` and `benchmark.json`.

The app picks the place up from the index; no frontend change is needed.
