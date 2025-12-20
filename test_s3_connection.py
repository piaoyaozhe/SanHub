#!/usr/bin/env python3
"""Test S3 connection to OpenList S3 service."""

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# S3 configuration
ENDPOINT_URL = "http://27.106.102.5:5246"
ACCESS_KEY = "NRlZ/NxficSs3n8JR7Ns"
SECRET_KEY = "3L3hX+R+oDHLDnzr5r/xymyNLwwq80NRnGFkd9xt"
BUCKET_NAME = "video"

def test_s3_connection():
    """Test connection to OpenList S3 service."""
    try:
        s3 = boto3.client(
            "s3",
            endpoint_url=ENDPOINT_URL,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": "path"},
                connect_timeout=10,
                read_timeout=10,
            ),
        )

        print(f"Endpoint: {ENDPOINT_URL}")
        print(f"Bucket: {BUCKET_NAME}")
        print("-" * 40)

        print("Listing objects...")
        response = s3.list_objects(Bucket=BUCKET_NAME, MaxKeys=10)
        
        if "Contents" in response:
            print(f"✓ Found {len(response['Contents'])} objects:")
            for obj in response["Contents"]:
                size_mb = obj["Size"] / 1024 / 1024
                print(f"  - {obj['Key']} ({size_mb:.2f} MB)")
        else:
            print("✓ Bucket accessible (empty)")

        print("-" * 40)
        print("Connection test PASSED!")
        return True

    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "?")
        msg = e.response.get("Error", {}).get("Message", str(e))
        print(f"FAILED: [{code}] {msg}")
        return False
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    test_s3_connection()
