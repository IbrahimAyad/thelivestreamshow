#!/usr/bin/env python3
"""
Upload Big Time Lucky 13 game assets to Supabase Storage
"""
import os
import requests
from pathlib import Path
import mimetypes

SUPABASE_URL = "https://vcniezwtltraqramjlux.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjbmllend0bHRyYXFyYW1qbHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ1MTgsImV4cCI6MjA3NTkwMDUxOH0.5PDpv3-DVZzjOVFLdsWibzOk5A3-4PI1OthU1EQNhTQ"
BUCKET_NAME = "game-assets"
BASE_DIR = "public/big-time-lucky-13"

def create_bucket_if_needed():
    """Create the storage bucket if it doesn't exist"""
    print("🗄️  Checking storage bucket...")

    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }

    # List buckets
    response = requests.get(
        f"{SUPABASE_URL}/storage/v1/bucket",
        headers=headers
    )

    if response.status_code != 200:
        print(f"❌ Error listing buckets: {response.text}")
        return False

    buckets = response.json()
    bucket_exists = any(b.get('name') == BUCKET_NAME for b in buckets)

    if not bucket_exists:
        print(f"📦 Creating bucket: {BUCKET_NAME}")
        create_response = requests.post(
            f"{SUPABASE_URL}/storage/v1/bucket",
            headers=headers,
            json={
                "name": BUCKET_NAME,
                "public": True,
                "file_size_limit": 52428800  # 50MB
            }
        )

        if create_response.status_code not in [200, 201]:
            print(f"❌ Error creating bucket: {create_response.text}")
            return False
        print("✅ Bucket created successfully")
    else:
        print("✅ Bucket already exists")

    return True

def upload_file(local_path, storage_path):
    """Upload a single file to Supabase storage"""
    try:
        with open(local_path, 'rb') as f:
            file_data = f.read()

        # Determine content type
        content_type, _ = mimetypes.guess_type(local_path)
        if not content_type:
            content_type = 'application/octet-stream'

        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": content_type,
        }

        # Upload with upsert
        response = requests.post(
            f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{storage_path}",
            headers=headers,
            data=file_data
        )

        if response.status_code in [200, 201]:
            print(f"✅ Uploaded: {storage_path}")
            return True
        else:
            print(f"❌ Failed to upload {storage_path}: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error uploading {storage_path}: {e}")
        return False

def main():
    print("🎮 Starting Big Time Lucky 13 asset upload...\n")

    # Create bucket
    if not create_bucket_if_needed():
        print("❌ Could not prepare storage bucket. Exiting.")
        return

    # Directories to upload
    directories = ['images', 'audio', 'video']
    total_files = 0
    uploaded_files = 0

    for dir_name in directories:
        dir_path = Path(BASE_DIR) / dir_name
        if not dir_path.exists():
            print(f"⚠️  Directory not found: {dir_path}")
            continue

        print(f"\n📂 Processing {dir_name}/...")

        # Get all files recursively
        for file_path in dir_path.rglob('*'):
            if file_path.is_file():
                total_files += 1

                # Calculate storage path relative to BASE_DIR
                relative_path = file_path.relative_to(BASE_DIR)
                storage_path = f"big-time-lucky-13/{relative_path}"

                if upload_file(str(file_path), storage_path):
                    uploaded_files += 1

    print(f"\n📊 Upload complete!")
    print(f"✅ Uploaded: {uploaded_files}/{total_files} files")

    if uploaded_files < total_files:
        print(f"⚠️  {total_files - uploaded_files} files failed to upload")

    print(f"\n🔗 Assets will be available at:")
    print(f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/big-time-lucky-13/")

if __name__ == "__main__":
    main()
