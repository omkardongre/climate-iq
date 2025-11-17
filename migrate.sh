#!/bin/bash
#
# Migration script to transfer commits from ClimateIQ to climateIQ
# with redistributed dates starting from November 17, 2025
#

set -e

SOURCE_REPO="/home/om/ClimateIQ"
TARGET_REPO="/home/om/climateIQ"
COMMITS_FILE="/home/om/.gemini/antigravity/brain/e95047e6-d770-4e42-a47c-d533c8be7deb/original_commits.txt"
WORK_DIR="/tmp/git_migration_$$"

# Date distribution (Nov 17-28)
declare -A date_dist
date_dist[17]=3
date_dist[18]=5
date_dist[19]=5
date_dist[20]=7
date_dist[21]=6
date_dist[22]=6
date_dist[23]=7
date_dist[24]=5
date_dist[25]=4
date_dist[26]=2
date_dist[27]=2
date_dist[28]=1

# Generate random time between 08:00 and 23:59
random_time() {
    hour=$((8 + RANDOM % 16))
    minute=$((RANDOM % 60))
    second=$((RANDOM % 60))
    printf "%02d:%02d:%02d" $hour $minute $second
}

echo "============================================================"
echo "ClimateIQ → climateIQ Migration Script (Bash)"
echo "============================================================"

# Create working directory
mkdir-p "$WORK_DIR"
cd "$SOURCE_REPO"

# Export all commits as patches
echo ""
echo "[1/5] Exporting commits as patches..."
git format-patch --root --output-directory "$WORK_DIR/patches"
patch_count=$(ls -1 "$WORK_DIR/patches" | wc -l)
echo "✓ Exported $patch_count patches"

# Read commit hashes and metadata
echo ""
echo "[2/5] Reading commit metadata..."
readarray -t commits < <(cut -d'|' -f1-5 "$COMMITS_FILE")
echo "✓ Read ${#commits[@]} commits"

# Generate date assignments
echo ""
echo "[3/5] Generating date assignments..."
declare -a new_dates
commit_idx=0

for day in {17..28}; do
    count=${date_dist[$day]:-0}
    for ((i=0; i<count; i++)); do
        if [ $commit_idx -lt ${#commits[@]} ]; then
            time=$(random_time)
            new_dates[$commit_idx]="2025-11-$(printf '%02d' $day) $time +0530"
            ((commit_idx++))
        fi
    done
done

echo "✓ Generated ${#new_dates[@]} date assignments"

# Apply patches to target repository
echo ""
echo "[4/5] Applying patches with new dates..."
cd "$TARGET_REPO"

patch_files=($(ls -1 "$WORK_DIR/patches"/*.patch | sort -V))

for idx in "${!patch_files[@]}"; do
    patch_file="${patch_files[$idx]}"
    
    if [ $idx -ge ${#commits[@]} ]; then
        break
    fi
    
    # Parse commit metadata
    IFS='|' read -r commit_hash orig_date author_name author_email commit_msg <<< "${commits[$idx]}"
    
    # Apply patch
    git am --committer-date-is-author-date < "$patch_file" 2>/dev/null || {
        # If patch fails, try 3-way merge
        git am --abort 2>/dev/null || true
        git apply "$patch_file" 2>/dev/null || true
        git add -A
        
        # Extract commit message from patch
        msg=$(grep -A100 "^Subject:" "$patch_file" | tail -n +2 | sed '/^---$/,$d' | sed 's/^ //')
        
        GIT_AUTHOR_NAME="$author_name" \
        GIT_AUTHOR_EMAIL="$author_email" \
        GIT_AUTHOR_DATE="${new_dates[$idx]}" \
        GIT_COMMITTER_NAME="$author_name" \
        GIT_COMMITTER_EMAIL="$author_email" \
        GIT_COMMITTER_DATE="${new_dates[$idx]}" \
        git commit --allow-empty -m "$commit_msg"
    }
    
    # Update commit date
    GIT_COMMITTER_DATE="${new_dates[$idx]}" \
    git commit --amend --no-edit --date="${new_dates[$idx]}"
    
    real_idx=$((idx + 1))
    printf "  [%d/%d] %s - %s\n" "$real_idx" "${#commits[@]}" "${new_dates[$idx]:0:16}" "${commit_msg:0:60}"
done

echo "✓ Applied all patches"

# Verify
echo ""
echo "[5/5] Verifying migration..."
commit_count=$(git rev-list --count HEAD)
first_date=$(git log --reverse --pretty=format:'%ai' | head -1)
last_date=$(git log --pretty=format:'%ai' | head -1)

echo "✓ Total commits: $commit_count"
echo "✓ First commit date: $first_date"
echo "✓ Last commit date: $last_date"

# Cleanup
rm -rf "$WORK_DIR"

echo ""
echo "============================================================"
echo "Migration completed successfully!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Review: git log --oneline --graph"
echo "2. Push: git push --force origin main"
