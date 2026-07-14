"""Chilean comuna indicators from the Data Observatory (Atalaya) local mirror, for sub-area choropleths.

Atalaya mirrors the Chilean Data Observatory (datos.gob.cl) to ``E:\\_Datos\\atalaya``. Many of its datasets
are comuna-keyed, so they can be joined to the geoBoundaries comuna polygons Maqueta already uses for
sub-area aggregation and rendered as a choropleth over the Santiago cases. This module reduces a few of those
datasets to one scalar per comuna and exposes ``indicators_for(comuna_name)`` keyed by a stable indicator id,
so :mod:`maquetalab.gen_admin` can attach them per admin unit (alongside the solar/climate environment).

Indicators (each a real DO dataset, honestly labelled, no fabrication):

  * ``health_facilities``  count of currently-operating health establishments (MINSAL, 2025 snapshot).
  * ``foreign_pop``        estimated foreign-born residents (INE/DEM registry estimate, latest year).
  * ``schools``            count of official education establishments (MINEDUC directory, 2012 snapshot).

The join is by comuna NAME, accent- and case-normalised (geoBoundaries carries the name, not the CUT code);
comunas that do not match are simply absent for that indicator. If the Atalaya mirror is not present (e.g. a
CI machine without ``E:``), the maps load empty and callers get ``{}`` - never an error.
"""

from __future__ import annotations

import unicodedata
from pathlib import Path

ATALAYA = Path(r"E:\_Datos\atalaya\derived")

# indicator id -> (english label, unit) for the frontend registry.
INDICATOR_META: dict[str, tuple[str, str]] = {
    "health_facilities": ("Health facilities", "count"),
    "foreign_pop": ("Foreign-born residents", "people"),
    "schools": ("Schools", "count"),
}


def _norm(name: object) -> str:
    """Accent/case/space-normalise a comuna name so DO names match geoBoundaries shapeNames."""
    s = unicodedata.normalize("NFKD", str(name)).encode("ascii", "ignore").decode("ascii")
    return " ".join(s.upper().split())


def _load_health() -> dict[str, float]:
    f = ATALAYA / "establecimientos-de-salud-vigentes" / "establecimientos_20250826.parquet"
    if not f.exists():
        return {}
    try:
        import pandas as pd

        df = pd.read_parquet(f, columns=["ComunaGlosa"])
        counts = df["ComunaGlosa"].map(_norm).value_counts()
        return {k: float(v) for k, v in counts.items() if k and k != "NAN"}
    except Exception:
        return {}


def _load_foreign_pop() -> dict[str, float]:
    f = ATALAYA / "estimacion-de-poblacion-extranjera-en-chile" / "base-2022-comunas.parquet"
    if not f.exists():
        return {}
    try:
        import pandas as pd

        df = pd.read_parquet(f)
        yearcol = next((c for c in df.columns if "ESTIMACION" in c.upper() and "A" in c.upper()[:2]), None)
        if yearcol is not None:
            df = df[df[yearcol] == df[yearcol].max()]  # latest estimation year only
        g = df.groupby(df["COMUNA"].map(_norm))["ESTIMACION"].sum()
        return {k: float(v) for k, v in g.items() if k and k not in ("NAN", "OTRAS COMUNAS")}
    except Exception:
        return {}


def _load_schools() -> dict[str, float]:
    import glob

    fs = sorted(glob.glob(str(ATALAYA / "establecimientos-educacionales" / "Directorio_oficial_EE_*.parquet")))
    if not fs:
        return {}
    try:
        import pandas as pd

        df = pd.read_parquet(fs[-1], columns=["nom_com_rbd"])  # latest available directory year
        counts = df["nom_com_rbd"].map(_norm).value_counts()
        return {k: float(v) for k, v in counts.items() if k and k != "NAN"}
    except Exception:
        return {}


_MAPS: dict[str, dict[str, float]] | None = None


def _maps() -> dict[str, dict[str, float]]:
    global _MAPS
    if _MAPS is None:
        _MAPS = {
            "health_facilities": _load_health(),
            "foreign_pop": _load_foreign_pop(),
            "schools": _load_schools(),
        }
    return _MAPS


def indicators_for(comuna_name: str) -> dict[str, float]:
    """DO indicator values for a comuna, keyed by indicator id; absent keys mean no match/data."""
    key = _norm(comuna_name)
    out: dict[str, float] = {}
    for ind, m in _maps().items():
        if key in m:
            out[ind] = m[key]  # value for this comuna
    return out
