from django.apps import AppConfig


class ContentConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "content"
    # Preserve historical app label used by earlier deployments so migrations
    # generated under ``spada_content`` continue to resolve correctly.
    label = "spada_content"
