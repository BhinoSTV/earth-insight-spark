from rest_framework.routers import DefaultRouter

from .views import NewsItemViewSet, ServiceViewSet, TeamMemberViewSet

app_name = "content"

router = DefaultRouter()
router.register(r"news", NewsItemViewSet, basename="news")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"team", TeamMemberViewSet, basename="team")

urlpatterns = router.urls
