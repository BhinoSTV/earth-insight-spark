from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AHPComputeView,
    LayerUploadViewSet,
    NewsItemViewSet,
    ServiceViewSet,
    TeamMemberViewSet,
)

app_name = "content"

router = DefaultRouter()
router.register(r"news", NewsItemViewSet, basename="news")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"team", TeamMemberViewSet, basename="team")
router.register(r"layers", LayerUploadViewSet, basename="layer")

urlpatterns = [
    path("ahp/compute/", AHPComputeView.as_view(), name="ahp-compute"),
]

urlpatterns += router.urls
