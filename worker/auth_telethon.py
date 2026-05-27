"""One-time Telethon user authentication.

Run this script manually to create the botfather_session file:
    uv run python auth_telethon.py

Telegram will send a login code to your phone (or another Telegram client).
Type the code when prompted. After this succeeds, you never need to run it again.

Non-interactive mode (for automation):
    uv run python auth_telethon.py --code 12345 --password "your-2fa-password"
"""

import argparse
import asyncio
import getpass
import sys

import os

from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

load_dotenv()

TG_API_ID = int(os.environ["TELEGRAM_API_ID"])
TG_API_HASH = os.environ["TELEGRAM_API_HASH"]
TG_PHONE = os.environ["TELEGRAM_PHONE"]
TG_SESSION = os.environ.get("TELEGRAM_SESSION", "./botfather_session")


async def main():
    parser = argparse.ArgumentParser(description="Telethon one-time auth")
    parser.add_argument("--code", type=str, help="Login code from Telegram", default=None)
    parser.add_argument("--password", type=str, help="2FA password (if enabled)", default=None)
    args = parser.parse_args()

    client = TelegramClient(TG_SESSION, TG_API_ID, TG_API_HASH)
    
    # Check if already authenticated
    await client.connect()
    if await client.is_user_authorized():
        print("✅ Telethon session is already authenticated!")
        await client.disconnect()
        sys.exit(0)

    print(f"Authenticating phone: {TG_PHONE}")
    print("Telegram is sending you a login code...")
    
    await client.send_code_request(TG_PHONE)
    
    if args.code:
        code = args.code
    else:
        # Try reading from stdin non-interactively
        print("Please enter the code you received: ", end="", flush=True)
        code = sys.stdin.readline().strip()
        if not code:
            print("❌ No code provided. Use --code or pipe the code.")
            print(f"   Example: echo '12345' | uv run python auth_telethon.py")
            await client.disconnect()
            sys.exit(1)
    
    try:
        await client.sign_in(TG_PHONE, code)
    except SessionPasswordNeededError:
        if args.password:
            password = args.password
        else:
            password = getpass.getpass("Please enter your 2FA Telegram password: ")
        await client.sign_in(password=password)
    
    print("✅ Telethon session authenticated successfully!")
    print(f"   Session file: {TG_SESSION}")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
