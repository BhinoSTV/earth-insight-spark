from __future__ import annotations

from django.db import models


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
