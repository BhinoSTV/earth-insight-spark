from __future__ import annotations

import io
import json
import shutil
import tempfile
import zipfile
from pathlib import Path

import shapefile
from unittest import mock

import numpy as np
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from .ahp import AHPResult
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

    def _build_shapefile_archive(self) -> bytes:
        tmpdir = Path(tempfile.mkdtemp(prefix="ahp-shapefile-"))
        try:
            base_path = tmpdir / "sample"
            writer = shapefile.Writer(str(base_path))
            writer.field("Name", "C")
            writer.record("Feature 1")
            writer.poly([[[0, 0], [0, 1], [1, 1], [0, 0]]])
            writer.close()

            # Minimal WGS84 projection definition for compatibility with most viewers.
            prj_path = base_path.with_suffix(".prj")
            prj_path.write_text(
                "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433]]",
                encoding="utf-8",
            )

            archive = io.BytesIO()
            with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
                for ext in (".shp", ".shx", ".dbf", ".prj"):
                    file_path = base_path.with_suffix(ext)
                    if file_path.exists():
                        zf.write(file_path, arcname=file_path.name)
            archive.seek(0)
            return archive.read()
        finally:
            shutil.rmtree(tmpdir, ignore_errors=True)

    def _build_raster_archive(self) -> bytes:
        archive = io.BytesIO()
        with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("sample.tif", b"dummy raster data")
        archive.seek(0)
        return archive.read()

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

    def test_vector_archive_generates_geojson(self) -> None:
        archive = self._build_shapefile_archive()
        upload = LayerUpload.objects.create(
            name="Vector Layer",
            layer_type=LayerType.VECTOR,
            source_archive=SimpleUploadedFile("vector.zip", archive, content_type="application/zip"),
        )

        self.assertTrue(upload.geojson_file.name.endswith(".geojson"))
        with upload.geojson_file.open("rb") as fh:
            payload = json.load(fh)

        self.assertEqual(payload["type"], "FeatureCollection")
        self.assertEqual(len(payload["features"]), 1)
        self.assertEqual(payload["features"][0]["properties"]["Name"], "Feature 1")

    def test_raster_archive_extracts_geotiff(self) -> None:
        archive = self._build_raster_archive()
        upload = LayerUpload.objects.create(
            name="Raster Layer",
            layer_type=LayerType.RASTER,
            source_archive=SimpleUploadedFile("raster.zip", archive, content_type="application/zip"),
        )

        self.assertTrue(upload.raster_file.name.endswith(".tif"))
        with upload.raster_file.open("rb") as fh:
            self.assertEqual(fh.read(), b"dummy raster data")


class AHPComputeAPITests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="tester",
            email="tester@example.com",
            password="password123",
        )

    def _build_payload(self) -> dict:
        return {
            "criteria_names": ["Cost", "Quality", "Speed"],
            "bounds": [
                {"left_index": 0, "right_index": 1, "min": 1, "max": 3},
                {"left_index": 0, "right_index": 2, "min": 2, "max": 4},
                {"left_index": 1, "right_index": 2, "min": 1, "max": 5},
            ],
        }

    def test_requires_authentication(self) -> None:
        response = self.client.post(reverse("content:ahp-compute"), self._build_payload(), format="json")
        self.assertEqual(response.status_code, 401)

    def test_rejects_incomplete_bounds(self) -> None:
        self.client.force_authenticate(self.user)
        payload = self._build_payload()
        payload["bounds"] = payload["bounds"][:-1]

        response = self.client.post(reverse("content:ahp-compute"), payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("pairwise", str(response.data["non_field_errors"]).lower())

    def test_returns_computed_results(self) -> None:
        self.client.force_authenticate(self.user)

        matrix = np.array([[1.0, 2.0, 4.0], [0.5, 1.0, 3.0], [0.25, 1 / 3, 1.0]])
        result = AHPResult(matrix=matrix, consistency_ratio=0.05, weights=np.array([0.6, 0.3, 0.1]))

        with mock.patch("content.views.run_adaptive_ahp", return_value=([result], [result], 0.256)):
            response = self.client.post(reverse("content:ahp-compute"), self._build_payload(), format="json")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["criteria_names"], ["Cost", "Quality", "Speed"])
        self.assertEqual(body["valid_samples"], 1)
        self.assertEqual(body["total_samples"], 1)
        self.assertAlmostEqual(body["average_cr"], 0.05, places=4)
        self.assertEqual(len(body["average_weights"]), 3)
        self.assertEqual(len(body["valid_results"]), 1)
