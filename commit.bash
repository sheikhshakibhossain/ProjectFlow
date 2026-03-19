#!/bin/bash

# Move to parent directory
PARENT_DIR=".."
cd "$PARENT_DIR" || exit

echo "Scanning for Vite projects in: $(pwd)"
echo "--------------------------------------"

# Function to check if directory is a Vite project
is_vite_project() {
    local dir="$1"

    # Check for vite config files
    if ls "$dir"/vite.config.* >/dev/null 2>&1; then
        return 0
    fi

    # Check package.json for vite dependency
    if [ -f "$dir/package.json" ]; then
        if grep -q '"vite"' "$dir/package.json"; then
            return 0
        fi
    fi

    return 1
}

# Loop through directories
for dir in */ ; do
    dir="${dir%/}"  # remove trailing slash

    if is_vite_project "$dir"; then
        echo ""
        echo ">>> Found Vite project: $dir"

        cd "$dir" || continue

        # Initialize git if not exists
        if [ ! -d ".git" ]; then
            echo "Initializing git..."
            git init
        fi

        # Add all files
        git add .

        # Commit if there are changes
        if ! git diff --cached --quiet; then
            git commit -m "Initial commit for $dir"
            echo "Committed: $dir"
        else
            echo "No changes to commit in $dir"
        fi

        cd ..
    fi
done

echo ""
echo "Done processing all Vite projects."