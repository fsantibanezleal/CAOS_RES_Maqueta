# Fusing open geospatial data: notes from building Maqueta

Plain documentation post for LinkedIn (English). Tone: first person, documenting the work, not selling.
Persisted here as the canonical copy. Live product: https://maqueta.ml.fasl-work.com

---

A few weeks ago I was going through Atalaya, a small explorer I built over the Data Observatory catalog, evaluating dataset after dataset from many different sources.

One thing kept coming back. A lot of these variables are published separately, by different institutions, in different formats, but many of them describe the same ground. So I started wondering whether they share content, and specifically whether they share it spatially. If two layers cover the same place, you should be able to put them on the same map and see how they relate.

That led to a simpler question: how much free, public data with spatial information is actually out there? Quite a lot, as it turns out. Satellite land cover (ESA WorldCover), elevation (Copernicus GLO-30), population grids (GHS-POP), building footprints and roads (Overture Maps, OpenStreetMap), modeled building heights (Google Open Buildings), authoritative open 3D city models (3DBAG), soil properties (SoilGrids). Most of it is global, or at least covers Chile and Latin America, and most of it is permissively licensed.

And once the layers are aligned on the same ground, what can you actually evaluate? Vegetation and greenness by area. Soil by area. The distribution of building footprint area, or of building height, across a neighborhood. How land use splits between residential, commercial and industrial inside a boundary you care about. Vegetation or built cover by comuna. These are all questions about the same square kilometer seen through different sensors and registries.

To look at any of this I first needed a base: something that fuses the layers onto one geometry and lets me summarize sub-areas. So I built Maqueta.

Maqueta takes a real area and reconstructs it in 3D from open public geodata, with the height map as the entry point. It fuses Overture buildings and roads, Copernicus GLO-30 terrain, ESA WorldCover land cover, OpenStreetMap water, green and rail, GHS-POP population, Google Open Buildings 2.5D heights, 3DBAG LoD2 as an authoritative ground-truth overlay, and SoilGrids soil carbon. Every layer keeps its source and license visible, and every building height carries its provenance: measured, inferred from floor count, read from a height raster, or a default prior. It currently has 78 places baked, including Santiago split into its 37 comunas as separate cases (it opens on Providencia).

On top of the map you can colour and filter the buildings by any fused attribute (height, floors, footprint area, function, land cover, height provenance), click a building to read all of its fused attributes, and toggle each source layer on and off to see what each one contributes.

The part that answers the original question is the area tool. Draw a polygon over any sub-area, a barrio, a block, a corridor, or take a whole comuna, and it summarizes the buildings inside: count, total footprint area, built cover, density, a height distribution, mean and median height, floor counts, and the function, land-cover and height-provenance mix. So building area and height distribution by area, which is what I wanted to look at in the first place, come out directly, and you can compare one comuna against another by drawing on each.

It is a base for a side project, built on open data and open source. If any of these layers or questions are useful to you, the whole thing is live and open.

Live: https://maqueta.ml.fasl-work.com
