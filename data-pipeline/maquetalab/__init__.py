"""maquetalab: Maqueta's offline pipeline.

Wraps the `geoscena` fusion/meshing core to bake each curated Place into a committed
SceneBundle (per-layer .glb + manifest) that the static web app replays. The pipeline is
the product; the web app is a read-only projection of these audited bundles (ADR-0057).
"""

__version__ = "0.01.000"  # display X.XX.XXX; PEP 440 form in pyproject.toml (0.1.0)
