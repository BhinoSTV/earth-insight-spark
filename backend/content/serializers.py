from __future__ import annotations

from rest_framework import serializers

from .models import LayerUpload, NewsItem, Service, TeamMember


class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = [
            "id",
            "title",
            "description",
            "category",
            "hero_image_url",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "description", "order", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = [
            "id",
            "full_name",
            "role",
            "bio",
            "photo_url",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LayerUploadSerializer(serializers.ModelSerializer):
    geojson_file = serializers.SerializerMethodField()
    raster_file = serializers.SerializerMethodField()
    geojson_url = serializers.SerializerMethodField()
    raster_url = serializers.SerializerMethodField()

    class Meta:
        model = LayerUpload
        fields = [
            "id",
            "name",
            "layer_type",
            "description",
            "source_archive",
            "geojson_file",
            "geojson_url",
            "raster_file",
            "raster_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = (
            "id",
            "name",
            "layer_type",
            "description",
            "source_archive",
            "geojson_file",
            "geojson_url",
            "raster_file",
            "raster_url",
            "created_at",
            "updated_at",
        )

    def _build_url(self, file_field) -> str | None:
        if not file_field:
            return None

        request = self.context.get("request") if isinstance(self.context, dict) else None
        url = file_field.url
        if request is not None:
            return request.build_absolute_uri(url)
        return url

    def get_geojson_file(self, obj: LayerUpload) -> str | None:
        return self._build_url(obj.geojson_file)

    def get_raster_file(self, obj: LayerUpload) -> str | None:
        return self._build_url(obj.raster_file)

    def get_geojson_url(self, obj: LayerUpload) -> str | None:
        return self.get_geojson_file(obj)

    def get_raster_url(self, obj: LayerUpload) -> str | None:
        return self.get_raster_file(obj)
