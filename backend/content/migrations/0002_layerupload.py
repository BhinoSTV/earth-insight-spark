# Generated manually: introduce LayerUpload model for Geo-HISS datasets
from __future__ import annotations

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LayerUpload",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255, unique=True)),
                (
                    "layer_type",
                    models.CharField(
                        choices=[("vector", "Vector"), ("raster", "Raster")], max_length=20
                    ),
                ),
                ("description", models.TextField(blank=True)),
                (
                    "source_archive",
                    models.FileField(
                        blank=True,
                        help_text="Optional original archive such as a zipped shapefile.",
                        null=True,
                        upload_to="layers/source/",
                    ),
                ),
                (
                    "geojson_file",
                    models.FileField(
                        blank=True,
                        help_text="Converted GeoJSON representation for vector layers.",
                        null=True,
                        upload_to="layers/geojson/",
                    ),
                ),
                (
                    "raster_file",
                    models.FileField(
                        blank=True,
                        help_text="Rendered raster output (e.g., GeoTIFF) for raster layers.",
                        null=True,
                        upload_to="layers/raster/",
                    ),
                ),
            ],
            options={"ordering": ["name"]},
        ),
    ]
