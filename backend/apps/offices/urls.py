from rest_framework.routers import DefaultRouter
from .views import OfficeViewSet

router = DefaultRouter()
router.register("", OfficeViewSet)

urlpatterns = router.urls