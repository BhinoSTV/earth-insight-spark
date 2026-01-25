from __future__ import annotations

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthenticationFlowTests(APITestCase):
    def setUp(self) -> None:
        self.register_url = reverse("accounts:register")
        self.login_url = reverse("accounts:login")
        self.me_url = reverse("accounts:me")
        self.refresh_url = reverse("accounts:token_refresh")

    def test_user_registration_creates_account(self) -> None:
        response = self.client.post(
            self.register_url,
            {
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "StrongPass123",
                "password_confirm": "StrongPass123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(username="newuser").exists())

    def test_login_returns_tokens(self) -> None:
        User.objects.create_user(username="tester", email="tester@example.com", password="Password123")
        response = self.client.post(
            self.login_url,
            {"username": "tester", "password": "Password123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_with_email(self) -> None:
        User.objects.create_user(username="tester2", email="tester2@example.com", password="Password123")
        response = self.client.post(
            self.login_url,
            {"email": "tester2@example.com", "password": "Password123"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_profile_requires_authentication(self) -> None:
        user = User.objects.create_user(username="profileuser", email="profile@example.com", password="Password123")
        login = self.client.post(
            self.login_url,
            {"username": "profileuser", "password": "Password123"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        access = login.data["access"]
        unauthenticated_response = self.client.get(self.me_url)
        self.assertEqual(unauthenticated_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], user.username)

    def test_token_refresh_returns_new_access_token(self) -> None:
        User.objects.create_user(username="refresher", email="refresh@example.com", password="Password123")
        login = self.client.post(
            self.login_url,
            {"username": "refresher", "password": "Password123"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        refresh = login.data["refresh"]
        response = self.client.post(self.refresh_url, {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
