# Reflex MVP

Reflex MVP is a complete full-stack delivery management application with a Vanilla HTML/CSS/JS frontend and a Django REST Framework backend.

## Project Structure

```text
reflex_web/
    ├── index.html
    ├── css/style.css
    ├── js/
    │   ├── api.js
    │   └── auth.js
    ├── retailer/
    │   ├── dashboard.html
    │   └── js/retailer.js
    ├── dispatcher/
    │   ├── dashboard.html
    │   └── js/dispatcher.js
    └── rider/
        ├── dashboard.html
        └── js/rider.js

reflex_api/
    ├── manage.py
    ├── requirements.txt
    ├── .env
    ├── config/
    ├── users/
    └── deliveries/
```

## Backend Setup (Django + PostgreSQL)

1. Navigate to `reflex_api` directory.
2. The virtual environment is already created (`venv`) and dependencies are installed.
3. Open `reflex_api/.env` and provide your Neon PostgreSQL credentials.
    - Set `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`.
    - Alternatively, set `DATABASE_URL` with your full connection string.
4. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
5. Apply database migrations:
   ```bash
   python manage.py makemigrations users deliveries
   python manage.py migrate
   ```
6. (Optional) Run tests to verify the core logic:
   ```bash
   python manage.py test deliveries
   ```
7. Start the development server:
   ```bash
   python manage.py runserver
   ```
   The API will be available at `http://127.0.0.1:8000/api/`

## Frontend Setup

The frontend does not require any build tools (no Node.js/npm required).

1. Navigate to the `reflex_web` directory.
2. Serve the directory using any static file server. For example, using Python:
   ```bash
   python -m http.server 5500
   ```
3. Open `http://localhost:5500/index.html` in your browser.

## API Endpoints

- `POST /api/auth/login/` - Login and get Token.
- `POST /api/auth/logout/` - Logout.
- `GET /api/deliveries/` - Get deliveries based on role.
- `POST /api/deliveries/` - Create a delivery (Retailer only).
- `POST /api/deliveries/{id}/assign/` - Assign a rider (Dispatcher only).
- `PATCH /api/deliveries/{id}/status/` - Update status (Rider only).
- `GET /api/riders/` - List all riders (Dispatcher only).

## Initial Workflow Testing

1. Create three users in the database with roles: `RETAILER`, `DISPATCHER`, `RIDER`.
   (You can use Django Admin or Django Shell for this).
2. Log in as Retailer -> Create a delivery.
3. Log in as Dispatcher -> See pending delivery -> Assign to Rider.
4. Log in as Rider -> See assigned delivery -> Mark as "Picked Up" -> Mark as "Delivered".
5. Log in as Retailer -> View delivery as "Delivered".
