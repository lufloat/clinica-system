from rest_framework.routers import DefaultRouter

from .views import DentalChartViewSet, ToothRecordViewSet

router = DefaultRouter()
router.register("charts", DentalChartViewSet, basename="dental-charts")
router.register("tooth-records", ToothRecordViewSet, basename="tooth-records")

urlpatterns = router.urls
