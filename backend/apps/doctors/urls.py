from rest_framework.routers import DefaultRouter

from .views import DoctorViewSet

router = DefaultRouter()

router.register("", DoctorViewSet, basename="doctors")

urlpatterns = router.urls