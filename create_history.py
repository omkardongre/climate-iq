#!/usr/bin/env python3
"""
Script to create commit history for climateIQ repository
with dates starting from November 17, 2025
"""

import subprocess
import json
import random
import os

# Paths
COMMITS_FILE = "/home/om/.gemini/antigravity/brain/e95047e6-d770-4e42-a47c-d533c8be7deb/original_commits.txt"
DATE_MAPPING_FILE = "/home/om/.gemini/antigravity/brain/e95047e6-d770-4e42-a47c-d533c8be7deb/date_mapping.json"
SOURCE_REPO = "/home/om/ClimateIQ"
TARGET_REPO = "/home/om/climateIQ"

# Date distribution plan (Nov 17 onwards)
DATE_DISTRIBUTION = {
    17: 3, 18: 5, 19: 5, 20: 7, 21: 6, 22: 6,
    23: 7, 24: 5, 25: 4, 26: 2, 27: 2, 28: 1
}

def random_time():
    """Generate random time between 08:00-23:59"""
    h, m, s = random.randint(8, 23), random.randint(0, 59), random.randint(0, 59)
    return f"{h:02d}:{m:02d}:{s:02d}"

def run(cmd, cwd=None):
    """Run command and return output"""
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None

print("=" * 70)
print("Creating commit history for climateIQ (Nov 17-28, 2025)")
print("=" * 70)

# Read commits
print("\n[1/4] Reading commit metadata...")
with open(COMMITS_FILE, 'r') as f:
    commits_data = [line.strip().split('|') for line in f if line.strip()]
print(f"✓ Found {len(commits_data)} commits")

# Generate date mapping
print("\n[2/4] Generating date distribution...")
date_mapping = {}
idx = 0
for day, count in DATE_DISTRIBUTION.items():
    for _ in range(count):
        if idx >= len(commits_data):
            break
        commit_hash, _, author, email, msg = commits_data[idx]
        new_date = f"2025-11-{day:02d} {random_time()} +0530"
        date_mapping[idx] = {
            "date": new_date, "author": author, "email": email, 
            "message": msg, "old_hash": commit_hash
        }
        idx += 1

with open(DATE_MAPPING_FILE, 'w') as f:
    json.dump(date_mapping, f, indent=2)
print(f"✓ Created date mapping for {len(date_mapping)} commits")

# Apply commits by checking out each from source
print("\n[3/4] Creating commits with new dates...")
os.chdir(TARGET_REPO)

for i in range(len(date_mapping)):
    info = date_mapping[i]
    old_hash = info['old_hash']
    
    # Get list of all files in this commit (source repo)
    files_cmd = f"cd {SOURCE_REPO} && git ls-tree -r --name-only {old_hash}"
    files_list = subprocess.run(files_cmd, shell=True, capture_output=True, text=True).stdout.strip()
    
    if files_list:
        files = files_list.split('\n')
        
        # Extract each file from source commit
        for file_path in files:
            target_path = f"{TARGET_REPO}/{file_path}"
            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            
            # Extract file (binary safe)
            extract_cmd = f"cd {SOURCE_REPO} && git show {old_hash}:'{file_path}'"
            result = subprocess.run(extract_cmd, shell=True, capture_output=True)
            
            if result.returncode == 0:
                with open(target_path, 'wb') as f:
                    f.write(result.stdout)
    
    # Stage all files
    run("git add -A", TARGET_REPO)
    
    # Create commit with new date
    env = f"""GIT_AUTHOR_NAME="{info['author']}" GIT_AUTHOR_EMAIL="{info['email']}" \
GIT_AUTHOR_DATE="{info['date']}" GIT_COMMITTER_NAME="{info['author']}" \
GIT_COMMITTER_EMAIL="{info['email']}" GIT_COMMITTER_DATE="{info['date']}" """
    
    msg_safe = info['message'].replace('"', '\\"')
    run(f'{env} git commit --allow-empty -m "{msg_safe}"', TARGET_REPO)
    
    print(f"  [{i+1}/{len(date_mapping)}] {info['date'][:16]} - {info['message'][:55]}")

print("\n✓ Created all commits")

# Verify
print("\n[4/4] Verifying...")
count = run("git rev-list --count HEAD", TARGET_REPO)
first = run("git log --reverse --pretty=format:'%ai' | head -1", TARGET_REPO)
last = run("git log --pretty=format:'%ai' | head -1", TARGET_REPO)

print(f"✓ Total commits: {count}")
print(f"✓ First commit: {first}")
print(f"✓ Last commit: {last}")

print("\n" + "=" * 70)
print("SUCCESS! Repository ready to push.")
print("=" * 70)
print("\nNext step: git push --force origin main")
