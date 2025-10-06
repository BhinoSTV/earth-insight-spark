# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a40c2c79-6045-4997-89a2-4d6d90054935

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a40c2c79-6045-4997-89a2-4d6d90054935) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend API (Django)

The repository now includes a Django REST API in the `backend/` directory. It exposes authentication endpoints (`/api/auth/`) and dynamic content endpoints (`/api/news/`, `/api/services/`, `/api/team/`) that can be consumed by the React frontend.

### Prerequisites

- Python 3.11+
- (Optional) SQLite (bundled with Python)

### Environment variables

Create a `.env` file in `backend/` (or export variables in your shell) with values tailored to your deployment:

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Overrides the default development secret key. |
| `DJANGO_DEBUG` | Set to `False` in production. |
| `DATABASE_URL` | Use with `dj-database-url` or configure `DATABASES` manually for PostgreSQL/MySQL. |
| `ALLOWED_HOSTS` | Comma-separated hostnames allowed to access the app. |
| `CORS_ALLOWED_ORIGINS` | Override default origins (defaults include the Vite dev server). |

Update `core/settings.py` or use environment variables in production as needed.

### Setup

```bash
cd backend

# 1. Create & activate the virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Apply database migrations
python manage.py makemigrations
python manage.py migrate

# 4. (Optional) Create a superuser for admin access
python manage.py createsuperuser

# 5. Run the development server
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/` and supports JWT authentication using `rest_framework_simplejwt`.

### Seeding initial content

You can seed sample news, services, and team members using the Django shell:

```bash
python manage.py shell <<'PY'
from content.models import NewsItem, Service, TeamMember
from django.utils import timezone

NewsItem.objects.get_or_create(
    title="Launch Announcement",
    defaults=dict(
        description="We have launched the Earth Insight backend!",
        category="Announcements",
        hero_image_url="https://example.com/launch.jpg",
        published_at=timezone.now(),
    ),
)

Service.objects.get_or_create(
    name="Geospatial Analysis",
    defaults=dict(description="Advanced analytics for environmental data.", order=1),
)

TeamMember.objects.get_or_create(
    full_name="Jordan Rivers",
    defaults=dict(role="Lead Scientist", order=1),
)
PY
```

Alternatively, manage content through the Django admin at `/admin/` once you create a superuser.

### Geo-HISS layer uploads

The Geo-HISS dashboard tab consumes dynamic layer metadata from the Django admin:

1. Sign in to the admin (`/admin/`) and open **Spada App → Layer uploads**.
2. Add a new layer with a unique name, select whether it is a vector or raster dataset, and upload the relevant files:
   - Optional source archive (for example, the original zipped shapefile).
   - Converted GeoJSON output for vector data.
   - Raster output (for example, GeoTIFF) for raster layers.
3. Save the record. The frontend will automatically load entries from `/api/layers/` and expose download links for the uploaded assets alongside the interactive map.

Layer metadata is readable without authentication, while create/update actions remain gated behind the admin to prevent unauthorized uploads.

### Choosing between one app or multiple Django apps

It is technically possible to collapse everything into a single Django app (for example, placing authentication and content models inside one `spada` app). Django does not require multiple apps, and very small projects sometimes do this for convenience. However, keeping separate apps such as `accounts` and `content` generally scales better:

- **Separation of concerns.** Authentication code changes at a different cadence than content management. Splitting apps keeps migrations, serializers, and tests focused, which reduces coupling and makes refactors easier.
- **Pluggability.** A standalone `accounts` app can be reused in other projects or extracted to a package, while a `content` app can evolve with its own admin and API surface.
- **Team workflows.** Different contributors can own different apps without stepping on each other’s migrations or fixtures. Issue tracking and code review stay tighter when domains are isolated.
- **Testing and dependencies.** App-level tests run faster and remain more descriptive when they target a single domain. If one app eventually requires optional dependencies, they can be added without affecting the rest of the project.

For prototypes or minimal deployments you can start with one app and split later, but doing the separation up front avoids a large refactor once the codebase grows. Keeping the lightweight `accounts` and `content` apps distinct is the recommended approach for this project.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a40c2c79-6045-4997-89a2-4d6d90054935) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
