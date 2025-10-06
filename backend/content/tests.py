from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .models import LayerType, LayerUpload


class LayerUploadAPITests(TestCase):
    def setUp(self) -> None:
        self.temp_media_dir = Path(tempfile.mkdtemp(prefix="layers-test-media-"))
        override = override_settings(MEDIA_ROOT=self.temp_media_dir)
        override.enable()
        self.addCleanup(override.disable)
        self.addCleanup(lambda: shutil.rmtree(self.temp_media_dir, ignore_errors=True))

        self.client = APIClient()

    def _create_geojson_file(self, name: str) -> SimpleUploadedFile:
        payload = {
            "type": "FeatureCollection",
            "features": [],
        }
        return SimpleUploadedFile(
            name,
            json.dumps(payload).encode("utf-8"),
            content_type="application/geo+json",
        )

    def _create_raster_file(self, name: str) -> SimpleUploadedFile:
        # The raster viewer only needs the URL, so a small binary placeholder is sufficient here.
        return SimpleUploadedFile(name, b"Raster", content_type="image/tiff")

    def test_list_layers_exposes_absolute_urls(self) -> None:
        LayerUpload.objects.create(
            name="Groundwater Recharge",
            layer_type=LayerType.VECTOR,
            geojson_file=self._create_geojson_file("gw.geojson"),
        )
        LayerUpload.objects.create(
            name="Soil Moisture",
            layer_type=LayerType.RASTER,
            raster_file=self._create_raster_file("soil.tif"),
        )

        response = self.client.get(reverse("content:layer-list"))
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(len(data), 2)

        vector_entry = next(item for item in data if item["name"] == "Groundwater Recharge")
        self.assertEqual(vector_entry["layer_type"], LayerType.VECTOR)
        self.assertIsNotNone(vector_entry["geojson_file"])
        self.assertIsNotNone(vector_entry["geojson_url"])
        self.assertTrue(str(vector_entry["geojson_url"]).startswith("http://testserver"))
        self.assertIsNone(vector_entry["raster_url"])

        raster_entry = next(item for item in data if item["name"] == "Soil Moisture")
        self.assertEqual(raster_entry["layer_type"], LayerType.RASTER)
        self.assertIsNotNone(raster_entry["raster_file"])
        self.assertIsNotNone(raster_entry["raster_url"])
        self.assertTrue(str(raster_entry["raster_file"]).startswith("http://testserver"))
        self.assertIsNone(raster_entry["geojson_file"])
