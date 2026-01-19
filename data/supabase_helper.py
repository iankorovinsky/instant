import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

_ENV_LOADED = False


def load_env(quiet: bool = False) -> None:
    """Load .env from the project root into process environment."""
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    env_path = Path(__file__).resolve().parent.parent / ".env"
    if not env_path.exists():
        raise FileNotFoundError(
            f".env file not found at {env_path}. Please create it in the project root."
        )

    load_dotenv(env_path, override=True)
    if not quiet:
        print(f"Loading environment from: {env_path}")
    _ENV_LOADED = True


def create_supabase_client(use_service_role: bool = True) -> Client:
    """Create and return Supabase client, optionally using service role key."""
    if not _ENV_LOADED:
        load_env(quiet=True)

    url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    if not url:
        raise ValueError(
            "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL."
        )

    if use_service_role:
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if not key:
            raise ValueError(
                "Missing SUPABASE_SERVICE_ROLE_KEY. "
                "For data ingestion with RLS enabled, you need the service role key."
            )
    else:
        key = (
            os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
            or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
        )
        if not key:
            raise ValueError(
                "Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "
                "or NEXT_PUBLIC_SUPABASE_ANON_KEY."
            )

    return create_client(url, key)
