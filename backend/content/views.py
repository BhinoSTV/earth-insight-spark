from __future__ import annotations

from rest_framework import permissions, viewsets

from .models import LayerUpload, NewsItem, Service, TeamMember
from .serializers import (
    LayerUploadSerializer,
    NewsItemSerializer,
    ServiceSerializer,
    TeamMemberSerializer,
)


class NewsItemViewSet(viewsets.ModelViewSet):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class TeamMemberViewSet(viewsets.ModelViewSet):
    queryset = TeamMember.objects.all()
    serializer_class = TeamMemberSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class LayerUploadViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LayerUpload.objects.all()
    serializer_class = LayerUploadSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
