from __future__ import annotations

import io
import json
import logging
import os
import tempfile
import zipfile
from typing import Tuple

import shapefile
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import models
from django.utils.text import slugify


class LayerType(models.TextChoices):
    VECTOR = "vector", "Vector"
    RASTER = "raster", "Raster"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class NewsItem(TimeStampedModel):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    hero_image_url = models.URLField(blank=True)
    published_at = models.DateTimeField()

    class Meta:
        ordering = ["-published_at", "-created_at"]

    def __str__(self) -> str:
        return self.title


class Service(TimeStampedModel):
    name = models.CharField(max_length=150)
    description = models.TextField()
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self) -> str:
        return self.name


class TeamMember(TimeStampedModel):
    full_name = models.CharField(max_length=150)
    role = models.CharField(max_length=150)
    bio = models.TextField(blank=True)
    photo_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "full_name"]

    def __str__(self) -> str:
        return self.full_name


class LayerUpload(TimeStampedModel):
    name = models.CharField(max_length=255, unique=True)
    layer_type = models.CharField(max_length=20, choices=LayerType.choices)
    description = models.TextField(blank=True)
    source_archive = models.FileField(
        blank=True,
        null=True,
        upload_to="layers/source/",
        help_text="Optional original archive such as a zipped shapefile.",
    )
    geojson_file = models.FileField(
        blank=True,
        null=True,
        upload_to="layers/geojson/",
        help_text="Converted GeoJSON representation for vector layers.",
    )
    raster_file = models.FileField(
        blank=True,
        null=True,
        upload_to="layers/raster/",
        help_text="Rendered raster output (e.g., GeoTIFF) for raster layers.",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    @property
    def has_vector_data(self) -> bool:
        return bool(self.geojson_file)

    @property
    def has_raster_data(self) -> bool:
        return bool(self.raster_file)

    def save(self, *args, **kwargs):  # type: ignore[override]
        """Persist the layer and derive converted artefacts from source uploads.

        When an archive containing a shapefile (vector) or GeoTIFF (raster)
        is provided we automatically unpack and attach a GeoJSON / raster
        representation so the Geo-HISS frontend can fetch the converted assets
        directly from storage.
        """

        logger = logging.getLogger(__name__)
        source_data: bytes | None = None

        if self.source_archive:
            source_data = self._read_source_archive()

        convert_vector = self.layer_type == LayerType.VECTOR and source_data
        convert_raster = self.layer_type == LayerType.RASTER and source_data

        geojson_payload: bytes | None = None
        raster_payload: Tuple[str, bytes] | None = None

        if convert_vector and source_data:
            try:
                geojson_payload = self._convert_shapefile_zip_to_geojson(source_data)
            except ValidationError:
                raise
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception("Failed to convert shapefile to GeoJSON", exc_info=exc)
                raise ValidationError("Unable to convert shapefile to GeoJSON. Check the archive contents.")

        if convert_raster and source_data:
            try:
                raster_payload = self._extract_raster_from_archive(source_data)
            except ValidationError:
                raise
            except Exception as exc:  # pragma: no cover - defensive logging
                logger.exception("Failed to extract raster from archive", exc_info=exc)
                raise ValidationError("Unable to extract raster from the uploaded archive.")

        super().save(*args, **kwargs)

        updated_fields: list[str] = []

        if geojson_payload:
            filename = f"{slugify(self.name) or 'layer'}-data.geojson"
            self.geojson_file.save(filename, ContentFile(geojson_payload), save=False)
            updated_fields.append("geojson_file")

        if raster_payload:
            filename, payload = raster_payload
            self.raster_file.save(filename, ContentFile(payload), save=False)
            updated_fields.append("raster_file")

        if updated_fields:
            updated_fields.append("updated_at")
            super().save(update_fields=updated_fields)

    def _read_source_archive(self) -> bytes:
        """Read the uploaded archive into memory while preserving the file pointer."""

        field_file = self.source_archive
        if field_file is None:
            raise ValidationError("No source archive provided for conversion.")

        try:
            field_file.open("rb")  # type: ignore[call-arg]
        except Exception:
            pass

        data = field_file.read()
        field_file.seek(0)
        return data

    def _convert_shapefile_zip_to_geojson(self, archive_bytes: bytes) -> bytes:
        """Produce a GeoJSON FeatureCollection from a zipped ESRI Shapefile."""

        with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
            shapefile_members = [name for name in zf.namelist() if name.lower().endswith(".shp")]
            if not shapefile_members:
                raise ValidationError("The uploaded archive does not contain a .shp file.")

            shapefile_name = shapefile_members[0]

            with tempfile.TemporaryDirectory() as tmpdir:
                zf.extractall(tmpdir)
                shp_path = os.path.join(tmpdir, shapefile_name)
                reader = shapefile.Reader(shp_path)

                fields = [field[0] for field in reader.fields[1:]]
                features = []

                for shaperec in reader.iterShapeRecords():
                    geometry = shaperec.shape.__geo_interface__
                    properties = dict(zip(fields, shaperec.record))
                    features.append(
                        {
                            "type": "Feature",
                            "geometry": geometry,
                            "properties": properties,
                        }
                    )

        feature_collection = {
            "type": "FeatureCollection",
            "features": features,
        }
        return json.dumps(feature_collection, ensure_ascii=False).encode("utf-8")

    def _extract_raster_from_archive(self, archive_bytes: bytes) -> Tuple[str, bytes]:
        """Extract the first GeoTIFF from the archive for raster layers."""

        with zipfile.ZipFile(io.BytesIO(archive_bytes)) as zf:
            raster_members = [name for name in zf.namelist() if name.lower().endswith((".tif", ".tiff"))]
            if not raster_members:
                raise ValidationError("The uploaded archive does not contain a GeoTIFF file.")

            raster_name = raster_members[0]
            payload = zf.read(raster_name)

        filename = os.path.basename(raster_name)
        return filename, payload
