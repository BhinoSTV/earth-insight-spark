from rest_framework.routers import DefaultRouter

from .views import LayerUploadViewSet, NewsItemViewSet, ServiceViewSet, TeamMemberViewSet

app_name = "content"

router = DefaultRouter()
router.register(r"news", NewsItemViewSet, basename="news")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"team", TeamMemberViewSet, basename="team")
router.register(r"layers", LayerUploadViewSet, basename="layer")

urlpatterns = router.urls
