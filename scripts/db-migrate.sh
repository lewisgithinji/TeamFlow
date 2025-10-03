#!/bin/bash

# Database Migration Helper Script

set -e

echo "🗄️  TeamFlow Database Migration"
echo "================================"
echo ""

PS3="Select an option: "
options=("Create new migration" "Apply migrations" "Reset database" "Open Prisma Studio" "Quit")

select opt in "${options[@]}"
do
    case $opt in
        "Create new migration")
            read -p "Enter migration name: " migration_name
            pnpm --filter @teamflow/database db:migrate --name "$migration_name"
            break
            ;;
        "Apply migrations")
            pnpm db:migrate
            break
            ;;
        "Reset database")
            read -p "⚠️  This will delete all data. Are you sure? (yes/no) " -r
            if [[ $REPLY == "yes" ]]; then
                pnpm --filter @teamflow/database db:reset
                echo "✅ Database reset complete"
            else
                echo "❌ Cancelled"
            fi
            break
            ;;
        "Open Prisma Studio")
            pnpm db:studio
            break
            ;;
        "Quit")
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done
