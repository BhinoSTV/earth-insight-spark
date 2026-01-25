from __future__ import annotations

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "email", "username"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "email": {"required": True},
        }

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})

        email = attrs.get("email")
        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})

        username = attrs.get("username")
        if username and User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})

        user = User(**{k: attrs.get(k) for k in ["username", "email", "first_name", "last_name"]})
        try:
            validate_password(attrs["password"], user)
        except exceptions.ValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})
        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password_confirm", None)
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)
