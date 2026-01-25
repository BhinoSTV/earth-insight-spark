from django.contrib import admin

from django.utils.html import format_html

from .models import LayerUpload, NewsItem, Service, TeamMember


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


@admin.register(LayerUpload)
class LayerUploadAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "layer_type",
        "created_at",
        "geojson_link",
        "raster_link",
    )
    list_filter = ("layer_type",)
    search_fields = ("name", "description")
    readonly_fields = ("created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("name", "layer_type", "description")}),
        (
            "Files",
            {
                "fields": (
                    "source_archive",
                    "geojson_file",
                    "raster_file",
                )
            },
        ),
        ("Metadata", {"fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="GeoJSON")
    def geojson_link(self, obj: LayerUpload) -> str:
        if not obj.geojson_file:
            return "—"
        return format_html('<a href="{}" target="_blank">GeoJSON</a>', obj.geojson_file.url)

    @admin.display(description="Raster")
    def raster_link(self, obj: LayerUpload) -> str:
        if not obj.raster_file:
            return "—"
        return format_html('<a href="{}" target="_blank">Raster</a>', obj.raster_file.url)
