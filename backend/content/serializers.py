from __future__ import annotations

from rest_framework import serializers

from .ahp import AHPBounds
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


class AHPBoundsSerializer(serializers.Serializer):
    left_index = serializers.IntegerField(min_value=0)
    right_index = serializers.IntegerField(min_value=0)
    min = serializers.FloatField()
    max = serializers.FloatField()

    def validate(self, attrs):
        left_index = attrs["left_index"]
        right_index = attrs["right_index"]
        min_value = attrs["min"]
        max_value = attrs["max"]

        if left_index == right_index:
            raise serializers.ValidationError("Criteria comparisons must involve two distinct indices.")

        if max_value < min_value:
            raise serializers.ValidationError("Maximum comparison weight must be greater than or equal to the minimum.")

        if min_value <= 0 or max_value <= 0:
            raise serializers.ValidationError("Comparison weights must be greater than zero.")

        return attrs


class AHPComputeSerializer(serializers.Serializer):
    criteria_names = serializers.ListField(
        child=serializers.CharField(max_length=255),
        min_length=2,
        allow_empty=False,
    )
    bounds = AHPBoundsSerializer(many=True)

    def validate(self, attrs):
        criteria_names = attrs["criteria_names"]
        bounds = attrs["bounds"]
        criteria_count = len(criteria_names)

        expected_pairs = criteria_count * (criteria_count - 1) // 2
        if len(bounds) != expected_pairs:
            raise serializers.ValidationError(
                "All pairwise bounds must be provided for the supplied criteria list."
            )

        seen_pairs: set[tuple[int, int]] = set()
        for entry in bounds:
            left_index = entry["left_index"]
            right_index = entry["right_index"]
            if left_index < 0 or right_index < 0:
                raise serializers.ValidationError("Criteria indices cannot be negative.")
            if left_index >= criteria_count or right_index >= criteria_count:
                raise serializers.ValidationError("Criteria indices exceed the available criteria names.")

            pair = (min(left_index, right_index), max(left_index, right_index))
            if pair in seen_pairs:
                raise serializers.ValidationError("Duplicate bounds detected for the same criteria pair.")
            seen_pairs.add(pair)

        return attrs

    def build_bounds(self) -> list[AHPBounds]:
        validated = self.validated_data
        bounds: list[AHPBounds] = []
        for entry in validated["bounds"]:
            bounds.append(
                AHPBounds(
                    left_index=min(entry["left_index"], entry["right_index"]),
                    right_index=max(entry["left_index"], entry["right_index"]),
                    min_value=float(entry["min"]),
                    max_value=float(entry["max"]),
                )
            )
        return bounds
