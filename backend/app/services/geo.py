"""Helpers for converting between (lat, lng) pairs and PostGIS geography values.

Geography columns store points as WKB internally; geoalchemy2 exposes them as
WKBElement instances that need shapely to decode back into coordinates.
"""

from geoalchemy2.elements import WKBElement, WKTElement
from geoalchemy2.shape import to_shape


def make_point(lat: float, lng: float) -> WKTElement:
    """PostGIS/geography expects (lng, lat) ordinate order."""
    return WKTElement(f"POINT({lng} {lat})", srid=4326)


def point_to_latlng(point: WKBElement | None) -> tuple[float, float] | None:
    if point is None:
        return None
    shape = to_shape(point)
    return shape.y, shape.x  # (lat, lng)
