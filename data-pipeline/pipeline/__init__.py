"""Maqueta's offline pipeline code: plain modules run by data-pipeline/run.py, never installed as a package.

It wraps the `geoscena` fusion/meshing core to bake each curated place into a committed SceneBundle
(per-layer .glb + manifest) that the static web app replays; the web app is a read-only projection of these
audited bundles (ADR-0057).
"""
