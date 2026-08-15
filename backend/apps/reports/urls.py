from django.urls import path
from .dashboard import DashboardView
from .report import ReportView
from .views import TodayAppointmentsView

urlpatterns = [

    path(
        "dashboard/",
        DashboardView.as_view()
    ),

    path(
        "today/",
        TodayAppointmentsView.as_view()
    ),

    path(
        "summary/",
        ReportView.as_view()
    ),

]