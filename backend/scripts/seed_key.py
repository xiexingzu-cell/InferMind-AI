"""
Run once to create the first admin API key.

Usage:
    cd backend
    python scripts/seed_key.py --name "admin"
"""
import asyncio
import secrets
import argparse
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import AsyncSessionLocal, create_tables
from app.models.api_key import ApiKey


async def seed(name: str) -> None:
    await create_tables()
    key_value = "gw-" + secrets.token_urlsafe(32)
    async with AsyncSessionLocal() as session:
        key = ApiKey(name=name, key=key_value)
        session.add(key)
        await session.commit()
        print(f"\nOK API key created")
        print(f"  Name : {name}")
        print(f"  Key  : {key_value}")
        print(f"\nSave this key — it will not be shown again.\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed an admin API key")
    parser.add_argument("--name", default="admin", help="Key label")
    args = parser.parse_args()
    asyncio.run(seed(args.name))
