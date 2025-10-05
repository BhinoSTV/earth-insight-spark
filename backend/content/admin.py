from django.contrib import admin

from .models import NewsItem, Service, TeamMember


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "published_at")
    search_fields = ("title", "category")
    list_filter = ("category",)
    ordering = ("-published_at",)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "order")
    ordering = ("order", "name")


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ("full_name", "role", "order")
    ordering = ("order", "full_name")
